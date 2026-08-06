import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update the profile when saved', () => {
    component.toggleProfileEdit();
    component.editableProfile.username = 'Nova Runner';
    component.editableProfile.email = 'nova@dino.gg';
    component.editableProfile.membership = 'Trail Blazer';
    component.editableProfile.bio = 'Ready for every challenge.';

    component.saveProfile();

    expect(component.username).toBe('Nova Runner');
    expect(component.profileEmail).toBe('nova@dino.gg');
    expect(component.membership).toBe('Trail Blazer');
    expect(component.profileBio).toBe('Ready for every challenge.');
    expect(component.profileSavedMessage).toBe('Profile updated successfully.');
  });
});
