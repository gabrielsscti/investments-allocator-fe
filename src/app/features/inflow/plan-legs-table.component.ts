import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PlanLeg, PlanResponse } from '../../core/models/inflow.models';
import { AssetKind } from '../../core/models/portfolio.models';
import { PortfolioStoreService } from '../../core/services/portfolio-store.service';
import { ExecuteLegDialogComponent } from './execute-leg-dialog.component';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';

@Component({
  selector: 'app-plan-legs-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    BrlCurrencyPipe
  ],
  templateUrl: './plan-legs-table.component.html',
  styleUrls: ['./plan-legs-table.component.scss']
})
export class PlanLegsTableComponent {
  readonly plan = input.required<PlanResponse>();

  protected readonly store = inject(PortfolioStoreService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns: string[] = [
    'sequence',
    'instrument',
    'proposed',
    'gross',
    'status',
    'actions'
  ];

  openExecuteDialog(leg: PlanLeg): void {
    const assetKind = this.resolveAssetKind(leg.instrument.id);
    this.dialog.open(ExecuteLegDialogComponent, {
      width: '520px',
      data: {
        planId: this.plan().plan_id,
        leg,
        assetKind
      }
    });
  }

  cancelLeg(leg: PlanLeg): void {
    if (confirm(`Deseja ignorar o aporte em ${leg.instrument.ticker}?`)) {
      this.store.cancelLeg(this.plan().plan_id, leg.leg_id).subscribe();
    }
  }

  private resolveAssetKind(instrumentId: number): AssetKind {
    const summary = this.store.summary();
    if (!summary) return 'PRICE_QUOTED';

    for (const macro of summary.macros) {
      const match = macro.instruments?.find((i) => i.instrument.id === instrumentId);
      if (match) {
        return match.instrument.asset_kind;
      }
    }
    return 'PRICE_QUOTED';
  }
}
