import { Router } from '@angular/router';
import { testProviders } from '../../testing/test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModeSelect } from './mode-select';

describe('ModeSelect', () => {
  let component: ModeSelect;
  let fixture: ComponentFixture<ModeSelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModeSelect],
      providers: testProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(ModeSelect);
    component = fixture.componentInstance;
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
