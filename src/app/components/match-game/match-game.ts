import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NakamaService } from '../../services/nakama';

interface RaceDino {
  userId: string;
  username: string;
  lane: number;
  y: number;
  velocityY: number;
  isJumping: boolean;
  isDucking: boolean;
  frameIndex: number;
  eliminated: boolean;
  isLocal: boolean;
  lives: number;
  score: number;
  freezeUntil: number;
  protectedUntil: number;
  color: string;
}

interface StandingEntry {
  userId: string;
  username: string;
  score: number;
  eliminated: boolean;
  isLocal: boolean;
}

@Component({
  selector: 'app-match-game',
  imports: [],
  templateUrl: './match-game.html',
  styleUrl: './match-game.css'
})
export class MatchGame implements AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private dinoSprite = new Image();
  private animationFrameId = 0;
  private matchId = '';

  private keys: Record<string, boolean> = {};
  private dinos: RaceDino[] = [];
  private laneHeight = 70;

  private readonly groundOffset = 55;
  private readonly gravity = 0.6;
  private readonly jumpStrength = -12;
  private readonly startingLives = 4;
  private readonly freezeDurationMs = 1500;
  private readonly invincibleDurationMs = 2000;

  private rng: () => number = Math.random;
  private obstacleX = 800;
  private obstacleType: 'cactus' | 'bird' = 'cactus';
  private readonly baseObstacleSpeed = 4;

  private frameTimer = 0;
  private readonly frameDuration = 150;
  private lastTimestamp = 0;
  private lastBroadcast = 0;
  private lastStandingsUpdate = 0;
  private readonly standingsUpdateInterval = 300; // ms — how often the HTML panel refreshes

  private matchStartTime = 0;
  private readonly matchDurationMs = 180000;
  private readonly speedTierMs = 30000;
  isSuddenDeath = false;
  displaySecondsLeft = 180;

  // public, Angular-tracked property for the HTML standings panel
  standings: StandingEntry[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private nakama: NakamaService,
    private ngZone: NgZone
  ) {}

  async ngAfterViewInit() {
    this.matchId = this.route.snapshot.paramMap.get('matchId') ?? '';
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.dinoSprite.src = '/dino-sprite.png';

    this.rng = this.seededRandom(this.nakama.raceSeed);

    const socket = this.nakama.getSocket();
    const myUserId = this.nakama.getUserId();
    if (!socket || !myUserId) {
      this.router.navigate(['/dashboard']);
      return;
    }

    const match = await socket.joinMatch(this.matchId);
    const sortedIds = (match.presences ?? []).map(p => p.user_id).sort();

    this.dinos = sortedIds.map((userId, index) => ({
      userId,
      username: match.presences?.find(p => p.user_id === userId)?.username ?? 'Player',
      lane: index,
      y: 0,
      velocityY: 0,
      isJumping: false,
      isDucking: false,
      frameIndex: 1,
      eliminated: false,
      isLocal: userId === myUserId,
      lives: this.startingLives,
      score: 0,
      freezeUntil: 0,
      protectedUntil: 0,
      color: userId === myUserId ? this.nakama.getSelectedColor() : '#1D9E75'
    }));

    this.laneHeight = canvas.height / Math.max(this.dinos.length, 1);

    socket.onmatchdata = (matchData) => {
      const senderId = matchData.presence?.user_id;
      const dino = this.dinos.find(d => d.userId === senderId);
      if (!dino || dino.isLocal) return;

      const payload = JSON.parse(new TextDecoder().decode(matchData.data));

      if (matchData.op_code === 2) {
        dino.y = payload.y;
        dino.isJumping = payload.isJumping;
        dino.isDucking = payload.isDucking;
        dino.frameIndex = payload.frameIndex;
        dino.score = payload.score;
        dino.color = payload.color ?? dino.color;
      } else if (matchData.op_code === 3) {
        dino.eliminated = true;
      } else if (matchData.op_code === 4) {
        dino.lives = payload.lives;
        dino.freezeUntil = performance.now() + this.freezeDurationMs;
        dino.protectedUntil = performance.now() + this.freezeDurationMs + this.invincibleDurationMs;
      }
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    this.matchStartTime = performance.now();

    this.ngZone.runOutsideAngular(() => {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    });
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    const socket = this.nakama.getSocket();
    if (socket) socket.onmatchdata = () => {};
  }

  private seededRandom(seed: number): () => number {
    let t = seed;
    return () => {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), t | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private gameLoop = (timestamp: number) => {
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    this.update(deltaTime, timestamp);
    this.draw(timestamp);

    if (timestamp - this.lastStandingsUpdate > this.standingsUpdateInterval) {
      this.lastStandingsUpdate = timestamp;
      this.refreshStandings();
    }
  };

  // Steps back INTO Angular's zone just for this cheap update,
  // so the HTML standings panel actually re-renders.
  private refreshStandings() {
    const snapshot: StandingEntry[] = this.dinos
      .map(d => ({
        userId: d.userId,
        username: d.username,
        score: Math.floor(d.score),
        eliminated: d.eliminated,
        isLocal: d.isLocal
      }))
      .sort((a, b) => {
        if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1; // alive players first
        return b.score - a.score; // higher score = further ahead
      });

    this.ngZone.run(() => {
      this.standings = snapshot;
    });
  }

  private currentSpeedMultiplier(elapsedMs: number): number {
    const tier = Math.min(Math.floor(elapsedMs / this.speedTierMs), 6);
    let multiplier = Math.pow(1.15, tier);
    if (elapsedMs >= this.matchDurationMs) {
      this.isSuddenDeath = true;
      multiplier *= 2;
    }
    return multiplier;
  }

  private update(deltaTime: number, timestamp: number) {
    const me = this.dinos.find(d => d.isLocal);
    if (!me) return;

    const elapsedMs = timestamp - this.matchStartTime;
    this.displaySecondsLeft = Math.max(0, Math.ceil((this.matchDurationMs - elapsedMs) / 1000));
    const speedMultiplier = this.currentSpeedMultiplier(elapsedMs);
    const effectiveSpeed = this.baseObstacleSpeed * speedMultiplier;

    this.obstacleX -= effectiveSpeed;
    if (this.obstacleX < -50) {
      this.obstacleX = 960;
      this.obstacleType = this.rng() < 0.5 ? 'cactus' : 'bird';
    }

    if (!me.eliminated) {
      me.score += deltaTime * 0.01; // same "survival time" formula as Solo mode

      const isFrozen = timestamp < me.freezeUntil;
      const isProtected = timestamp < me.protectedUntil;

      if (!isFrozen) {
        if (this.keys['Space'] && !me.isJumping) {
          me.velocityY = this.jumpStrength;
          me.isJumping = true;
        }
        me.isDucking = !!this.keys['ArrowDown'] && !me.isJumping;

        me.velocityY += this.gravity;
        me.y = Math.min(0, me.y + me.velocityY);
        if (me.y >= 0) {
          me.y = 0;
          me.velocityY = 0;
          me.isJumping = false;
        }

        this.frameTimer += deltaTime;
        if (this.frameTimer >= this.frameDuration) {
          this.frameTimer = 0;
          me.frameIndex = me.frameIndex === 1 ? 2 : 1;
        }
      }

      if (!isProtected) {
        const dinoHeight = me.isDucking ? 40 : 64;
        const dinoDrawY = me.isDucking ? me.y + (64 - dinoHeight) : me.y;
        const obsY = this.obstacleType === 'cactus' ? 24 : -6;
        const obsW = this.obstacleType === 'cactus' ? 20 : 34;
        const obsH = this.obstacleType === 'cactus' ? 40 : 20;

        if (this.isColliding(50, dinoDrawY, 64, dinoHeight, this.obstacleX, obsY, obsW, obsH)) {
          me.lives -= 1;
          if (me.lives <= 0) {
            me.eliminated = true;
            this.nakama.sendElimination(this.matchId);
          } else {
            me.freezeUntil = timestamp + this.freezeDurationMs;
            me.protectedUntil = timestamp + this.freezeDurationMs + this.invincibleDurationMs;
            this.nakama.sendHit(this.matchId, me.lives);
          }
        }
      }
    }

    if (timestamp - this.lastBroadcast > 50) {
      this.lastBroadcast = timestamp;
      me.color = this.nakama.getSelectedColor();
      this.nakama.sendPosition(this.matchId, {
        y: me.y,
        isJumping: me.isJumping,
        isDucking: me.isDucking,
        frameIndex: me.frameIndex,
        score: me.score,
        color: me.color
      });
    }
  }

  private isColliding(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  private draw(timestamp: number) {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.ctx.fillStyle = this.isSuddenDeath ? '#b5502e' : '#535353';
    this.ctx.font = 'bold 14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      this.isSuddenDeath ? 'SUDDEN DEATH' : `${this.displaySecondsLeft}s`,
      canvas.width / 2, 16
    );

    for (const dino of this.dinos) {
      const laneTop = dino.lane * this.laneHeight;
      const groundY = laneTop + this.laneHeight - this.groundOffset;

      this.ctx.strokeStyle = dino.isLocal ? '#b5502e' : '#ccc';
      this.ctx.lineWidth = dino.isLocal ? 2 : 1;
      this.ctx.strokeRect(0, laneTop, canvas.width, this.laneHeight);

      this.ctx.fillStyle = '#8a7b72';
      this.ctx.font = '12px sans-serif';
      this.ctx.textAlign = 'left';
      const livesDisplay = '♥'.repeat(Math.max(dino.lives, 0));
      this.ctx.fillText(
        `${dino.username}${dino.isLocal ? ' (you)' : ''}  ${livesDisplay}  ·  ${Math.floor(dino.score)} pts`,
        10, laneTop + 16
      );

      const isFrozen = timestamp < dino.freezeUntil;
      const isProtected = timestamp < dino.protectedUntil;

      if (dino.eliminated) {
        this.ctx.globalAlpha = 0.3;
      } else if (isProtected && !isFrozen) {
        this.ctx.globalAlpha = Math.floor(timestamp / 100) % 2 === 0 ? 1 : 0.3;
      }

      const dinoHeight = dino.isDucking ? 40 : 64;
      const dinoDrawY = groundY + (dino.isDucking ? (64 - dinoHeight) : dino.y);
      let sx: number;
      if (dino.isJumping) sx = 3 * 64;
      else if (dino.isDucking) sx = dino.frameIndex === 1 ? 4 * 64 : 5 * 64;
      else sx = dino.frameIndex * 64;

      this.drawTintedDinoSprite(sx, dinoDrawY, dinoHeight, dino.color);

      if (this.obstacleType === 'cactus') {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(this.obstacleX, groundY + 24, 20, 40);
      } else {
        this.ctx.fillStyle = '#5588cc';
        this.ctx.fillRect(this.obstacleX, groundY - 6, 34, 20);
      }

      this.ctx.globalAlpha = 1;
    }
  }

  private drawTintedDinoSprite(sx: number, dinoDrawY: number, dinoHeight: number, color: string) {
    const spriteWidth = 64;
    const spriteHeight = 64;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = spriteWidth;
    tempCanvas.height = spriteHeight;

    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      this.ctx.drawImage(this.dinoSprite, sx, 0, spriteWidth, spriteHeight, 50, dinoDrawY, spriteWidth, dinoHeight);
      return;
    }

    tempCtx.drawImage(this.dinoSprite, sx, 0, spriteWidth, spriteHeight, 0, 0, spriteWidth, spriteHeight);
    tempCtx.globalCompositeOperation = 'source-atop';
    tempCtx.fillStyle = color;
    tempCtx.fillRect(0, 0, spriteWidth, spriteHeight);
    tempCtx.globalCompositeOperation = 'source-over';

    this.ctx.drawImage(tempCanvas, 50, dinoDrawY, spriteWidth, dinoHeight);
  }
}