import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-solo-game',
  imports: [],
  templateUrl: './solo-game.html',
  styleUrl: './solo-game.css'
})
export class SoloGame implements AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private dinoSprite = new Image();
  private animationFrameId = 0;

  private keys: Record<string, boolean> = {};

  private score = 0;
  private highScore = 0;
  private isGameOver = false;
  private isJumping = false;
  private isDucking = false;

  private groundY = 250;
  private dinoY = this.groundY;
  private velocityY = 0;
  private readonly gravity = 0.6;
  private readonly jumpStrength = -12;

  private frameIndex = 1;
  private frameTimer = 0;
  private readonly frameDuration = 150;

  private obstacleX = 800;
  private obstacleType: 'cactus' | 'bird' = 'cactus';
  private readonly obstacleSpeed = 4;
  private readonly cactusWidth = 20;
  private readonly cactusHeight = 40;
  private readonly birdWidth = 34;
  private readonly birdHeight = 20;

  private lastTimestamp = 0;

  constructor(private router: Router, private ngZone: NgZone) {}

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    this.dinoSprite.src = '/dino-sprite.png';

   
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
    if (e.code === 'Space') e.preventDefault();

    if (e.code === 'Enter' && this.isGameOver) {
      this.isGameOver = false;
      this.dinoY = this.groundY;
      this.velocityY = 0;
      this.obstacleX = 800;
      this.score = 0;
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent) {
    this.keys[e.code] = false;
  }

  onExit() {
    this.router.navigate(['/dashboard']);
  }

  private gameLoop = (timestamp: number) => {
    this.animationFrameId = requestAnimationFrame(this.gameLoop);

    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    this.update(deltaTime);
    this.draw();
  };

  private update(deltaTime: number) {
    if (this.isGameOver) return;

    this.score += deltaTime * 0.01;

    if (this.keys['Space'] && !this.isJumping) {
      this.velocityY = this.jumpStrength;
      this.isJumping = true;
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

    this.obstacleX -= this.obstacleSpeed;
    if (this.obstacleX < -50) {
      this.obstacleX = 800;
      this.obstacleType = Math.random() < 0.5 ? 'cactus' : 'bird';
    }

    const dinoHeight = this.isDucking ? 40 : 64;
    const dinoDrawY = this.isDucking ? this.dinoY + (64 - dinoHeight) : this.dinoY;

    let obsX: number, obsY: number, obsW: number, obsH: number;
    if (this.obstacleType === 'cactus') {
      obsX = this.obstacleX; obsY = this.groundY + 24; obsW = this.cactusWidth; obsH = this.cactusHeight;
    } else {
      obsX = this.obstacleX; obsY = this.groundY - 6; obsW = this.birdWidth; obsH = this.birdHeight;
    }

    if (this.isColliding(50, dinoDrawY, 64, dinoHeight, obsX, obsY, obsW, obsH)) {
      this.isGameOver = true;
      if (this.score > this.highScore) this.highScore = this.score;
    }
  }

  private isColliding(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  private draw() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.ctx.fillStyle = '#535353';
    this.ctx.font = '16px sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('Score: ' + Math.floor(this.score), canvas.width - 10, 25);
    this.ctx.fillText('Best: ' + Math.floor(this.highScore), canvas.width - 10, 45);

    let sx: number;
    let drawHeight = 64;
    let drawY = this.dinoY;

    if (this.isJumping) {
      sx = 3 * 64;
    } else if (this.isDucking) {
      sx = this.frameIndex === 1 ? 4 * 64 : 5 * 64;
      drawHeight = 40;
      drawY = this.dinoY + (64 - drawHeight);
    } else {
      sx = this.frameIndex * 64;
    }

    if (this.obstacleType === 'cactus') {
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(this.obstacleX, this.groundY + 24, this.cactusWidth, this.cactusHeight);
    } else {
      this.ctx.fillStyle = '#5588cc';
      this.ctx.fillRect(this.obstacleX, this.groundY - 6, this.birdWidth, this.birdHeight);
    }

    this.ctx.drawImage(this.dinoSprite, sx, 0, 64, 64, 50, drawY, 64, drawHeight);

    if (this.isGameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '24px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
      this.ctx.font = '14px sans-serif';
      this.ctx.fillText('Press Enter to restart', canvas.width / 2, canvas.height / 2 + 20);
    }
  }
}