import { NakamaService } from '../../services/nakama';
import { Router } from '@angular/router';
import { testProviders } from '../../testing/test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Lobby } from './lobby';

describe('Lobby', () => {
  let component: Lobby;
  let fixture: ComponentFixture<Lobby>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Lobby],
      providers: testProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(Lobby);
    component = fixture.componentInstance;
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should bind the invite field to the component state', async () => {
    component.inviteUserId = 'friend-123';
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input[placeholder="Friend\'s User ID"]');
    expect(input.value).toBe('friend-123');
  });
  it('saves the selected color for the race and announces it to the room', async () => {
    const nakama = TestBed.inject(NakamaService);
    component.matchId = 'room';
    component.openLoadout();
    component.selectColor('#4f9dff');
    component.closeLoadout();
    expect(nakama.getSelectedColor()).toBe('#4f9dff');
    expect(nakama.sendDinoColor).toHaveBeenCalledWith('room');
    component.openLoadout();
    expect(component.selectedColor).toBe('#4f9dff');
    component.selectColor('invalid');
    expect(nakama.getSelectedColor()).toBe('#4f9dff');
  });
});
