/**
 * App branding and configuration constants.
 * Update these when changing the app name, domain, or links.
 */

export const APP = {
  /** Site name / brand (e.g. for impo.io) */
  name: "impo.io",
  /** Short game name used in UI */
  gameName: "impo",
  /** Meta description for SEO */
  description:
    "Multiplayer party games — impo, Heads Up, Guess Who. Play with Dota 2 heroes and Clash Royale cards.",
} as const;

export const LINKS = {
  github: "https://github.com/sawzwe",
  githubHandle: "@sawzwe",
  contactEmail: "sawzwe.matthew.md@gmail.com",
  linkedIn: "https://www.linkedin.com/in/saw-zwe/",
} as const;

export const STORAGE_KEYS = {
  theme: "impo-theme",
} as const;
