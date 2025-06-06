/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ViacepService } from './viacep.service';

describe('Service: Viacep', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ViacepService]
    });
  });

  it('should ...', inject([ViacepService], (service: ViacepService) => {
    expect(service).toBeTruthy();
  }));
});
