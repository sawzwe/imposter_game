export interface Hero {
  id: number;
  name: string;
  name_loc: string;
  name_english_loc: string;
  primary_attr: number;
  complexity: number;
}

export interface ClashRoyaleCard {
  name: string;
  id: number;
  maxLevel: number;
  maxEvolutionLevel?: number;
  elixirCost: number;
  rarity?: string;
  iconUrls: {
    medium: string;
    heroMedium?: string;
    evolutionMedium?: string;
  };
}

export type GameType = "dota2" | "clashroyale";

export interface GameHint {
  type: string;
  value: string;
}

export interface Player {
  id: string;
  name: string;
  isImposter: boolean;
  hero?: Hero;
  card?: ClashRoyaleCard;
  clue?: string;
  hasSubmittedClue: boolean;
}

export interface GameRoom {
  id: string;
  players: Player[];
  currentHero?: Hero;
  currentCard?: ClashRoyaleCard;
  gameType?: GameType;
  hints?: GameHint[];
  gameState: "lobby" | "playing" | "voting" | "finished";
  round: number;
  clues: { playerId: string; clue: string }[];
  votes: { voterId: string; targetId: string }[];
  votingStartTime?: number; // Timestamp when voting phase started
}
