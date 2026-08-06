import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoloGame } from './solo-game';

describe('SoloGame', () => {
  let component: SoloGame;
  let fixture: ComponentFixture<SoloGame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoloGame],
    }).compileComponents();

    fixture = TestBed.createComponent(SoloGame);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
