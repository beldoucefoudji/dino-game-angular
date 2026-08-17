import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme';
import { SoundService } from './services/sound';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  protected title = 'dino-game-angular';

  constructor(
    private themeService: ThemeService, 
    private sound: SoundService
  ) {} 

  ngOnInit(): void {
    this.themeService.initializeTheme();
    
    
    this.sound.startMusic('/theme1.mp3'); 
  }
}