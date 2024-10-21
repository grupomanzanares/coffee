import { TestBed } from '@angular/core/testing';

import { MaestraService } from './maestra.service';

describe('MaestraService', () => {
  let service: MaestraService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaestraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
