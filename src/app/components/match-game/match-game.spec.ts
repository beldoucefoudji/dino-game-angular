import { MatchGame } from './match-game';

describe('Multiplayer game rules', () => {
  let game: MatchGame; let state: any;
  beforeEach(() => {
    game = new MatchGame({} as any, { navigate: vi.fn() } as any,
      { getSocket: () => null, sendPosition: vi.fn(), sendHit: vi.fn(), sendElimination: vi.fn(), submitScore: async () => {}, awardCoins: async () => 0 } as any,
      {run: (f: () => void) => f()} as any, {markForCheck: vi.fn()} as any, {} as any, {play: vi.fn()} as any);
    state = game as any;
    state.dinos = [{color:'#4f9dff', userId:'local', username:'Runner', lane:0, y:0, velocityY:0, isJumping:false, isDucking:false, frameIndex:1, eliminated:false, isLocal:true, lives:4, score:0, freezeUntil:0, protectedUntil:0}];
  });
  afterEach(() => game.ngOnDestroy());
  it('keeps four lives and the existing hit protection', () => {
    state.obstacleX = 70; state.update(1000 / 60, 100);
    expect(state.dinos[0].lives).toBe(3);
    expect(state.dinos[0].freezeUntil).toBe(1600);
    expect(state.dinos[0].protectedUntil).toBe(3600);
    state.update(1000 / 60, 200); expect(state.dinos[0].lives).toBe(3);
  });
  it('awards one point per obstacle and preserves sudden death after three minutes', () => {
    state.obstacleX = 0; state.update(1000 / 60, 100); state.update(1000 / 60, 120);
    expect(state.dinos[0].score).toBe(1);
    expect(state.currentSpeedMultiplier(0)).toBe(1);
    expect(state.currentSpeedMultiplier(30000)).toBeCloseTo(1.15);
    expect(state.currentSpeedMultiplier(180000)).toBeCloseTo(Math.pow(1.15, 6) * 2);
    expect(game.isSuddenDeath).toBe(true);
  });
  it('uses the same obstacle sequence for the same race seed', () => {
    const a = state.seededRandom(123); const b = state.seededRandom(123);
    expect(Array.from({length:20}, () => a())).toEqual(Array.from({length:20}, () => b()));
  });
  it.each(['cactus', 'bird'])('does not reward a hit %s, but rewards the next avoided obstacle once', (type) => {
    const player = state.dinos[0];
    player.score = 5;
    state.obstacleType = type;
    state.obstacleX = 70;
    state.update(1000 / 60, 100);
    expect(player.lives).toBe(3);
    // Let the same obstacle travel behind the player after the collision.
    for (let frame = 1; frame <= 20; frame++) state.update(1000 / 60, 100 + frame * 1000 / 60);
    expect(player.score).toBe(5);
    // Respawn clears the hit marker; an avoided obstacle earns exactly one reward.
    state.obstacleX = -60;
    state.update(1000 / 60, 500);
    state.obstacleX = 0;
    state.update(1000 / 60, 520);
    state.update(1000 / 60, 540);
    expect(player.score).toBe(6);
  });
  it('includes the local dino color in race updates', () => {
    state.update(1000 / 60, 100);
    expect(state.nakama.sendPosition).toHaveBeenCalledWith('', expect.objectContaining({color:'#4f9dff'}));
  });
  it('tints the body while preserving the eyes and caches the sprite', () => {
    const data = new Uint8ClampedArray([29,96,76,255, 255,255,255,255]);
    const context = {drawImage:vi.fn(), getImageData:()=>({data}), putImageData:vi.fn()};
    const canvas = {width:0,height:0,getContext:()=>context};
    const spy = vi.spyOn(document, 'createElement').mockReturnValue(canvas as any);
    try {
      state.dinoSprite = {complete:true,naturalWidth:2,naturalHeight:1};
      expect(state.coloredSprite('#4f9dff')).toBe(canvas);
      expect([...data]).toEqual([79,157,255,255, 255,255,255,255]);
      expect(state.coloredSprite('#4f9dff')).toBe(canvas);
      expect(context.drawImage).toHaveBeenCalledTimes(1);
    } finally { spy.mockRestore(); }
  });
});
