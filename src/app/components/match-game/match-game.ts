import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NakamaService } from '../../services/nakama';
import { LanguageService } from '../../services/language';
import { SoundService } from '../../services/sound';

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
  private cactusSprite = new Image();
  private birdSprite = new Image();
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
  private obstacleX = 1200;
  private obstacleType: 'cactus' | 'bird' = 'cactus';
  private readonly baseObstacleSpeed = 4.5;

  private frameTimer = 0;
  private readonly frameDuration = 150;
  private lastTimestamp = 0;
  private lastBroadcast = 0;
  private lastStandingsUpdate = 0;
  private readonly standingsUpdateInterval = 300;

  private matchStartTime = 0;
  private readonly matchDurationMs = 180000;
  private readonly speedTierMs = 30000;
  isSuddenDeath = false;
  displaySecondsLeft = 180;
  showStandings = true;
  standings: StandingEntry[] = [];

  private readonly SW = 100;
  private readonly SH = 90;
  private readonly HIT_MARGIN = 14;
  private readonly OBS_MARGIN = 4;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private nakama: NakamaService,
    private ngZone: NgZone,
    public language: LanguageService,
    public sound: SoundService
  ) {}

  async ngAfterViewInit() {
    this.matchId = this.route.snapshot.paramMap.get('matchId') ?? '';
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.dinoSprite.src = '/dino-pixel-sprite-v2.png';
    this.cactusSprite.src = '/cactus-pixel.png';
    this.birdSprite.src = '/bird-pixel.png';

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
      lane: index, y: 0, velocityY: 0, isJumping: false, isDucking: false, frameIndex: 1,
      eliminated: false, isLocal: userId === myUserId, lives: this.startingLives, score: 0,
      freezeUntil: 0, protectedUntil: 0
    }));

    this.laneHeight = canvas.height / Math.max(this.dinos.length, 1);

    socket.onmatchdata = (matchData) => {
      const senderId = matchData.presence?.user_id;
      const dino = this.dinos.find(d => d.userId === senderId);
      if (!dino || dino.isLocal) return;
      const payload = JSON.parse(new TextDecoder().decode(matchData.data));
      if (matchData.op_code === 2) {
        dino.y = payload.y; dino.isJumping = payload.isJumping; dino.isDucking = payload.isDucking;
        dino.frameIndex = payload.frameIndex; dino.score = payload.score;
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

  onExit() { this.router.navigate(['/dashboard']); }

  pressJump() { this.keys['ArrowUp'] = true; }
  releaseJump() { this.keys['ArrowUp'] = false; }
  pressDuck() { this.keys['ArrowDown'] = true; }
  releaseDuck() { this.keys['ArrowDown'] = false; }

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
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') e.preventDefault();
  };
  private onKeyUp = (e: KeyboardEvent) => { this.keys[e.code] = false; };

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

  private refreshStandings() {
    const snapshot: StandingEntry[] = this.dinos
      .map(d => ({ userId: d.userId, username: d.username, score: Math.floor(d.score), eliminated: d.eliminated, isLocal: d.isLocal }))
      .sort((a, b) => { if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1; return b.score - a.score; });
    this.ngZone.run(() => { this.standings = snapshot; });
  }

  private currentSpeedMultiplier(elapsedMs: number): number {
    const tier = Math.min(Math.floor(elapsedMs / this.speedTierMs), 6);
    let multiplier = Math.pow(1.15, tier);
    if (elapsedMs >= this.matchDurationMs) { this.isSuddenDeath = true; multiplier *= 2; }
    return multiplier;
  }

  private update(deltaTime: number, timestamp: number) {
    const me = this.dinos.find(d => d.isLocal);
    if (!me) return;

    const elapsedMs = timestamp - this.matchStartTime;
    this.displaySecondsLeft = Math.max(0, Math.ceil((this.matchDurationMs - elapsedMs) / 1000));
    const effectiveSpeed = this.baseObstacleSpeed * this.currentSpeedMultiplier(elapsedMs);

    this.obstacleX -= effectiveSpeed;
    if (this.obstacleX < -50) {
      this.obstacleX = 1200;
      this.obstacleType = this.rng() < 0.5 ? 'cactus' : 'bird';
    }

    if (!me.eliminated) {
      me.score += deltaTime * 0.01;
      const isFrozen = timestamp < me.freezeUntil;
      const isProtected = timestamp < me.protectedUntil;

      if (!isFrozen) {
        if (this.keys['ArrowUp'] && !me.isJumping) { me.velocityY = this.jumpStrength; me.isJumping = true; this.sound.play(500, 0.05); }
        me.isDucking = !!this.keys['ArrowDown'] && !me.isJumping;
        me.velocityY += this.gravity;
        me.y = Math.min(0, me.y + me.velocityY);
        if (me.y >= 0) { me.y = 0; me.velocityY = 0; me.isJumping = false; }

        this.frameTimer += deltaTime;
        if (this.frameTimer >= this.frameDuration) { this.frameTimer = 0; me.frameIndex = me.frameIndex === 1 ? 2 : 1; }
      }

      if (!isProtected) {
        const dinoHeight = me.isDucking ? 40 : 64;
        const dinoDrawY = me.isDucking ? me.y + (64 - dinoHeight) : me.y;
        const obsY = this.obstacleType === 'cactus' ? 14 : -10;
        const obsW = this.obstacleType === 'cactus' ? 22 : 24;
        const obsH = this.obstacleType === 'cactus' ? 40 : 14;

        const dx = 50 + this.HIT_MARGIN, dy = dinoDrawY + this.HIT_MARGIN;
        const dw = 64 - this.HIT_MARGIN * 2, dh = dinoHeight - this.HIT_MARGIN * 2;
        const ox = this.obstacleX + this.OBS_MARGIN, oy = obsY + this.OBS_MARGIN;
        const ow = obsW - this.OBS_MARGIN * 2, oh = obsH - this.OBS_MARGIN * 2;

        if (this.isColliding(dx, dy, dw, dh, ox, oy, ow, oh)) {
          this.sound.play(220, 0.15);
          me.lives -= 1;
          if (me.lives <= 0) {
            me.eliminated = true;
            // for result
            this.nakama.lastResult = {
            mode: 'multiplayer',
            score: me.score,
            highScore: me.score,
             standings: this.dinos.map(d => ({ username: d.username, score: d.score, isLocal: d.isLocal }))
            };
            setTimeout(() => this.router.navigate(['/results']), 1500);

            this.nakama.sendElimination(this.matchId);
            this.nakama.submitScore('dino_multiplayer', me.score);
            const stillAlive = this.dinos.filter(d => !d.eliminated).length;
            this.nakama.awardCoins(me.score, me.lives, this.dinos.length, stillAlive === 0);
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
      this.nakama.sendPosition(this.matchId, { y: me.y, isJumping: me.isJumping, isDucking: me.isDucking, frameIndex: me.frameIndex, score: me.score });
    }
  }

  private isColliding(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  private draw(timestamp: number) {
    const canvas = this.canvasRef.nativeElement;
    const sky = this.ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#1c1a40'); sky.addColorStop(1, '#5a3a55');
    this.ctx.fillStyle = sky;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const dino of this.dinos) {
      const laneTop = dino.lane * this.laneHeight;
      const groundY = laneTop + this.laneHeight - this.groundOffset;

      this.ctx.strokeStyle = dino.isLocal ? '#4ade80' : 'rgba(255,255,255,0.15)';
      this.ctx.lineWidth = dino.isLocal ? 2 : 1;
      this.ctx.strokeRect(0, laneTop, canvas.width, this.laneHeight);

      this.ctx.fillStyle = '#eef2f6';
      this.ctx.font = '11px sans-serif';
      this.ctx.textAlign = 'left';
      const hearts = '❤'.repeat(Math.max(dino.lives, 0));
      this.ctx.fillText(`${dino.username}${dino.isLocal ? ' (you)' : ''}  ${hearts}  ${Math.floor(dino.score)}pt`, 10, laneTop + 15);

      const isFrozen = timestamp < dino.freezeUntil;
      const isProtected = timestamp < dino.protectedUntil;
      if (dino.eliminated) this.ctx.globalAlpha = 0.3;
      else if (isProtected && !isFrozen) this.ctx.globalAlpha = Math.floor(timestamp / 100) % 2 === 0 ? 1 : 0.35;

      const dinoHeight = dino.isDucking ? 40 : 64;
      const dinoDrawY = groundY + (dino.isDucking ? (64 - dinoHeight) : dino.y);
      let sx: number;
      if (dino.isJumping) sx = 3 * this.SW;
      else if (dino.isDucking) sx = dino.frameIndex === 1 ? 4 * this.SW : 5 * this.SW;
      else sx = dino.frameIndex * this.SW;

      if (this.obstacleType === 'cactus') this.ctx.drawImage(this.cactusSprite, this.obstacleX, groundY + 14, 22, 40);
      else this.ctx.drawImage(this.birdSprite, this.obstacleX, groundY - 10, 24, 14);

      this.ctx.drawImage(this.dinoSprite, sx, 0, this.SW, this.SH, 50, dinoDrawY, 64, dinoHeight);
      this.ctx.globalAlpha = 1;
    }
  }
}