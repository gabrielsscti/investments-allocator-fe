import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PortfolioStoreService } from '../../core/services/portfolio-store.service';
import { AssetKind } from '../../core/models/portfolio.models';
import { ExecuteLegRequest, PlanLeg } from '../../core/models/inflow.models';
import { BrlCurrencyMaskDirective } from '../../shared/directives/brl-currency-mask.directive';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';

export interface ExecuteLegDialogData {
  planId: number;
  leg: PlanLeg;
  assetKind?: AssetKind;
}

@Component({
  selector: 'app-execute-leg-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    BrlCurrencyMaskDirective,
    BrlCurrencyPipe
  ],
  templateUrl: './execute-leg-dialog.component.html',
  styleUrls: ['./execute-leg-dialog.component.scss']
})
export class ExecuteLegDialogComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly store = inject(PortfolioStoreService);
  private readonly dialogRef = inject(MatDialogRef<ExecuteLegDialogComponent>);
  protected readonly data: ExecuteLegDialogData = inject(MAT_DIALOG_DATA);

  readonly errorMessage = signal<string | null>(null);

  protected readonly isBalanceTracked = this.data.assetKind === 'BALANCE_TRACKED';

  private getInitialBalanceAfter(): number {
    const deposit = this.data.leg.proposed_gross_minor_units || 0;
    const summary = this.store.summary();
    if (!summary) return deposit;

    for (const macro of summary.macros) {
      const match = macro.instruments?.find((i) => i.instrument.id === this.data.leg.instrument.id);
      if (match && match.instrument.holding_balance_minor_units != null) {
        return match.instrument.holding_balance_minor_units + deposit;
      }
    }
    return deposit;
  }

  protected readonly form = this.fb.group({
    qty: [this.data.leg.proposed_qty || '1', [Validators.required]],
    price_minor_units: [
      this.data.leg.proposed_price_minor_units_per_unit
        ? parseInt(this.data.leg.proposed_price_minor_units_per_unit, 10)
        : 0,
      [Validators.required, Validators.min(1)]
    ],
    fees_minor_units: [0, [Validators.required, Validators.min(0)]],
    deposit_minor_units: [
      this.data.leg.proposed_gross_minor_units || 0,
      [Validators.required, Validators.min(1)]
    ],
    balance_after_minor_units: [
      this.getInitialBalanceAfter(),
      this.isBalanceTracked ? [Validators.required, Validators.min(0)] : []
    ]
  });

  get calculatedGrossMinorUnits(): number {
    if (this.isBalanceTracked) {
      return Number(this.form.get('deposit_minor_units')?.value) || 0;
    }
    const qty = parseFloat(this.form.get('qty')?.value || '0') || 0;
    const price = Number(this.form.get('price_minor_units')?.value) || 0;
    return Math.round(qty * price);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.errorMessage.set(null);
    const val = this.form.value;
    let request: ExecuteLegRequest;

    if (this.isBalanceTracked) {
      const depositCents = Number(val.deposit_minor_units) || 0;
      const rawBalanceAfter = val.balance_after_minor_units;
      const balanceAfterCents =
        rawBalanceAfter !== null && rawBalanceAfter !== undefined && !isNaN(Number(rawBalanceAfter))
          ? Number(rawBalanceAfter)
          : depositCents;

      request = {
        qty: depositCents.toString(),
        price_minor_units_per_unit: '1',
        fees_minor_units: Number(val.fees_minor_units) || 0,
        balance_after: balanceAfterCents
      };
    } else {
      const priceCents = Number(val.price_minor_units) || 0;
      request = {
        qty: val.qty!.trim(),
        price_minor_units_per_unit: priceCents.toString(),
        fees_minor_units: Number(val.fees_minor_units) || 0
      };
    }

    this.store.executeLeg(this.data.planId, this.data.leg.leg_id, request).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message || 'Falha ao registrar a execução do aporte.');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
