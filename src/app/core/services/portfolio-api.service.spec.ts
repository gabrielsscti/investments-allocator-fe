import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PortfolioApiService } from './portfolio-api.service';
import {
  CreateInstrumentRequest,
  PortfolioSummaryResponse,
  SetHoldingRequest,
  SetQuarantineRequest,
  UpdateInstrumentRequest
} from '../models/portfolio.models';

describe('PortfolioApiService', () => {
  let service: PortfolioApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PortfolioApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(PortfolioApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch portfolio summary', () => {
    const mockSummary: PortfolioSummaryResponse = {
      total_minor_units: 5000000,
      macros: [
        {
          name: 'Ações BR',
          target_bps: 5000,
          current_minor_units: 2500000,
          target_minor_units: 2500000,
          delta_minor_units: 0,
          instruments: []
        }
      ]
    };

    service.getSummary().subscribe((res) => {
      expect(res).toEqual(mockSummary);
      expect(res.total_minor_units).toBe(5000000);
    });

    const req = httpMock.expectOne('/api/v1/summary');
    expect(req.request.method).toBe('GET');
    req.flush(mockSummary);
  });

  it('should create an instrument under a macro', () => {
    const request: CreateInstrumentRequest = {
      name: 'Itaú Unibanco PN',
      ticker: 'ITUB4.SA',
      asset_kind: 'PRICE_QUOTED',
      score: 10,
      lot_rules: 'WHOLE_ONLY',
      min_investment_minor_units: 0
    };

    service.createInstrument('Ações BR', request).subscribe((res) => {
      expect(res.ticker).toBe('ITUB4.SA');
    });

    const req = httpMock.expectOne('/api/v1/macros/A%C3%A7%C3%B5es%20BR/instruments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ id: 1, ...request, macro_name: 'Ações BR', currency: 'BRL', target_bps_within_macro: 10000, quarantined: false });
  });

  it('should update instrument score or metadata', () => {
    const request: UpdateInstrumentRequest = { score: 8 };

    service.updateInstrument(1, request).subscribe((res) => {
      expect(res.score).toBe(8);
    });

    const req = httpMock.expectOne('/api/v1/instruments/1');
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 1, name: 'ITUB4', ticker: 'ITUB4.SA', score: 8 });
  });

  it('should update position holding', () => {
    const request: SetHoldingRequest = { qty: '100' };

    service.updateHolding(1, request).subscribe();

    const req = httpMock.expectOne('/api/v1/positions/1/holding');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush(null);
  });

  it('should set quarantine status', () => {
    const request: SetQuarantineRequest = { quarantined: true, note: 'Governança em risco' };

    service.setQuarantine(1, request).subscribe();

    const req = httpMock.expectOne('/api/v1/instruments/1/quarantine');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush(null);
  });

  it('should delete unheld instrument', () => {
    service.deleteInstrument(1).subscribe();

    const req = httpMock.expectOne('/api/v1/instruments/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
