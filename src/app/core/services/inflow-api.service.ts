import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateInflowRequest,
  ExecuteLegRequest,
  PlanLeg,
  PlanResponse,
  TradeResponse
} from '../models/inflow.models';
import { PlanStatus } from '../models/portfolio.models';

@Injectable({
  providedIn: 'root'
})
export class InflowApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1';

  createInflow(request: CreateInflowRequest): Observable<PlanResponse> {
    return this.http.post<PlanResponse>(`${this.baseUrl}/inflows`, request);
  }

  getPlans(statuses: PlanStatus[] = ['PENDING', 'PARTIALLY_EXECUTED']): Observable<PlanResponse[]> {
    let params = new HttpParams();
    for (const status of statuses) {
      params = params.append('status', status);
    }
    return this.http.get<PlanResponse[]>(`${this.baseUrl}/plans`, { params });
  }

  getPlan(planId: number): Observable<PlanResponse> {
    return this.http.get<PlanResponse>(`${this.baseUrl}/plans/${planId}`);
  }

  executeLeg(planId: number, legId: number, request: ExecuteLegRequest): Observable<TradeResponse> {
    return this.http.post<TradeResponse>(
      `${this.baseUrl}/plans/${planId}/legs/${legId}/execute`,
      request
    );
  }

  cancelLeg(planId: number, legId: number): Observable<PlanLeg> {
    return this.http.post<PlanLeg>(
      `${this.baseUrl}/plans/${planId}/legs/${legId}/cancel`,
      {}
    );
  }

  cancelPlan(planId: number): Observable<PlanResponse> {
    return this.http.post<PlanResponse>(
      `${this.baseUrl}/plans/${planId}/cancel`,
      {}
    );
  }
}
