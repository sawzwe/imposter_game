/**
 * Input validation and sanitization utilities
 */

// Sanitize player name - remove HTML tags and limit length
export function sanitizePlayerName(name: string): string {
  if (!name || typeof name !== "string") {
    return "";
  }

  // Remove HTML tags and trim
  let sanitized = name
    .replace(/<[^>]*>/g, "")
    .trim()
    .substring(0, 30); // Max 30 characters

  // Remove any remaining special characters that could be problematic
  sanitized = sanitized.replace(/[<>\"'&]/g, "");

  return sanitized || "Player";
}

// Validate and sanitize clue
export function sanitizeClue(clue: string): string {
  if (!clue || typeof clue !== "string") {
    return "";
  }

  // Remove HTML tags and limit length
  let sanitized = clue
    .replace(/<[^>]*>/g, "")
    .trim()
    .substring(0, 500); // Max 500 characters

  // Remove any remaining problematic characters
  sanitized = sanitized.replace(/[<>\"']/g, "");

  return sanitized;
}

// Validate room code format
export function validateRoomCode(code: string): boolean {
  if (!code || typeof code !== "string") {
    return false;
  }

  // Room code should be 6 alphanumeric characters (uppercase)
  const roomCodeRegex = /^[A-Z0-9]{6}$/;
  return roomCodeRegex.test(code.toUpperCase());
}

// Validate player ID format
export function validatePlayerId(playerId: string): boolean {
  if (!playerId || typeof playerId !== "string") {
    return false;
  }

  // Player ID should start with "player_" and contain alphanumeric/underscore
  const playerIdRegex = /^player_[a-zA-Z0-9_]+$/;
  return playerIdRegex.test(playerId);
}

// Validate room ID format
export function validateRoomId(roomId: string): boolean {
  if (!roomId || typeof roomId !== "string") {
    return false;
  }

  // Room ID should start with "room_" and contain alphanumeric/underscore
  const roomIdRegex = /^room_[A-Z0-9]+$/;
  return roomIdRegex.test(roomId);
}


