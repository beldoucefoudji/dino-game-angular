import { Router } from '@angular/router';
import { testProviders } from '../../testing/test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Results } from './results';

describe('Results', () => {
  let component: Results;
  let fixture: ComponentFixture<Results>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Results],
      providers: testProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(Results);
    component = fixture.componentInstance;
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
