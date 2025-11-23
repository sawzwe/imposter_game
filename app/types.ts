export interface Hero {
  id: number;
  name: string;
  name_loc: string;
  name_english_loc: string;
  primary_attr: number;
  complexity: number;
}

export interface Player {
  id: string;
  name: string;
  isImposter: boolean;
  hero?: Hero;
  clue?: string;
  hasSubmittedClue: boolean;
}

export interface GameRoom {
  id: string;
  players: Player[];
  currentHero?: Hero;
  gameState: "lobby" | "playing" | "voting" | "finished";
  round: number;
  clues: { playerId: string; clue: string }[];
  votes: { voterId: string; targetId: string }[];
}

