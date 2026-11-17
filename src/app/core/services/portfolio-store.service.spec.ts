import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PortfolioStoreService } from './portfolio-store.service';
import { PortfolioApiService } from './portfolio-api.service';
import { InflowApiService } from './inflow-api.service';
import { PortfolioSummaryResponse } from '../models/portfolio.models';
import { PlanResponse, TradeResponse } from '../models/inflow.models';

describe('PortfolioStoreService', () => {
  let store: PortfolioStoreService;
  let portfolioApiSpy: jasmine.SpyObj<PortfolioApiService>;
  let inflowApiSpy: jasmine.SpyObj<InflowApiService>;

  const mockSummary: PortfolioSummaryResponse = {
    total_minor_units: 10000000,
    macros: [
      {
        name: 'Ações BR',
        target_bps: 4000,
        current_minor_units: 3500000,
        target_minor_units: 4000000,
        delta_minor_units: 500000,
        instruments: []
      }
    ]
  };

  const mockPlan: PlanResponse = {
    plan_id: 1,
    inflow_id: 10,
    status: 'PENDING',
    engine_version: 'v1.0.0',
    legs: [
      {
        leg_id: 100,
        sequence: 1,
        instrument: { id: 1, ticker: 'VALE3.SA', name: 'Vale' },
        status: 'PENDING',
        proposed_gross_minor_units: 100000,
        proposed_remainder_minor_units: 500
      }
    ],
    expected_remainder_minor_units: 500
  };

  beforeEach(() => {
    portfolioApiSpy = jasmine.createSpyObj('PortfolioApiService', [
      'getSummary',
      'createInstrument',
      'updateInstrument',
      'updateHolding',
      'setQuarantine',
      'deleteInstrument'
    ]);

    inflowApiSpy = jasmine.createSpyObj('InflowApiService', [
      'createInflow',
      'getPlans',
      'getPlan',
      'executeLeg',
      'cancelLeg',
      'cancelPlan'
    ]);

    portfolioApiSpy.getSummary.and.returnValue(of(mockSummary));
    inflowApiSpy.getPlans.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        PortfolioStoreService,
        { provide: PortfolioApiService, useValue: portfolioApiSpy },
        { provide: InflowApiService, useValue: inflowApiSpy }
      ]
    });

    store = TestBed.inject(PortfolioStoreService);
  });

  it('should be created with initial null states', () => {
    expect(store).toBeTruthy();
    expect(store.summary()).toBeNull();
    expect(store.activePlan()).toBeNull();
    expect(store.loading()).toBeFalse();
    expect(store.error()).toBeNull();
  });

  it('should load summary into signal', () => {
    store.loadSummary();
    expect(portfolioApiSpy.getSummary).toHaveBeenCalled();
    expect(store.summary()).toEqual(mockSummary);
    expect(store.error()).toBeNull();
  });

  it('should set error signal if loadSummary fails', () => {
    portfolioApiSpy.getSummary.and.returnValue(throwError(() => new Error('Server offline')));
    store.loadSummary();
    expect(store.error()).toBe('Server offline');
  });

  it('should rehydrate active plan', () => {
    inflowApiSpy.getPlans.and.returnValue(of([mockPlan]));
    store.loadActivePlan();
    expect(inflowApiSpy.getPlans).toHaveBeenCalled();
    expect(store.activePlan()).toEqual(mockPlan);
  });

  it('should calculate inflow and set activePlan signal', () => {
    inflowApiSpy.createInflow.and.returnValue(of(mockPlan));
    store.calculateInflow({ amount_minor_units: 100000, currency: 'BRL' }).subscribe((plan) => {
      expect(plan).toEqual(mockPlan);
    });
    expect(store.activePlan()).toEqual(mockPlan);
    expect(store.error()).toBeNull();
  });

  it('should execute leg, refresh active plan and reload summary', () => {
    const mockTrade: TradeResponse = {
      trade_id: 1,
      instrument_id: 1,
      qty: '10',
      price_minor_units_per_unit: '10000',
      gross_minor_units: 100000,
      fees_minor_units: 0,
      executed_at: '2026-11-17T00:00:00Z'
    };

    inflowApiSpy.executeLeg.and.returnValue(of(mockTrade));
    inflowApiSpy.getPlan.and.returnValue(of({
      ...mockPlan,
      status: 'PARTIALLY_EXECUTED',
      legs: [{ ...mockPlan.legs[0], status: 'EXECUTED' }]
    }));

    store.executeLeg(1, 100, { qty: '10', price_minor_units_per_unit: '10000', fees_minor_units: 0 }).subscribe();

    expect(inflowApiSpy.executeLeg).toHaveBeenCalled();
    expect(inflowApiSpy.getPlan).toHaveBeenCalledWith(1);
    expect(portfolioApiSpy.getSummary).toHaveBeenCalled();
  });
});
