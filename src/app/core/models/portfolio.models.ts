export type AssetKind = 'PRICE_QUOTED' | 'BALANCE_TRACKED';
export type LotRules = 'FRACTIONAL' | 'WHOLE_ONLY';
export type PlanStatus = 'PENDING' | 'PARTIALLY_EXECUTED' | 'EXECUTED' | 'CANCELLED' | 'SUPERSEDED';
export type LegStatus = 'PENDING' | 'EXECUTED' | 'CANCELLED';

export interface InstrumentSummary {
  id: number;
  macro_name: string;
  name: string;
  ticker: string;
  yahoo_symbol?: string;
  asset_kind: AssetKind;
  currency: string;
  score: number;
  target_bps_within_macro: number;
  lot_rules: LotRules;
  min_investment_minor_units: number;
  quarantined: boolean;
  quarantined_note?: string;
  holding_qty?: string;
  holding_balance_minor_units?: number;
}

export interface MacroInstrumentView {
  instrument: InstrumentSummary;
  price_per_unit_minor_units: number;
  current_value_minor_units: number;
  quote_stale: boolean;
  feasible: boolean;
}

export interface MacroSummary {
  name: string;
  target_bps: number;
  current_minor_units: number;
  target_minor_units: number;
  delta_minor_units: number;
  instruments: MacroInstrumentView[];
}

export interface PortfolioSummaryResponse {
  total_minor_units: number;
  macros: MacroSummary[];
}

export interface CreateInstrumentRequest {
  name: string;
  ticker: string;
  asset_kind: AssetKind;
  currency?: string;
  yahoo_symbol?: string;
  score: number;
  lot_rules: LotRules;
  min_investment_minor_units: number;
}

export interface UpdateInstrumentRequest {
  name?: string;
  yahoo_symbol?: string;
  score?: number;
  min_investment_minor_units?: number;
}

export interface SetHoldingRequest {
  qty?: string;
  balance_minor_units?: number;
}

export interface SetQuarantineRequest {
  quarantined: boolean;
  note?: string;
}

export interface BackendErrorResponse {
  error: string;
  field?: string;
}
