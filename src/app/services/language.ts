import { Injectable, signal } from '@angular/core';

export type Lang = 'en' | 'fr';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  lang = signal<Lang>((localStorage.getItem('dino_lang') as Lang) || 'en');

  private translations: Record<Lang, Record<string, string>> = {
    en: {
      title: 'DINO RUNNER',
      tagline: 'RACE • JUMP • SURVIVE',
      start: 'Start Game',
      leaderboard: 'Leaderboard',
      howTo: 'How to Play',
      login: 'Login',
      signup: 'Sign Up',
      howToTitle: 'HOW TO PLAY',
      gotIt: 'Got It!',
      rule1: 'Press UP arrow or TAP to Jump',
      rule2: 'Press DOWN arrow to Duck under flying birds',
      rule3: 'Avoid cacti and obstacles to keep your lives',
      rule4: 'Survive longer to increase your speed multiplier',
      rule5: 'Compete for the high score on the leaderboard!',
      submitLogin: 'Log In',
      submitSignup: 'Create Account',
      room: 'ROOM:',
      copy: 'Copy Code',
      players: 'Players'
    },
    fr: {
      title: 'DINO RUNNER',
      tagline: 'COURIR • SAUTER • SURVIVRE',
      start: 'Démarrer',
      leaderboard: 'Classement',
      howTo: 'Règles du jeu',
      login: 'Connexion',
      signup: 'Inscription',
      howToTitle: 'RÈGLES DU JEU',
      gotIt: 'Compris !',
      rule1: 'Appuyez sur HAUT ou TAP pour sauter',
      rule2: 'Appuyez sur BAS pour vous baisser sous les oiseaux',
      rule3: 'Évitez les obstacles pour garder vos vies',
      rule4: 'Survivez plus longtemps pour augmenter la vitesse',
      rule5: 'Battez le meilleur score au classement !',
      submitLogin: 'Se connecter',
      submitSignup: 'Créer un compte',
      room: 'SALLE :',
      copy: 'Copier le code',
      players: 'Joueurs'
    }
  };

  toggle() {
    const next: Lang = this.lang() === 'en' ? 'fr' : 'en';
    this.lang.set(next);
    localStorage.setItem('dino_lang', next);
  }

  // Helper method to look up translated strings cleanly
  t(key: string): string {
    const currentLang = this.lang();
    return this.translations[currentLang]?.[key] ?? key;
  }
}