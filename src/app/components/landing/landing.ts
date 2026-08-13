import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NakamaService } from '../../services/nakama';
import { LanguageService } from '../../services/language';
import { SoundService } from '../../services/sound';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing implements OnInit {
  username: string | null = null;
  showHowToPlay = false;

  private translations = {
    en: {
      title: 'DINO RUNNER', tagline: 'RACE · JUMP · SURVIVE',
      start: '▶ Start Game', leaderboard: '🏆 Leaderboard', howTo: '❔ How to Play', login: '👤 Login',
      howToTitle: 'How to Play',
      rule1: 'Space :Jump over cacti', rule2: 'Down Arrow : Duck under birds',
      rule3: 'You have 4 lives :a hit freezes you briefly, then grants short invincibility',
      rule4: 'Survive as long as possible : score is based on time survived',
      rule5: 'In multiplayer, the last player standing (or highest score when time runs out) wins',
      gotIt: 'Got it'
    },
    fr: {
      title: 'DINO RUNNER', tagline: 'COURS · SAUTE · SURVIS',
      start: '▶ Jouer', leaderboard: '🏆 Classement', howTo: '❔ Comment jouer', login: '👤 Connexion',
      howToTitle: 'Comment jouer',
      rule1: 'Espace : Sauter par-dessus les cactus', rule2: 'Flèche bas : Se baisser sous les oiseaux',
      rule3: 'Vous avez 4 vies : un coup vous gèle brièvement, puis accorde une invincibilité courte',
      rule4: 'Survivez le plus longtemps possible : le score dépend du temps de survie',
      rule5: 'En multijoueur, le dernier joueur en vie (ou le meilleur score) gagne',
      gotIt: 'Compris'
    }
  };

  constructor(
    private router: Router,
    private nakama: NakamaService,
    public language: LanguageService,
    public sound: SoundService
  ) {}

  ngOnInit() {
    this.username = this.nakama.isAuthenticated() ? this.nakama.getUsername() : null;
  }

  t(key: string): string {
    return (this.translations as any)[this.language.lang()][key];
  }

  onStartGame() {
    this.sound.play(500);
    this.router.navigate(['/mode-select']);
  }

  onLeaderboard() {
    this.sound.play(500);
    this.router.navigate(['/leaderboard']);
  }

  toggleHowToPlay() {
    this.sound.play(400);
    this.showHowToPlay = !this.showHowToPlay;
  }
}