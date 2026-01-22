// Re-export database functions for backward compatibility
import db from "./db";
import { GameRoom } from "../types";

export async function createRoom(
  roomId: string,
  initialPlayer: { id: string; name: string }
): Promise<GameRoom> {
  return db.createRoom(roomId, initialPlayer);
}

export async function getRoom(roomId: string): Promise<GameRoom | null> {
  return db.getRoom(roomId);
}

export async function updateRoom(
  roomId: string,
  updates: Partial<GameRoom>
): Promise<GameRoom | null> {
  return db.updateRoom(roomId, updates);
}

export async function addPlayerToRoom(
  roomId: string,
  player: { id: string; name: string }
): Promise<GameRoom | null> {
  return db.addPlayerToRoom(roomId, player);
}

export async function deleteRoom(roomId: string): Promise<boolean> {
  return db.deleteRoom(roomId);
}

export async function cleanupInactiveRooms(maxAgeMs: number): Promise<number> {
  return db.cleanupInactiveRooms(maxAgeMs);
}
