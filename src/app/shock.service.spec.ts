import { TestBed } from '@angular/core/testing';

import { ShockService } from './shock.service';

describe('ShockService', () => {
  let service: ShockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
