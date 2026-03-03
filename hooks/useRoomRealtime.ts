"use client";

import { useEffect, useRef } from "react";
import { supabaseClient } from "@/app/lib/supabaseClient";
import { GameRoom } from "@/app/types";

/**
 * Subscribe to Supabase Realtime for a game room.
 * When the room row is updated, onUpdate is called with the new GameRoom data.
 * Returns true if Realtime is active, false if falling back to polling.
 */
export function useRoomRealtime(
  roomId: string | null,
  onUpdate: (room: GameRoom) => void,
  onRoomDeleted?: () => void,
): boolean {
  const onUpdateRef = useRef(onUpdate);
  const onRoomDeletedRef = useRef(onRoomDeleted);
  onUpdateRef.current = onUpdate;
  onRoomDeletedRef.current = onRoomDeleted;

  useEffect(() => {
    if (!roomId) return;

    const supabase = supabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const newRow = payload.new as { id: string; data: GameRoom; updated_at: string };
          if (newRow?.data) {
            onUpdateRef.current(newRow.data as GameRoom);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${roomId}`,
        },
        () => {
          onRoomDeletedRef.current?.();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return !!supabaseClient();
}
