import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { PlanLegsTableComponent } from './plan-legs-table.component';
import { PortfolioStoreService } from '../../core/services/portfolio-store.service';
import { PlanResponse } from '../../core/models/inflow.models';

describe('PlanLegsTableComponent', () => {
  let component: PlanLegsTableComponent;
  let componentRef: ComponentRef<PlanLegsTableComponent>;
  let fixture: ComponentFixture<PlanLegsTableComponent>;
  let storeMock: any;
  let dialogMock: any;

  const mockPlan: PlanResponse = {
    plan_id: 1,
    inflow_id: 10,
    status: 'PENDING',
    engine_version: 'v1.0.0',
    legs: [
      {
        leg_id: 101,
        sequence: 1,
        instrument: { id: 1, ticker: 'ITUB4.SA', name: 'Itaú Unibanco' },
        status: 'PENDING',
        proposed_qty: '10',
        proposed_price_minor_units_per_unit: '3500',
        proposed_gross_minor_units: 35000,
        proposed_remainder_minor_units: 0
      }
    ],
    expected_remainder_minor_units: 0
  };

  beforeEach(async () => {
    storeMock = {
      summary: () => ({ macros: [] }),
      loading: () => false,
      cancelLeg: jasmine.createSpy('cancelLeg').and.returnValue(of({ status: 'CANCELLED' }))
    };

    await TestBed.configureTestingModule({
      imports: [PlanLegsTableComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: PortfolioStoreService, useValue: storeMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlanLegsTableComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('plan', mockPlan);
    spyOn(component['dialog'], 'open').and.returnValue({
      afterClosed: () => of(true),
      close: () => {}
    } as any);
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should render legs in table', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('ITUB4.SA');
    expect(text).toContain('350,00');
  });

  it('should open execute dialog on click', () => {
    component.openExecuteDialog(mockPlan.legs[0]);
    expect(component['dialog'].open).toHaveBeenCalled();
  });

  it('should cancel leg when user ignores it', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.cancelLeg(mockPlan.legs[0]);
    expect(storeMock.cancelLeg).toHaveBeenCalledWith(1, 101);
  });
});
