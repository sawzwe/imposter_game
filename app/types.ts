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
  assignedCardId?: string; // For headsup_online: unique card id
  assignedCardName?: string; // Display name (hero/card name)
  assignedCardImage?: string; // Image URL for headsup_online
  score?: number; // For headsup_online: correct guesses
}

export type GameFormat = "imposter" | "headsup" | "headsup_online";

export interface GameRoom {
  id: string;
  players: Player[];
  currentHero?: Hero;
  currentCard?: ClashRoyaleCard;
  gameType?: GameType;
  gameFormat?: GameFormat;
  hints?: GameHint[];
  hintsEnabled?: boolean; // Whether hints are enabled for imposters
  gameState:
    | "lobby"
    | "playing"
    | "voting"
    | "finished"
    | "headsup_countdown"
    | "headsup_playing";
  round: number;
  clues: { playerId: string; clue: string }[];
  votes: { voterId: string; targetId: string }[];
  votingStartTime?: number; // Timestamp when voting phase started
  headsupCountdownEnd?: number; // Timestamp when countdown finishes
  lastUpdated?: number; // Timestamp of last update for efficient polling
}
