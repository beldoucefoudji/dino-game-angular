import { Routes } from '@angular/router';
import { Landing } from './components/landing/landing';
import { ModeSelect } from './components/mode-select/mode-select';
import { Auth } from './components/auth/auth';
import { Dashboard } from './components/dashboard/dashboard';
import { SoloGame } from './components/solo-game/solo-game';
import { Lobby } from './components/lobby/lobby';
import { MatchGame } from './components/match-game/match-game';
import { Leaderboard } from './components/leaderboard/leaderboard';
import { Results } from './components/results/results';
export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'mode-select', component: ModeSelect },
  { path: 'auth', component: Auth },
  { path: 'dashboard', component: Dashboard },
  
  { path: 'solo-game', component: SoloGame },
  { path: 'lobby/:matchId', component: Lobby },
  { path: 'match/:matchId', component: MatchGame },
  { path: 'leaderboard', component: Leaderboard },
  { path: 'results', component: Results },
];

