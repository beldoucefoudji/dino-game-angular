import { testProviders } from '../../testing/test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

import { Landing } from './landing';

describe('Landing', () => {
  let component: Landing;
  let fixture: ComponentFixture<Landing>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: testProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(Landing);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open mode selection from the primary CTA', () => {
    component.onStartGame();

    expect(router.navigate).toHaveBeenCalledWith(['/mode-select']);
  });

  it('should open the leaderboard', () => {
    component.onLeaderboard();

    expect(router.navigate).toHaveBeenCalledWith(['/leaderboard']);
  });
});
