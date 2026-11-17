import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MaintenanceComponent } from './maintenance.component';
import { PortfolioStoreService } from '../../core/services/portfolio-store.service';
import { PortfolioSummaryResponse } from '../../core/models/portfolio.models';

describe('MaintenanceComponent', () => {
  let component: MaintenanceComponent;
  let fixture: ComponentFixture<MaintenanceComponent>;
  let storeMock: any;
  let dialogMock: any;
  let breakpointObserverMock: any;

  const mockSummary: PortfolioSummaryResponse = {
    total_minor_units: 5000000,
    macros: [
      {
        name: 'Ações BR',
        target_bps: 5000,
        current_minor_units: 2500000,
        target_minor_units: 2500000,
        delta_minor_units: 0,
        instruments: [
          {
            instrument: {
              id: 1,
              macro_name: 'Ações BR',
              name: 'Itaú Unibanco PN',
              ticker: 'ITUB4.SA',
              asset_kind: 'PRICE_QUOTED',
              currency: 'BRL',
              score: 10,
              target_bps_within_macro: 10000,
              lot_rules: 'WHOLE_ONLY',
              min_investment_minor_units: 0,
              quarantined: false,
              holding_qty: '100'
            },
            price_per_unit_minor_units: 3500,
            current_value_minor_units: 350000,
            quote_stale: false,
            feasible: true
          },
          {
            instrument: {
              id: 2,
              macro_name: 'Ações BR',
              name: 'Novo Ativo Sem Saldo',
              ticker: 'NOVO3.SA',
              asset_kind: 'PRICE_QUOTED',
              currency: 'BRL',
              score: 8,
              target_bps_within_macro: 0,
              lot_rules: 'WHOLE_ONLY',
              min_investment_minor_units: 0,
              quarantined: false,
              holding_qty: '0'
            },
            price_per_unit_minor_units: 1000,
            current_value_minor_units: 0,
            quote_stale: false,
            feasible: true
          }
        ]
      }
    ]
  };

  beforeEach(async () => {
    storeMock = {
      summary: signal<PortfolioSummaryResponse | null>(mockSummary),
      loading: signal(false),
      loadSummary: jasmine.createSpy('loadSummary'),
      updateScore: jasmine.createSpy('updateScore').and.returnValue(of(undefined)),
      updateHolding: jasmine.createSpy('updateHolding').and.returnValue(of(undefined)),
      deleteInstrument: jasmine.createSpy('deleteInstrument').and.returnValue(of(undefined))
    };

    breakpointObserverMock = {
      observe: jasmine.createSpy('observe').and.returnValue(
        of({ matches: false, breakpoints: {} } as BreakpointState)
      )
    };

    await TestBed.configureTestingModule({
      imports: [MaintenanceComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: PortfolioStoreService, useValue: storeMock },
        { provide: BreakpointObserver, useValue: breakpointObserverMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MaintenanceComponent);
    component = fixture.componentInstance;
    spyOn(component['dialog'], 'open').and.returnValue({
      afterClosed: () => of(true),
      close: () => {}
    } as any);
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should render desktop table when isMobile is false', () => {
    component.isMobile.set(false);
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('table');
    expect(table).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('ITUB4.SA');
  });

  it('should render mobile cards when isMobile is true', () => {
    component.isMobile.set(true);
    fixture.detectChanges();

    const mobileCards = fixture.nativeElement.querySelectorAll('.mobile-asset-card');
    expect(mobileCards.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('ITUB4.SA');
  });

  it('should update score on change', () => {
    const event = { target: { value: '9' } } as unknown as Event;
    component.onScoreChange(1, event);
    expect(storeMock.updateScore).toHaveBeenCalledWith(1, 9);
  });

  it('should update holding qty on change', () => {
    const event = { target: { value: '150' } } as unknown as Event;
    component.onHoldingQtyChange(1, event);
    expect(storeMock.updateHolding).toHaveBeenCalledWith(1, { qty: '150' });
  });

  it('should allow deletion of unheld instrument', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const unheldRow = component.getFlattenedInstruments()[1];
    component.deleteInstrument(unheldRow);
    expect(storeMock.deleteInstrument).toHaveBeenCalledWith(2);
  });

  it('should open register dialog on button click', () => {
    component.openRegisterDialog();
    expect(component['dialog'].open).toHaveBeenCalled();
  });
});
