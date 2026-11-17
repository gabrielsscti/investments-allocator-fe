import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateInstrumentRequest,
  InstrumentSummary,
  PortfolioSummaryResponse,
  SetHoldingRequest,
  SetQuarantineRequest,
  UpdateInstrumentRequest
} from '../models/portfolio.models';

@Injectable({
  providedIn: 'root'
})
export class PortfolioApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1';

  getSummary(): Observable<PortfolioSummaryResponse> {
    return this.http.get<PortfolioSummaryResponse>(`${this.baseUrl}/summary`);
  }

  createInstrument(macroName: string, request: CreateInstrumentRequest): Observable<InstrumentSummary> {
    return this.http.post<InstrumentSummary>(
      `${this.baseUrl}/macros/${encodeURIComponent(macroName)}/instruments`,
      request
    );
  }

  updateInstrument(instrumentId: number, request: UpdateInstrumentRequest): Observable<InstrumentSummary> {
    return this.http.put<InstrumentSummary>(
      `${this.baseUrl}/instruments/${instrumentId}`,
      request
    );
  }

  updateHolding(instrumentId: number, request: SetHoldingRequest): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/positions/${instrumentId}/holding`,
      request
    );
  }

  setQuarantine(instrumentId: number, request: SetQuarantineRequest): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/instruments/${instrumentId}/quarantine`,
      request
    );
  }

  deleteInstrument(instrumentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/instruments/${instrumentId}`);
  }
}
