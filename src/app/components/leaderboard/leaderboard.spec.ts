import { Router } from '@angular/router';
import { testProviders } from '../../testing/test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Leaderboard } from './leaderboard';

describe('Leaderboard', () => {
  let component: Leaderboard;
  let fixture: ComponentFixture<Leaderboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Leaderboard],
      providers: testProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(Leaderboard);
    component = fixture.componentInstance;
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
