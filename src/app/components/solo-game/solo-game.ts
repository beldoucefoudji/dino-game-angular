import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { NakamaService } from '../../services/nakama';
import { LanguageService } from '../../services/language';
import { SoundService } from '../../services/sound';

@Component({
  selector: 'app-solo-game',
  imports: [],
  templateUrl: './solo-game.html',
  styleUrl: './solo-game.css'
})
export class SoloGame implements AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  Math = Math;

  private ctx!: CanvasRenderingContext2D;
  private dinoSprite = new Image();
  private cactusSprite = new Image();
  private birdSprite = new Image();
  private animationFrameId = 0;

  private keys: Record<string, boolean> = {};

  score = 0;
  highScore = 0;
  isGameOver = false;
  isPaused = false;
  lives = 3;
  coins = 0;
  speedTier = 1;
  distancePercent = 0;
  username = 'Guest';

  private isJumping = false;
  private isDucking = false;
  private freezeUntil = 0;
  private protectedUntil = 0;

  private groundY = 340;
  private dinoY = this.groundY;
  private velocityY = 0;
  private readonly gravity = 0.6;
  private readonly jumpStrength = -12;

  private frameIndex = 1;
  private frameTimer = 0;
  private readonly frameDuration = 150;

  private obstacleX = 1200;
  private obstacleType: 'cactus' | 'bird' = 'cactus';
  private readonly baseSpeed = 4.5;
  private readonly resetX = 1200;
  private matchStartTime = 0;

  private lastTimestamp = 0;
  private readonly SW = 100;
  private readonly SH = 90;
  private readonly HIT_MARGIN = 14;
  private readonly OBS_MARGIN = 4;

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private nakama: NakamaService,
    public language: LanguageService,
    public sound: SoundService
  ) {}

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.dinoSprite.src = '/dino-pixel-sprite-v2.png';
    this.cactusSprite.src = '/cactus-pixel.png';
    this.birdSprite.src = '/bird-pixel.png';
    this.username = this.nakama.getUsername() ?? 'Guest';
    this.matchStartTime = performance.now();

    this.ngZone.runOutsideAngular(() => {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    });
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationFrameId);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    this.keys[e.code] = true;
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') e.preventDefault();
    if (e.code === 'Enter' && this.isGameOver) this.restart();
  }
  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent) { this.keys[e.code] = false; }

  pressJump() { this.keys['ArrowUp'] = true; }
  releaseJump() { this.keys['ArrowUp'] = false; }
  pressDuck() { this.keys['ArrowDown'] = true; }
  releaseDuck() { this.keys['ArrowDown'] = false; }

  togglePause() { this.sound.play(400); this.isPaused = !this.isPaused; }

  restart() {
    this.isGameOver = false;
    this.dinoY = this.groundY;
    this.velocityY = 0;
    this.obstacleX = this.resetX;
    this.score = 0;
    this.lives = 3;
    this.coins = 0;
    this.matchStartTime = performance.now();
  }

  onExit() { this.router.navigate(['/mode-select']); }

  private gameLoop = (timestamp: number) => {
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    if (!this.isPaused) this.update(deltaTime, timestamp);
    this.draw(timestamp);
  };

  private update(deltaTime: number, timestamp: number) {
    if (this.isGameOver) return;
    this.score += deltaTime * 0.01;
    this.coins = Math.floor(this.score / 50);
    this.distancePercent = (this.score % 100);

    const elapsed = timestamp - this.matchStartTime;
    this.speedTier = Math.min(1 + Math.floor(elapsed / 20000), 5);
    const speed = this.baseSpeed * (1 + (this.speedTier - 1) * 0.15);

    const isFrozen = timestamp < this.freezeUntil;
    const isProtected = timestamp < this.protectedUntil;

    if (!isFrozen) {
      if (this.keys['ArrowUp'] && !this.isJumping) {
        this.velocityY = this.jumpStrength;
        this.isJumping = true;
        this.sound.play(500, 0.05);
      }
      this.isDucking = !!this.keys['ArrowDown'] && !this.isJumping;

      this.velocityY += this.gravity;
      this.dinoY += this.velocityY;
      if (this.dinoY >= this.groundY) {
        this.dinoY = this.groundY;
        this.velocityY = 0;
        this.isJumping = false;
      }

      this.frameTimer += deltaTime;
      if (this.frameTimer >= this.frameDuration) {
        this.frameTimer = 0;
        this.frameIndex = this.frameIndex === 1 ? 2 : 1;
      }
    }

    this.obstacleX -= speed;
    if (this.obstacleX < -50) {
      this.obstacleX = this.resetX;
      this.obstacleType = Math.random() < 0.5 ? 'cactus' : 'bird';
    }

    if (!isProtected) {
      const dinoHeight = this.isDucking ? 40 : 64;
      const dinoDrawY = this.isDucking ? this.dinoY + (64 - dinoHeight) : this.dinoY;
      const obsY = this.obstacleType === 'cactus' ? this.groundY + 14 : this.groundY - 10;
      const obsW = this.obstacleType === 'cactus' ? 22 : 24;
      const obsH = this.obstacleType === 'cactus' ? 40 : 14;

      const dx = 50 + this.HIT_MARGIN, dy = dinoDrawY + this.HIT_MARGIN;
      const dw = 64 - this.HIT_MARGIN * 2, dh = dinoHeight - this.HIT_MARGIN * 2;
      const ox = this.obstacleX + this.OBS_MARGIN, oy = obsY + this.OBS_MARGIN;
      const ow = obsW - this.OBS_MARGIN * 2, oh = obsH - this.OBS_MARGIN * 2;

      if (this.isColliding(dx, dy, dw, dh, ox, oy, ow, oh)) {
        this.sound.play(220, 0.15);
        this.lives -= 1;
        if (this.lives <= 0) {
          this.isGameOver = true;
          this.sound.play(180, 0.2);
          if (this.score > this.highScore) this.highScore = this.score;
          if (this.nakama.isAuthenticated()) this.nakama.submitScore('dino_solo', this.score);
        } else {
          this.freezeUntil = timestamp + 1000;
          this.protectedUntil = timestamp + 1000 + 1500;
        }
      }
    }
  }

  private isColliding(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  private draw(timestamp: number) {
    const canvas = this.canvasRef.nativeElement;

    const sky = this.ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#2b2560');
    sky.addColorStop(0.5, '#7a4a6b');
    sky.addColorStop(1, '#e08a4f');
    this.ctx.fillStyle = sky;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.ctx.fillStyle = 'rgba(255, 220, 150, 0.85)';
    this.ctx.beginPath();
    this.ctx.arc(canvas.width * 0.5, this.groundY - 20, 55, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(40, 30, 55, 0.55)';
    for (let i = 0; i < 5; i++) {
      const bx = (i * 260 - (timestamp * 0.01) % 260);
      this.ctx.beginPath();
      this.ctx.moveTo(bx, this.groundY + 30);
      this.ctx.lineTo(bx + 90, this.groundY - 60);
      this.ctx.lineTo(bx + 180, this.groundY + 30);
      this.ctx.fill();
    }

    this.ctx.fillStyle = '#3a2a22';
    this.ctx.fillRect(0, this.groundY + 64, canvas.width, canvas.height - (this.groundY + 64));
    this.ctx.strokeStyle = '#5a4230';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.groundY + 64);
    this.ctx.lineTo(canvas.width, this.groundY + 64);
    this.ctx.stroke();

    let sx: number;
    let drawHeight = 64;
    let drawY = this.dinoY;
    if (this.isJumping) sx = 3 * this.SW;
    else if (this.isDucking) { sx = this.frameIndex === 1 ? 4 * this.SW : 5 * this.SW; drawHeight = 40; drawY = this.dinoY + (64 - drawHeight); }
    else sx = this.frameIndex * this.SW;

    if (this.obstacleType === 'cactus') {
      this.ctx.drawImage(this.cactusSprite, this.obstacleX, this.groundY + 14, 22, 40);
    } else {
      this.ctx.drawImage(this.birdSprite, this.obstacleX, this.groundY - 10, 24, 14);
    }

    const isProtected = timestamp < this.protectedUntil && timestamp >= this.freezeUntil;
    this.ctx.globalAlpha = isProtected ? (Math.floor(timestamp / 100) % 2 === 0 ? 1 : 0.35) : 1;
    this.ctx.drawImage(this.dinoSprite, sx, 0, this.SW, this.SH, 50, drawY, 64, drawHeight);
    this.ctx.globalAlpha = 1;

    if (this.isPaused && !this.isGameOver) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);
      this.ctx.fillStyle = '#eef2f6';
      this.ctx.font = 'bold 22px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }

    if (this.isGameOver) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);
      this.ctx.fillStyle = '#ff5d6c';
      this.ctx.font = 'bold 26px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
      this.ctx.fillStyle = '#eef2f6';
      this.ctx.font = '14px sans-serif';
      this.ctx.fillText('Press Enter to restart', canvas.width / 2, canvas.height / 2 + 20);
    }
  }
}