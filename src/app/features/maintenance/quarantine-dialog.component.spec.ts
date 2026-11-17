import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { QuarantineDialogComponent, QuarantineDialogData } from './quarantine-dialog.component';
import { PortfolioStoreService } from '../../core/services/portfolio-store.service';

describe('QuarantineDialogComponent', () => {
  let component: QuarantineDialogComponent;
  let fixture: ComponentFixture<QuarantineDialogComponent>;
  let storeMock: any;
  let dialogRefMock: any;

  const mockData: QuarantineDialogData = {
    instrumentId: 10,
    ticker: 'AMER3.SA',
    name: 'Lojas Americanas',
    quarantined: false,
    note: ''
  };

  beforeEach(async () => {
    storeMock = {
      loading: () => false,
      setQuarantine: jasmine.createSpy('setQuarantine').and.returnValue(of(undefined))
    };

    dialogRefMock = {
      close: jasmine.createSpy('close')
    };

    await TestBed.configureTestingModule({
      imports: [QuarantineDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: PortfolioStoreService, useValue: storeMock },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QuarantineDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create dialog', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with provided data', () => {
    expect(component['form'].get('quarantined')?.value).toBe(false);
    expect(component['form'].get('note')?.value).toBe('');
  });

  it('should submit updated quarantine state and close', () => {
    component['form'].patchValue({
      quarantined: true,
      note: 'Problemas de auditoria'
    });

    component.onSubmit();

    expect(storeMock.setQuarantine).toHaveBeenCalledWith(10, {
      quarantined: true,
      note: 'Problemas de auditoria'
    });
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });
});
