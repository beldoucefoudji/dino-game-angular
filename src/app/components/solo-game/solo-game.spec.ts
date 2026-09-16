import { SoloGame } from './solo-game';

describe('SoloGame behavior', () => {
  let game: SoloGame;
  let state: any;
  const navigate = vi.fn();
  beforeEach(() => {
    vi.useFakeTimers(); localStorage.clear(); navigate.mockClear();
    game = new SoloGame({ navigate } as any, { runOutsideAngular: (fn: () => void) => fn() } as any,
      { markForCheck: vi.fn() } as any, { isAuthenticated: () => false } as any,
      { t: (key: string) => key } as any, { play: vi.fn() } as any);
    state = game as any;
  });
  afterEach(() => { game.ngOnDestroy(); vi.useRealTimers(); });
  it('cancels the results redirect when restarting and resets transient state', () => {
    state.lives = 1; state.obstacleX = 70;
    state.update(1000 / 60, 100);
    expect(game.isGameOver).toBe(true);
    state.isJumping = true; state.freezeUntil = 999; state.isPaused = true;
    game.restart(); vi.advanceTimersByTime(2000);
    expect(navigate).not.toHaveBeenCalled();
    expect(game.lives).toBe(3); expect(game.isPaused).toBe(false);
    expect(state.obstacleHit).toBe(false);
    expect(state.isJumping).toBe(false); expect(state.freezeUntil).toBe(0);
  });
  it('makes birds hit a running dino and allows ducking underneath', () => {
    state.obstacleType = 'bird'; state.obstacleX = 70;
    state.update(1000 / 60, 100);
    expect(game.lives).toBe(2);
    game.restart(); state.obstacleType = 'bird'; state.obstacleX = 70;
    game.pressDuck(); state.update(1000 / 60, 100);
    expect(game.lives).toBe(3);
  });
  it('saves the best score and clears held controls on loss of focus', () => {
    state.score = 8; state.lives = 1; state.obstacleX = 70;
    state.update(1000 / 60, 100);
    expect(localStorage.getItem('dino-solo-best')).toBe('8');
    game.restart(); game.pressJump(); game.onBlur();
    expect(state.keys).toEqual({}); expect(game.isPaused).toBe(true);
  });
  it.each(['cactus', 'bird'])('does not reward a hit %s, but rewards the next avoided obstacle once', (type) => {
    const player = game;
    player.score = 5;
    game.coins = 5;
    state.obstacleType = type;
    state.obstacleX = 70;
    state.update(1000 / 60, 100);
    expect(player.lives).toBe(2);
    // Let the same obstacle travel behind the player after the collision.
    for (let frame = 1; frame <= 20; frame++) state.update(1000 / 60, 100 + frame * 1000 / 60);
    expect(player.score).toBe(5);
    expect(game.coins).toBe(5);
    // Respawn clears the hit marker; an avoided obstacle earns exactly one reward.
    state.obstacleX = -60;
    state.update(1000 / 60, 500);
    state.obstacleX = 0;
    state.update(1000 / 60, 520);
    state.update(1000 / 60, 540);
    expect(player.score).toBe(6);
    expect(game.coins).toBe(6);
  });
});
