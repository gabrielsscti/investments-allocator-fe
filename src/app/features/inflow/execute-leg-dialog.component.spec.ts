import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ExecuteLegDialogComponent, ExecuteLegDialogData } from './execute-leg-dialog.component';
import { PortfolioStoreService } from '../../core/services/portfolio-store.service';

describe('ExecuteLegDialogComponent', () => {
  let component: ExecuteLegDialogComponent;
  let fixture: ComponentFixture<ExecuteLegDialogComponent>;
  let storeMock: any;
  let dialogRefMock: any;

  const mockEquityData: ExecuteLegDialogData = {
    planId: 1,
    leg: {
      leg_id: 10,
      sequence: 1,
      instrument: { id: 100, ticker: 'ITUB4.SA', name: 'Itaú Unibanco' },
      status: 'PENDING',
      proposed_qty: '12',
      proposed_price_minor_units_per_unit: '3500',
      proposed_gross_minor_units: 42000,
      proposed_remainder_minor_units: 500
    },
    assetKind: 'PRICE_QUOTED'
  };

  beforeEach(async () => {
    storeMock = {
      summary: () => ({ macros: [] }),
      loading: () => false,
      executeLeg: jasmine.createSpy('executeLeg').and.returnValue(of({ trade_id: 1 }))
    };

    dialogRefMock = {
      close: jasmine.createSpy('close')
    };

    await TestBed.configureTestingModule({
      imports: [ExecuteLegDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: PortfolioStoreService, useValue: storeMock },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: mockEquityData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExecuteLegDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create dialog', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with equity proposed parameters', () => {
    expect(component['form'].get('qty')?.value).toBe('12');
    expect(component['form'].get('price_minor_units')?.value).toBe(3500);
    expect(component['form'].get('fees_minor_units')?.value).toBe(0);
  });

  it('should submit equity execution with stringified qty and price', () => {
    component.onSubmit();

    expect(storeMock.executeLeg).toHaveBeenCalledWith(1, 10, {
      qty: '12',
      price_minor_units_per_unit: '3500',
      fees_minor_units: 0
    });
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });

  it('should display error when executeLeg fails', () => {
    storeMock.executeLeg.and.returnValue(throwError(() => new Error('Falha no saldo')));
    component.onSubmit();

    expect(component.errorMessage()).toBe('Falha no saldo');
    expect(dialogRefMock.close).not.toHaveBeenCalled();
  });
});
