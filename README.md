# Dino Runner

Angular canvas runner with solo play, Nakama multiplayer lobbies, profiles, and leaderboards.

## Run locally

Install dependencies with npm ci, then run npm start and open http://localhost:4200.

- npm test -- --watch=false: run the regression suite (backend and audio are mocked in component tests).
- npm run build: create the production bundle under dist/dino-game-angular.

## Game rules

- Up arrow / Jump button: jump. Down arrow / Duck button: duck.
- Solo: three lives, one point and one coin per passed obstacle, increasing speed every 20 seconds (five tiers).
- Multiplayer: four lives, seeded obstacles, one point per passed obstacle, increasing speed every 30 seconds, sudden death after three minutes of game simulation.
- Fixed 60 Hz simulation keeps ordinary gameplay consistent across render refresh rates. Catch-up is capped after long stalls; this is not server-authoritative multiplayer synchronization.
- Solo pause stops simulation time. Restart cancels the pending results redirect and clears transient state.

## Layout and backend

Shared desktop, portrait, and landscape adjustments are in src/responsive.css. The canvas preserves its proportions, controls support pointer cancellation, and dialogs can scroll on short screens.

The client currently connects to the Nakama host configured in src/app/services/nakama.ts. The Docker files under server are a starting point; the checked-in Lua module is empty. Live invitations, coin awards, and leaderboard availability depend on the deployed server configuration. Weekly/friends rankings are marked unavailable until supported.

Profile details are stored in Nakama storage and account fields. Test profile persistence and multiplayer with a configured backend before deployment. Component tests do not verify the live service.

Saved webpage files under public/theme1_files are excluded from build assets.
