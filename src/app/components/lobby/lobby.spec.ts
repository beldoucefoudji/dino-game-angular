import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Lobby } from './lobby';

describe('Lobby', () => {
  let component: Lobby;
  let fixture: ComponentFixture<Lobby>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Lobby],
    }).compileComponents();

    fixture = TestBed.createComponent(Lobby);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should bind the invite field to the component state', () => {
    component.inviteUserId = 'friend-123';
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[placeholder="Friend\'s User ID"]');
    expect(input.value).toBe('friend-123');
  });
});
