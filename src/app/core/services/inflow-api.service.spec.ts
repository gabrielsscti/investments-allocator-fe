import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InflowApiService } from './inflow-api.service';
import { CreateInflowRequest, ExecuteLegRequest, PlanResponse, TradeResponse } from '../models/inflow.models';

describe('InflowApiService', () => {
  let service: InflowApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InflowApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(InflowApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create an inflow and return plan', () => {
    const request: CreateInflowRequest = {
      amount_minor_units: 500000,
      currency: 'BRL',
      note: 'Aporte de Maio'
    };

    const mockPlan: PlanResponse = {
      plan_id: 1,
      inflow_id: 1,
      status: 'PENDING',
      engine_version: 'v1.0.0',
      legs: [],
      expected_remainder_minor_units: 1200
    };

    service.createInflow(request).subscribe((res) => {
      expect(res).toEqual(mockPlan);
    });

    const req = httpMock.expectOne('/api/v1/inflows');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockPlan);
  });

  it('should query plans by status', () => {
    service.getPlans(['PENDING', 'PARTIALLY_EXECUTED']).subscribe((plans) => {
      expect(plans.length).toBe(1);
    });

    const req = httpMock.expectOne(
      (r) => r.url === '/api/v1/plans' &&
             r.params.getAll('status')?.includes('PENDING') === true &&
             r.params.getAll('status')?.includes('PARTIALLY_EXECUTED') === true
    );
    expect(req.request.method).toBe('GET');
    req.flush([{ plan_id: 1, status: 'PENDING', legs: [] }]);
  });

  it('should execute a plan leg', () => {
    const request: ExecuteLegRequest = {
      qty: '10',
      price_minor_units_per_unit: '4250',
      fees_minor_units: 0
    };

    const mockTrade: TradeResponse = {
      trade_id: 42,
      instrument_id: 1,
      qty: '10',
      price_minor_units_per_unit: '4250',
      gross_minor_units: 42500,
      fees_minor_units: 0,
      executed_at: '2026-11-17T00:00:00Z'
    };

    service.executeLeg(1, 10, request).subscribe((res) => {
      expect(res.trade_id).toBe(42);
    });

    const req = httpMock.expectOne('/api/v1/plans/1/legs/10/execute');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockTrade);
  });

  it('should cancel a plan leg', () => {
    service.cancelLeg(1, 10).subscribe((leg) => {
      expect(leg.status).toBe('CANCELLED');
    });

    const req = httpMock.expectOne('/api/v1/plans/1/legs/10/cancel');
    expect(req.request.method).toBe('POST');
    req.flush({ leg_id: 10, sequence: 1, status: 'CANCELLED' });
  });

  it('should cancel an entire plan', () => {
    service.cancelPlan(1).subscribe((plan) => {
      expect(plan.status).toBe('CANCELLED');
    });

    const req = httpMock.expectOne('/api/v1/plans/1/cancel');
    expect(req.request.method).toBe('POST');
    req.flush({ plan_id: 1, status: 'CANCELLED' });
  });
});
