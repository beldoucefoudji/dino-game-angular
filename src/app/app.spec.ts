import { SoundService } from './services/sound';
import { testProviders } from './testing/test-providers';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: testProviders(),
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the route outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });
  it('starts the bundled background audio on app entry', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(TestBed.inject(SoundService).startMusic).toHaveBeenCalledWith('/theme2.ogg');
  });
});
