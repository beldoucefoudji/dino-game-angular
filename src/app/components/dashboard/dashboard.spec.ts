import { Router } from '@angular/router';
import { testProviders } from '../../testing/test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: testProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should save profile details without changing the account email', async () => {
    component.toggleProfileEdit();
    component.editableProfile.username = 'Nova Runner';
    component.editableProfile.email = 'nova@dino.gg';
    component.editableProfile.membership = 'Trail Blazer';
    component.editableProfile.bio = 'Ready for every challenge.';

    await component.saveProfile();

    expect(component.username).toBe('Nova Runner');
    expect(component.profileEmail).toBe('runner@example.com');
    expect(component.membership).toBe('Trail Blazer');
    expect(component.profileBio).toBe('Ready for every challenge.');
    expect(component.profileSavedMessage).toBe('Profile updated successfully.');
  });
});
