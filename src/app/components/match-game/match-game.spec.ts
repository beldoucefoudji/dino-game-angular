import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchGame } from './match-game';

describe('MatchGame', () => {
  let component: MatchGame;
  let fixture: ComponentFixture<MatchGame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchGame],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchGame);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
