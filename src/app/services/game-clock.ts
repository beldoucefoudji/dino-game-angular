/** Fixed 60 Hz simulation; rendering may run at any refresh rate. */
export class GameClock {
  readonly stepMs = 1000 / 60;
  time = 0;
  private previous: number | null = null;
  private accumulator = 0;

  reset() { this.time = 0; this.previous = null; this.accumulator = 0; }

  advance(timestamp: number, paused: boolean, update: (step: number, time: number) => void) {
    if (this.previous === null) { this.previous = timestamp; return; }
    const delta = Math.max(0, Math.min(timestamp - this.previous, 250));
    this.previous = timestamp;
    if (paused) { this.accumulator = 0; return; }
    this.accumulator += delta;
    while (this.accumulator + 0.000001 >= this.stepMs) {
      this.accumulator -= this.stepMs;
      this.time += this.stepMs;
      update(this.stepMs, this.time);
    }
  }
}
