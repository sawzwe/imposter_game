import { GameRoom } from "../types";

// Database interface - can be swapped between implementations
export interface Database {
  createRoom(
    roomId: string,
    initialPlayer: { id: string; name: string }
  ): Promise<GameRoom>;
  getRoom(roomId: string): Promise<GameRoom | null>;
  updateRoom(
    roomId: string,
    updates: Partial<GameRoom>
  ): Promise<GameRoom | null>;
  addPlayerToRoom(
    roomId: string,
    player: { id: string; name: string }
  ): Promise<GameRoom | null>;
  deleteRoom(roomId: string): Promise<boolean>;
}

// In-memory implementation (for local dev/testing)
class InMemoryDatabase implements Database {
  private gameRooms = new Map<string, GameRoom>();

  async createRoom(
    roomId: string,
    initialPlayer: { id: string; name: string }
  ): Promise<GameRoom> {
    const room: GameRoom = {
      id: roomId,
      players: [
        {
          id: initialPlayer.id,
          name: initialPlayer.name,
          isImposter: false,
          hasSubmittedClue: false,
        },
      ],
      gameState: "lobby",
      round: 1,
      clues: [],
      votes: [],
    };

    this.gameRooms.set(roomId, room);
    return room;
  }

  async getRoom(roomId: string): Promise<GameRoom | null> {
    return this.gameRooms.get(roomId) || null;
  }

  async updateRoom(
    roomId: string,
    updates: Partial<GameRoom>
  ): Promise<GameRoom | null> {
    const room = this.gameRooms.get(roomId);
    if (!room) return null;

    const updatedRoom = {
      ...room,
      ...updates,
      lastUpdated: Date.now(), // Always update timestamp
    };
    this.gameRooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  async addPlayerToRoom(
    roomId: string,
    player: { id: string; name: string }
  ): Promise<GameRoom | null> {
    const room = this.gameRooms.get(roomId);
    if (!room) return null;

    const newPlayer = {
      id: player.id,
      name: player.name,
      isImposter: false,
      hasSubmittedClue: false,
    };

    const updatedRoom = {
      ...room,
      players: [...room.players, newPlayer],
    };

    this.gameRooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(roomId: string): Promise<boolean> {
    return this.gameRooms.delete(roomId);
  }
}

// Supabase implementation
class SupabaseDatabase implements Database {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }
  }

  private async getClient() {
    try {
      // Dynamic import to avoid bundling in client
      const { createClient } = await import("@supabase/supabase-js");

      if (!this.supabaseUrl || !this.supabaseKey) {
        throw new Error("Supabase credentials not configured");
      }

      return createClient(this.supabaseUrl, this.supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: "public",
        },
      });
    } catch (error) {
      console.error("Error creating Supabase client:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to create Supabase client"
      );
    }
  }

  async createRoom(
    roomId: string,
    initialPlayer: { id: string; name: string }
  ): Promise<GameRoom> {
    const room: GameRoom = {
      id: roomId,
      players: [
        {
          id: initialPlayer.id,
          name: initialPlayer.name,
          isImposter: false,
          hasSubmittedClue: false,
        },
      ],
      gameState: "lobby",
      round: 1,
      clues: [],
      votes: [],
    };

    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from("game_rooms").insert({
        id: roomId,
        data: room,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Supabase createRoom error:", error);
        throw error;
      }
      return room;
    } catch (error) {
      console.error("Error in createRoom:", error);
      throw error;
    }
  }

  async getRoom(roomId: string): Promise<GameRoom | null> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from("game_rooms")
        .select("data")
        .eq("id", roomId)
        .single();

      if (error) {
        console.error("Supabase getRoom error:", error);
        return null;
      }

      if (!data || !data.data) {
        return null;
      }

      return data.data as GameRoom;
    } catch (error) {
      console.error("Error in getRoom:", error);
      return null;
    }
  }

  async updateRoom(
    roomId: string,
    updates: Partial<GameRoom>
  ): Promise<GameRoom | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;

    const updatedRoom = {
      ...room,
      ...updates,
      lastUpdated: Date.now(), // Always update timestamp
    };

    const supabase = await this.getClient();
    const { error } = await supabase
      .from("game_rooms")
      .update({
        data: updatedRoom,
        updated_at: new Date().toISOString(),
      })
      .eq("id", roomId);

    if (error) throw error;
    return updatedRoom;
  }

  async addPlayerToRoom(
    roomId: string,
    player: { id: string; name: string }
  ): Promise<GameRoom | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;

    const newPlayer = {
      id: player.id,
      name: player.name,
      isImposter: false,
      hasSubmittedClue: false,
    };

    const updatedRoom = {
      ...room,
      players: [...room.players, newPlayer],
    };

    return this.updateRoom(roomId, updatedRoom);
  }

  async deleteRoom(roomId: string): Promise<boolean> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from("game_rooms")
      .delete()
      .eq("id", roomId);

    return !error;
  }
}

// Export the appropriate database based on environment
let db: Database;

if (process.env.USE_SUPABASE === "true") {
  db = new SupabaseDatabase();
} else {
  db = new InMemoryDatabase();
}

export default db;
