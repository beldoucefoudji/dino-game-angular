import { TestBed } from '@angular/core/testing';

import { Nakama } from './nakama';

describe('Nakama', () => {
  let service: Nakama;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Nakama);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
