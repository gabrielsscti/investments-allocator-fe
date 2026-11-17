import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { InflowRitualComponent } from './inflow-ritual.component';
import { PortfolioStoreService } from '../../core/services/portfolio-store.service';
import { PlanResponse } from '../../core/models/inflow.models';

describe('InflowRitualComponent', () => {
  let component: InflowRitualComponent;
  let fixture: ComponentFixture<InflowRitualComponent>;
  let storeMock: any;

  const mockPlan: PlanResponse = {
    plan_id: 42,
    inflow_id: 1,
    status: 'PENDING',
    engine_version: 'v1.0.0',
    legs: [
      {
        leg_id: 1,
        sequence: 1,
        instrument: { id: 10, ticker: 'VALE3.SA', name: 'Vale' },
        status: 'PENDING',
        proposed_qty: '5',
        proposed_price_minor_units_per_unit: '6000',
        proposed_gross_minor_units: 30000,
        proposed_remainder_minor_units: 1500
      }
    ],
    expected_remainder_minor_units: 1500
  };

  beforeEach(async () => {
    storeMock = {
      summary: () => ({ macros: [] }),
      activePlan: signal<PlanResponse | null>(null),
      loading: signal(false),
      calculateInflow: jasmine.createSpy('calculateInflow').and.returnValue(of(mockPlan)),
      cancelPlan: jasmine.createSpy('cancelPlan').and.returnValue(of({ ...mockPlan, status: 'CANCELLED' }))
    };

    await TestBed.configureTestingModule({
      imports: [InflowRitualComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: PortfolioStoreService, useValue: storeMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InflowRitualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should submit savings amount to calculateInflow', () => {
    component['form'].patchValue({
      amount_minor_units: 500000,
      note: 'Aporte Regular'
    });

    component.onCalculate();

    expect(storeMock.calculateInflow).toHaveBeenCalledWith({
      amount_minor_units: 500000,
      currency: 'BRL',
      note: 'Aporte Regular'
    });
  });

  it('should render active plan when available in store', () => {
    storeMock.activePlan.set(mockPlan);
    fixture.detectChanges();

    const planSection = fixture.nativeElement.querySelector('.plan-section');
    expect(planSection).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Plano de Aporte #42');
    expect(fixture.nativeElement.textContent).toContain('15,00');
  });

  it('should discard plan on confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    storeMock.activePlan.set(mockPlan);
    fixture.detectChanges();

    component.onDiscardPlan();

    expect(storeMock.cancelPlan).toHaveBeenCalledWith(42);
  });
});
