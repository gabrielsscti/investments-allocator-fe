import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { PortfolioStoreService } from '../../core/services/portfolio-store.service';
import { MacroInstrumentView, MacroSummary } from '../../core/models/portfolio.models';
import { RegisterAssetDialogComponent } from './register-asset-dialog.component';
import { QuarantineDialogComponent } from './quarantine-dialog.component';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';
import { BpsPercentPipe } from '../../shared/pipes/bps-percent.pipe';

export interface FlattenedInstrumentView extends MacroInstrumentView {
  macro_name: string;
}

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatExpansionModule,
    BrlCurrencyPipe,
    BpsPercentPipe
  ],
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss']
})
export class MaintenanceComponent implements OnInit, OnDestroy {
  protected readonly store = inject(PortfolioStoreService);
  private readonly dialog = inject(MatDialog);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly isMobile = signal<boolean>(false);
  private breakpointSub?: Subscription;

  readonly displayedColumns: string[] = [
    'macro',
    'ticker',
    'name',
    'asset_kind',
    'score',
    'holdings',
    'valuation',
    'delta',
    'actions'
  ];

  ngOnInit(): void {
    this.breakpointSub = this.breakpointObserver
      .observe(['(max-width: 599.98px)'])
      .subscribe((result) => {
        this.isMobile.set(result.matches);
      });
  }

  ngOnDestroy(): void {
    this.breakpointSub?.unsubscribe();
  }

  getFlattenedInstruments(): FlattenedInstrumentView[] {
    const summary = this.store.summary();
    if (!summary || !summary.macros) return [];

    const list: FlattenedInstrumentView[] = [];
    for (const macro of summary.macros) {
      for (const item of macro.instruments || []) {
        list.push({
          ...item,
          macro_name: macro.name
        });
      }
    }
    return list;
  }

  openRegisterDialog(): void {
    this.dialog.open(RegisterAssetDialogComponent, {
      width: '520px'
    });
  }

  openQuarantineDialog(row: FlattenedInstrumentView | MacroInstrumentView): void {
    this.dialog.open(QuarantineDialogComponent, {
      width: '480px',
      data: {
        instrumentId: row.instrument.id,
        ticker: row.instrument.ticker,
        name: row.instrument.name,
        quarantined: row.instrument.quarantined,
        note: row.instrument.quarantined_note
      }
    });
  }

  onScoreChange(instrumentId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const score = Math.max(0, Math.min(10, parseInt(input.value, 10) || 0));
    this.store.updateScore(instrumentId, score).subscribe();
  }

  onHoldingQtyChange(instrumentId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const qty = input.value.trim();
    this.store.updateHolding(instrumentId, { qty }).subscribe();
  }

  onHoldingBalanceChange(instrumentId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const reais = parseFloat(input.value) || 0;
    const balanceMinorUnits = Math.round(reais * 100);
    this.store.updateHolding(instrumentId, { balance_minor_units: balanceMinorUnits }).subscribe();
  }

  isUnheld(row: MacroInstrumentView): boolean {
    if (row.instrument.asset_kind === 'PRICE_QUOTED') {
      return !row.instrument.holding_qty || parseFloat(row.instrument.holding_qty) === 0;
    }
    return !row.instrument.holding_balance_minor_units || row.instrument.holding_balance_minor_units === 0;
  }

  deleteInstrument(row: MacroInstrumentView): void {
    if (confirm(`Tem certeza que deseja excluir o ativo ${row.instrument.ticker}?`)) {
      this.store.deleteInstrument(row.instrument.id).subscribe();
    }
  }

  getMacroProgress(macro: MacroSummary): number {
    const total = this.store.summary()?.total_minor_units || 0;
    if (total === 0) return 0;
    return Math.min(100, Math.round((macro.current_minor_units / total) * 100));
  }
}
