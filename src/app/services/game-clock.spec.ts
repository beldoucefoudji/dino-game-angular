import { GameClock } from './game-clock';

describe('GameClock', () => {
  it('runs the same simulation at 30, 60, 120 and 144 Hz', () => {
    const steps = [30, 60, 120, 144].map(hz => {
      const clock = new GameClock(); let count = 0;
      for (let i = 0; i <= hz * 10; i++) clock.advance(i * 1000 / hz, false, () => count++);
      expect(clock.time).toBeCloseTo(10000);
      return count;
    });
    expect(steps).toEqual([600, 600, 600, 600]);
  });
  it('does not count paused time or jump forward on resume', () => {
    const clock = new GameClock(); const update = vi.fn();
    clock.advance(0, false, update);
    clock.advance(100, false, update);
    clock.advance(60000, true, update);
    clock.advance(60000 + 1000 / 60, false, update);
    expect(update).toHaveBeenCalledTimes(7);
    expect(clock.time).toBeCloseTo(7000 / 60);
  });
  it('caps catch-up work after a stalled frame and resets cleanly', () => {
    const clock = new GameClock(); const update = vi.fn();
    clock.advance(0, false, update); clock.advance(60000, false, update);
    expect(update).toHaveBeenCalledTimes(15);
    clock.reset(); expect(clock.time).toBe(0);
    clock.advance(70000, false, update);
    expect(update).toHaveBeenCalledTimes(15);
  });
});
