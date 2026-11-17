import { LegStatus, PlanStatus } from './portfolio.models';

export interface CreateInflowRequest {
  amount_minor_units: number;
  currency: string;
  note?: string;
}

export interface InstrumentRef {
  id: number;
  ticker: string;
  name: string;
}

export interface PlanLeg {
  leg_id: number;
  sequence: number;
  instrument: InstrumentRef;
  status: LegStatus;
  proposed_qty?: string;
  proposed_price_minor_units_per_unit?: string;
  proposed_gross_minor_units: number;
  proposed_remainder_minor_units: number;
}

export interface PlanResponse {
  plan_id: number;
  inflow_id: number;
  status: PlanStatus;
  engine_version: string;
  legs: PlanLeg[];
  expected_remainder_minor_units: number;
  rationale_json?: string;
}

export interface ExecuteLegRequest {
  qty: string;
  price_minor_units_per_unit: string;
  fees_minor_units: number;
  executed_at?: string;
  balance_after?: number;
}

export interface TradeResponse {
  trade_id: number;
  plan_leg_id?: number;
  instrument_id: number;
  qty: string;
  price_minor_units_per_unit: string;
  gross_minor_units: number;
  fees_minor_units: number;
  executed_at: string;
}
