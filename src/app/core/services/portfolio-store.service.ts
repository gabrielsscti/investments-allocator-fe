import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap, catchError, throwError, finalize } from 'rxjs';
import { PortfolioApiService } from './portfolio-api.service';
import { InflowApiService } from './inflow-api.service';
import {
  CreateInstrumentRequest,
  PortfolioSummaryResponse,
  SetHoldingRequest,
  SetQuarantineRequest,
  UpdateInstrumentRequest
} from '../models/portfolio.models';
import {
  CreateInflowRequest,
  ExecuteLegRequest,
  PlanLeg,
  PlanResponse,
  TradeResponse
} from '../models/inflow.models';

@Injectable({
  providedIn: 'root'
})
export class PortfolioStoreService {
  private readonly portfolioApi = inject(PortfolioApiService);
  private readonly inflowApi = inject(InflowApiService);

  private readonly _summary = signal<PortfolioSummaryResponse | null>(null);
  private readonly _activePlan = signal<PlanResponse | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly summary = this._summary.asReadonly();
  readonly activePlan = this._activePlan.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  clearError(): void {
    this._error.set(null);
  }

  loadSummary(): void {
    this._loading.set(true);
    this.portfolioApi.getSummary().pipe(
      finalize(() => this._loading.set(false))
    ).subscribe({
      next: (summary) => {
        this._summary.set(summary);
        this._error.set(null);
      },
      error: (err: Error) => {
        this._error.set(err.message || 'Falha ao carregar o resumo da carteira.');
      }
    });
  }

  loadActivePlan(): void {
    this.inflowApi.getPlans(['PENDING', 'PARTIALLY_EXECUTED']).subscribe({
      next: (plans) => {
        if (plans && plans.length > 0) {
          this._activePlan.set(plans[0]);
        } else {
          this._activePlan.set(null);
        }
      },
      error: (err: Error) => {
        console.warn('Falha ao reidratar plano ativo:', err);
      }
    });
  }

  calculateInflow(request: CreateInflowRequest): Observable<PlanResponse> {
    this._loading.set(true);
    return this.inflowApi.createInflow(request).pipe(
      tap((plan) => {
        this._activePlan.set(plan);
        this._error.set(null);
      }),
      catchError((err: Error) => {
        this._error.set(err.message || 'Falha ao calcular o plano de aporte.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  executeLeg(planId: number, legId: number, request: ExecuteLegRequest): Observable<TradeResponse> {
    this._loading.set(true);
    return this.inflowApi.executeLeg(planId, legId, request).pipe(
      tap(() => {
        this.inflowApi.getPlan(planId).subscribe({
          next: (updatedPlan) => {
            this._activePlan.set(updatedPlan);
          },
          error: () => {
            const currentPlan = this._activePlan();
            if (currentPlan && currentPlan.plan_id === planId) {
              const updatedLegs = currentPlan.legs.map((leg) =>
                leg.leg_id === legId ? { ...leg, status: 'EXECUTED' as const } : leg
              );
              this._activePlan.set({ ...currentPlan, legs: updatedLegs });
            }
          }
        });
        this.loadSummary();
        this._error.set(null);
      }),
      catchError((err: Error) => {
        this._error.set(err.message || 'Falha ao registrar a execução do aporte.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  cancelLeg(planId: number, legId: number): Observable<PlanLeg> {
    this._loading.set(true);
    return this.inflowApi.cancelLeg(planId, legId).pipe(
      tap((updatedLeg) => {
        const currentPlan = this._activePlan();
        if (currentPlan && currentPlan.plan_id === planId) {
          const updatedLegs = currentPlan.legs.map((leg) =>
            leg.leg_id === legId ? { ...leg, status: updatedLeg.status } : leg
          );
          this._activePlan.set({ ...currentPlan, legs: updatedLegs });
        }
      }),
      catchError((err: Error) => {
        this._error.set(err.message || 'Falha ao cancelar a perna do plano.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  cancelPlan(planId: number): Observable<PlanResponse> {
    this._loading.set(true);
    return this.inflowApi.cancelPlan(planId).pipe(
      tap(() => {
        this._activePlan.set(null);
      }),
      catchError((err: Error) => {
        this._error.set(err.message || 'Falha ao cancelar o plano de aporte.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  createInstrument(macroName: string, request: CreateInstrumentRequest): Observable<any> {
    this._loading.set(true);
    return this.portfolioApi.createInstrument(macroName, request).pipe(
      tap(() => {
        this.loadSummary();
        this._error.set(null);
      }),
      catchError((err: Error) => {
        this._error.set(err.message || 'Falha ao cadastrar novo ativo.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  updateInstrument(instrumentId: number, request: UpdateInstrumentRequest): Observable<any> {
    this._loading.set(true);
    return this.portfolioApi.updateInstrument(instrumentId, request).pipe(
      tap(() => {
        this.loadSummary();
        this._error.set(null);
      }),
      catchError((err: Error) => {
        this._error.set(err.message || 'Falha ao atualizar ativo.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  updateScore(instrumentId: number, score: number): Observable<any> {
    return this.updateInstrument(instrumentId, { score });
  }

  updateHolding(instrumentId: number, request: SetHoldingRequest): Observable<void> {
    this._loading.set(true);
    return this.portfolioApi.updateHolding(instrumentId, request).pipe(
      tap(() => {
        this.loadSummary();
        this._error.set(null);
      }),
      catchError((err: Error) => {
        this._error.set(err.message || 'Falha ao atualizar posição.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  setQuarantine(instrumentId: number, request: SetQuarantineRequest): Observable<void> {
    this._loading.set(true);
    return this.portfolioApi.setQuarantine(instrumentId, request).pipe(
      tap(() => {
        this.loadSummary();
        this._error.set(null);
      }),
      catchError((err: Error) => {
        this._error.set(err.message || 'Falha ao alterar status de quarentena.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  deleteInstrument(instrumentId: number): Observable<void> {
    this._loading.set(true);
    return this.portfolioApi.deleteInstrument(instrumentId).pipe(
      tap(() => {
        this.loadSummary();
        this._error.set(null);
      }),
      catchError((err: Error) => {
        this._error.set(err.message || 'Falha ao excluir ativo.');
        return throwError(() => err);
      }),
      finalize(() => this._loading.set(false))
    );
  }
}
