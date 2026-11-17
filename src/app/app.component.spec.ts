import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AppComponent } from './app.component';
import { PortfolioStoreService } from './core/services/portfolio-store.service';
import { PortfolioSummaryResponse } from './core/models/portfolio.models';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let storeMock: any;

  const mockSummary: PortfolioSummaryResponse = {
    total_minor_units: 5000000,
    macros: []
  };

  beforeEach(async () => {
    storeMock = {
      summary: signal<PortfolioSummaryResponse | null>(mockSummary),
      activePlan: signal(null),
      loading: signal(false),
      error: signal<string | null>(null),
      loadSummary: jasmine.createSpy('loadSummary'),
      loadActivePlan: jasmine.createSpy('loadActivePlan'),
      clearError: jasmine.createSpy('clearError')
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: PortfolioStoreService, useValue: storeMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app shell', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger store rehydration on init', () => {
    expect(storeMock.loadSummary).toHaveBeenCalled();
    expect(storeMock.loadActivePlan).toHaveBeenCalled();
  });

  it('should display the total net worth in the toolbar', () => {
    const banner = fixture.nativeElement.querySelector('.net-worth-badge');
    expect(banner.textContent).toContain('50.000,00');
  });

  it('should display error banner when error signal is set', () => {
    storeMock.error.set('Serviço indisponível');
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.error-banner');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Serviço indisponível');
  });

  it('should call retry() to reload data', () => {
    component.retry();
    expect(storeMock.loadSummary).toHaveBeenCalledTimes(2);
    expect(storeMock.loadActivePlan).toHaveBeenCalledTimes(2);
  });
});
