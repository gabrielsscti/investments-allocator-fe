import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RegisterAssetDialogComponent } from './register-asset-dialog.component';
import { PortfolioStoreService } from '../../core/services/portfolio-store.service';

describe('RegisterAssetDialogComponent', () => {
  let component: RegisterAssetDialogComponent;
  let fixture: ComponentFixture<RegisterAssetDialogComponent>;
  let storeMock: any;
  let dialogRefMock: any;

  beforeEach(async () => {
    storeMock = {
      summary: () => ({ macros: [{ name: 'National Stocks' }, { name: 'National Bonds' }] }),
      loading: () => false,
      createInstrument: jasmine.createSpy('createInstrument').and.returnValue(of({ id: 1 }))
    };

    dialogRefMock = {
      close: jasmine.createSpy('close')
    };

    await TestBed.configureTestingModule({
      imports: [RegisterAssetDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: PortfolioStoreService, useValue: storeMock },
        { provide: MatDialogRef, useValue: dialogRefMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterAssetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create dialog', () => {
    expect(component).toBeTruthy();
  });

  it('should auto-append .SA suffix on click', () => {
    component['form'].patchValue({ ticker: 'WEGE3' });
    component.applySaSuffix();
    expect(component['form'].get('ticker')?.value).toBe('WEGE3.SA');
  });

  it('should submit valid form with yahoo_symbol for PRICE_QUOTED', () => {
    component['form'].patchValue({
      macro_name: 'National Stocks',
      name: 'Weg S.A.',
      ticker: 'WEGE3.SA',
      asset_kind: 'PRICE_QUOTED',
      score: 10,
      lot_rules: 'WHOLE_ONLY',
      min_investment_minor_units: 0
    });

    component.onSubmit();

    expect(storeMock.createInstrument).toHaveBeenCalledWith(
      'National Stocks',
      jasmine.objectContaining({
        ticker: 'WEGE3.SA',
        score: 10,
        yahoo_symbol: 'WEGE3.SA'
      })
    );
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });

  it('should auto-generate ticker from name when BALANCE_TRACKED and ticker omitted', () => {
    component['form'].patchValue({
      macro_name: 'National Bonds',
      name: 'Tesouro IPCA+ 2035',
      ticker: '',
      asset_kind: 'BALANCE_TRACKED',
      score: 8,
      lot_rules: 'WHOLE_ONLY',
      min_investment_minor_units: 0
    });

    component.onSubmit();

    expect(storeMock.createInstrument).toHaveBeenCalledWith(
      'National Bonds',
      jasmine.objectContaining({
        name: 'Tesouro IPCA+ 2035',
        ticker: 'TESOURO_IPCA_2035',
        asset_kind: 'BALANCE_TRACKED',
        yahoo_symbol: undefined
      })
    );
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });
});
