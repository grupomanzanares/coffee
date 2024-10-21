import { TestBed } from '@angular/core/testing';

import { VpsService } from './vps.service';

describe('VpsService', () => {
  let service: VpsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VpsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
