import { Injectable, signal } from '@angular/core';

export type Lang = 'en' | 'fr';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  lang = signal<Lang>((localStorage.getItem('dino_lang') as Lang) || 'en');

  private translations: Record<Lang, Record<string, string>> = {
    en: {
      guideClose: "Close guide",
      guideIntro: "Choose your mode, dodge obstacles, and see how far you can run. Here is how to get started.",
      guideStartTitle: "1. Start a run",
      guideStartText: "Select Start Game, then Solo Run to play as a guest. To race with friends, sign up or log in first, then select Multiplayer.",
      guideControlsTitle: "2. Jump and duck",
      guideControlsText: "On a keyboard, use the Up arrow to jump over cacti and the Down arrow to duck under birds. On a phone or tablet, use the Jump and Duck buttons. Hold Duck to stay low and release it to stand up.",
      guideSoloTitle: "3. Solo mode",
      guideSoloText: "Start with 3 lives. A collision costs one life and briefly freezes your dinosaur, followed by a short protection period. Speed increases every 20 seconds, up to 5 tiers. Use the pause button to pause or resume.",
      guideMultiTitle: "4. Race with friends",
      guideMultiText: "Choose Multiplayer to create a room and share its code. Friends enter that code on the mode selection screen to join. Once everyone is in the lobby, start the race. Each runner has 4 lives and the same seeded obstacle sequence. Speed rises every 30 seconds; after 3 minutes, sudden death increases it further. The race ends when at most one runner remains.",
      guideScoringTitle: "5. Earn points by avoiding obstacles",
      guideScoringText: "Successfully passing an obstacle earns 1 point. In solo mode, it also earns 1 coin. If you hit that obstacle, it earns NO point and NO solo coin when it passes behind you. You keep the points you earned earlier.",
      guideResultsTitle: "6. Results and another run",
      guideResultsText: "After a solo game ends or a multiplayer race finishes, the results screen shows your score. Choose Play Again for another run or return to the menu. Solo best scores are saved on this browser. Open Leaderboard from the landing page to view global solo scores when the server is available.",
      guidePreferencesTitle: "7. Language and sound",
      guidePreferencesText: "Use the globe button to switch between English and French. Use the speaker button to mute or unmute music and sound effects.",
      gameCanvas: 'Dino Runner. Use Up to jump and Down to duck, or the buttons below.',
      jump: 'JUMP', duck: 'DUCK', score: 'SCORE', best: 'BEST', speed: 'SPEED',
      paused: 'PAUSED', gameOver: 'GAME OVER', restartHint: 'Press Enter to restart',
      suddenDeath: 'SUDDEN DEATH', standings: 'Standings', you: 'you',
      back: 'Back', changeLanguage: 'Change language', mute: 'Mute sound', unmute: 'Unmute sound',
      pause: 'Pause', resume: 'Resume', toggleStandings: 'Toggle standings',
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
      guideClose: "Fermer le guide",
      guideIntro: "Choisissez un mode, évitez les obstacles et allez le plus loin possible. Voici comment commencer.",
      guideStartTitle: "1. Commencer une partie",
      guideStartText: "Choisissez Démarrer, puis Solo pour jouer sans compte. Pour jouer avec des amis, inscrivez-vous ou connectez-vous, puis choisissez Multijoueur.",
      guideControlsTitle: "2. Sauter et se baisser",
      guideControlsText: "Au clavier, utilisez la flèche haut pour sauter au-dessus des cactus et la flèche bas pour passer sous les oiseaux. Sur mobile ou tablette, utilisez les boutons Sauter et Baisser. Maintenez Baisser pour rester baissé, puis relâchez pour vous relever.",
      guideSoloTitle: "3. Mode solo",
      guideSoloText: "Vous commencez avec 3 vies. Une collision coûte une vie et immobilise brièvement le dinosaure, puis une courte protection suit. La vitesse augmente toutes les 20 secondes, jusqu’à 5 niveaux. Le bouton pause permet de suspendre et reprendre la partie.",
      guideMultiTitle: "4. Jouer avec des amis",
      guideMultiText: "Choisissez Multijoueur pour créer une salle et partager son code. Vos amis saisissent ce code sur l’écran de choix du mode. Quand tout le monde est dans la salle, lancez la course. Chaque joueur a 4 vies et la même suite d’obstacles. La vitesse augmente toutes les 30 secondes. Après 3 minutes, la mort subite l’augmente davantage. La course se termine lorsqu’il reste au plus un joueur.",
      guideScoringTitle: "5. Gagner des points",
      guideScoringText: "Un obstacle évité rapporte 1 point et, en solo, 1 pièce. Si vous le percutez, cet obstacle ne rapporte AUCUN point ni AUCUNE pièce en solo lorsqu’il passe derrière vous. Les points gagnés avant restent acquis.",
      guideResultsTitle: "6. Résultats et nouvelle partie",
      guideResultsText: "Les résultats affichent votre score à la fin de la partie ou de la course. Choisissez Rejouer ou revenez au menu. Le record solo est conservé dans ce navigateur. Depuis l’accueil, ouvrez Classement pour voir les scores solo mondiaux lorsque le serveur est disponible.",
      guidePreferencesTitle: "7. Langue et son",
      guidePreferencesText: "Le globe permet de choisir le français ou l’anglais. Le haut-parleur coupe ou active la musique et les effets sonores.",
      gameCanvas: 'Dino Runner. Flèche haut pour sauter, flèche bas pour se baisser, ou utilisez les boutons.',
      jump: 'SAUTER', duck: 'BAISSER', score: 'SCORE', best: 'RECORD', speed: 'VITESSE',
      paused: 'PAUSE', gameOver: 'PARTIE TERMINÉE', restartHint: 'Entrée pour recommencer',
      suddenDeath: 'MORT SUBITE', standings: 'Classement', you: 'vous',
      back: 'Retour', changeLanguage: 'Changer de langue', mute: 'Couper le son', unmute: 'Activer le son',
      pause: 'Pause', resume: 'Reprendre', toggleStandings: 'Afficher le classement',
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