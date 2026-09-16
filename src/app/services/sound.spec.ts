import { SoundService } from './sound';

describe('Background music', () => {
  let service: SoundService;
  let audio: any;
  const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
  beforeEach(() => {
    localStorage.clear();
    audio = { src: '', paused: true, currentTime: 0, muted: false, loop: false, volume: 1,
      play: vi.fn(async () => { audio.paused = false; }),
      pause: vi.fn(() => { audio.paused = true; }) };
    vi.stubGlobal('Audio', class { constructor() { return audio; } });
    service = new SoundService();
  });
  afterEach(() => { service.ngOnDestroy(); vi.unstubAllGlobals(); });
  it('starts and loops the MP3 without resetting it on repeated requests', async () => {
    service.startMusic('/theme1.mp3'); await flush();
    expect(audio.src).toContain('/theme1.mp3'); expect(audio.loop).toBe(true);
    audio.currentTime = 42;
    service.startMusic('/theme1.mp3');
    expect(audio.currentTime).toBe(42); expect(audio.play).toHaveBeenCalledTimes(1);
  });
  it('retries on user interaction when autoplay is blocked', async () => {
    audio.play.mockRejectedValueOnce(new Error('Autoplay blocked'));
    service.startMusic('/theme1.mp3'); await flush();
    window.dispatchEvent(new Event('click')); await flush();
    expect(audio.play).toHaveBeenCalledTimes(2); expect(audio.paused).toBe(false);
  });
  it('mutes immediately and resumes at the same position when unmuted', async () => {
    service.startMusic('/theme1.mp3'); await flush(); audio.currentTime = 42;
    service.toggleMute(); window.dispatchEvent(new Event('click')); await flush();
    expect(audio.paused).toBe(true); expect(audio.play).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('dino_muted')).toBe('true');
    service.toggleMute(); await flush();
    expect(audio.paused).toBe(false); expect(audio.currentTime).toBe(42);
  });
  it('honors a saved mute preference on arrival', async () => {
    service.ngOnDestroy(); localStorage.setItem('dino_muted', 'true');
    service = new SoundService(); service.startMusic('/theme1.mp3');
    window.dispatchEvent(new Event('keydown')); await flush();
    expect(audio.play).not.toHaveBeenCalled();
  });
  it('stops on leaving and resumes after browser back navigation', async () => {
    service.startMusic('/theme1.mp3'); await flush();
    window.dispatchEvent(new Event('pagehide'));
    window.dispatchEvent(new Event('click')); expect(audio.paused).toBe(true);
    window.dispatchEvent(new Event('pageshow')); await flush();
    expect(audio.paused).toBe(false);
    service.stopMusic(); window.dispatchEvent(new Event('click')); await flush();
    expect(audio.paused).toBe(true);
  });
  it('does not restart if muted while a play request is pending', async () => {
    let resolve!: () => void;
    audio.play.mockImplementationOnce(() => new Promise<void>(r => { resolve = r; }));
    service.startMusic('/theme1.mp3'); service.toggleMute();
    audio.paused = false; resolve(); await flush();
    expect(audio.paused).toBe(true);
  });
});
