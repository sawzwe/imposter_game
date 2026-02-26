# Imposter

A multiplayer party game with Dota 2 heroes and Clash Royale cards. Play with friends on the same device or across multiple devices.

---

## Game Modes

### Imposter
- One player is the imposter — they don’t see the shared hero/card.
- Others see it and give one-word clues.
- Everyone votes to find the imposter.
- Supports optional hints for the imposter (attribute, complexity, elixir, etc.).
- **Min 3 players**

### Heads Up (single device)
- Hold the device to your forehead.
- Others see the card and answer yes/no questions.
- Formats: Dota 2 Heroes or Clash Royale Cards.
- Got it / Skip / Next flow.
- **1+ players**

### Heads Up (multi-device)
- Countdown, then each player turns their phone to show their assigned character.
- Ask yes/no questions to guess.
- **Min 3 players**

### Online Heads Up
- Each player gets a unique card visible to everyone else but themselves.
- Other players see your card; you see theirs.
- Tap **Correct** when someone guesses right to rotate their card and track scores.
- Designed for 2-player friendly play.
- **Min 2 players**

---

## Design Systems

Switch between themes in the footer:

| Theme      | Vibe                 | Typography           |
|------------|----------------------|----------------------|
| **Default**   | Clean dark UI        | DM Sans + Rajdhani   |
| **Cyberpunk** | Blade Runner / neon  | Share Tech Mono + Orbitron |
| **Solarpunk** | Eco-futuristic, nature | DM Sans + Nunito |

Themes live in `app/styles/themes/` and use CSS variables. Theme choice is stored in `localStorage`.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4, Phosphor icons
- **Data:** Supabase (optional) or in-memory
- **Cards:** Dota 2 API, Clash Royale API (cached in Supabase via `npm run sync-cards`)

---

## Routes

| Route             | Purpose                         |
|-------------------|---------------------------------|
| `/`               | Home — create/join, lobby, game |
| `/headsup`        | Heads Up format select         |
| `/headsup/dota`   | Heads Up single-device (Dota)   |
| `/headsup/clash`  | Heads Up single-device (Clash)  |
| `/about`          | About, team, contact            |

---

## Roadmap

- [ ] Login system and user accounts
- [ ] Supabase persistence for production

---

## Team

**Imposter** by [@sawzwe](https://github.com/sawzwe)

- [GitHub](https://github.com/sawzwe)
- [LinkedIn](https://www.linkedin.com/in/saw-zwe/)
- [Email](mailto:sawzwe.matthew.md@gmail.com)

---

## Version

`v0.1.0` — see `package.json`
