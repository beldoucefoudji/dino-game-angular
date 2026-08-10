import { TestBed } from '@angular/core/testing';

import { NakamaService } from './nakama';

describe('NakamaService', () => {
  let service: NakamaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NakamaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should persist the selected dino color', () => {
    service.setSelectedColor('#5588cc');

    expect(service.getSelectedColor()).toBe('#5588cc');
  });
});
