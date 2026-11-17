import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PortfolioStoreService } from '../../core/services/portfolio-store.service';
import { AssetKind, CreateInstrumentRequest, LotRules } from '../../core/models/portfolio.models';

@Component({
  selector: 'app-register-asset-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './register-asset-dialog.component.html',
  styleUrls: ['./register-asset-dialog.component.scss']
})
export class RegisterAssetDialogComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly store = inject(PortfolioStoreService);
  private readonly dialogRef = inject(MatDialogRef<RegisterAssetDialogComponent>);

  readonly errorMessage = signal<string | null>(null);

  protected readonly macros = this.store.summary()?.macros.map((m) => m.name) || [
    'National Stocks',
    'International Stocks',
    'Real Estate Investment Trusts',
    'Cryptocurrencies',
    'International Bonds',
    'National Bonds'
  ];

  protected readonly form = this.fb.group({
    macro_name: [this.macros[0] || 'National Stocks', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    ticker: ['', [Validators.maxLength(20)]],
    asset_kind: ['PRICE_QUOTED' as AssetKind, Validators.required],
    score: [10, [Validators.required, Validators.min(0), Validators.max(10)]],
    lot_rules: ['WHOLE_ONLY' as LotRules, Validators.required],
    min_investment_minor_units: [0, [Validators.required, Validators.min(0)]]
  });

  constructor() {
    this.form.get('macro_name')?.valueChanges.subscribe((macro) => {
      if (macro) {
        const isBonds =
          macro.toLowerCase().includes('bonds') || macro.toLowerCase().includes('renda fixa');
        if (isBonds) {
          this.form.patchValue({
            asset_kind: 'BALANCE_TRACKED',
            lot_rules: 'WHOLE_ONLY'
          });
        } else {
          this.form.patchValue({
            asset_kind: 'PRICE_QUOTED'
          });
        }
      }
    });
  }

  get isBalanceTracked(): boolean {
    return this.form.get('asset_kind')?.value === 'BALANCE_TRACKED';
  }

  applySaSuffix(): void {
    const tickerVal = this.form.get('ticker')?.value || '';
    if (tickerVal && !tickerVal.toUpperCase().endsWith('.SA')) {
      this.form.patchValue({ ticker: `${tickerVal.toUpperCase()}.SA` });
    }
  }

  private generateTickerFromName(name: string): string {
    const cleaned = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toUpperCase()
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    return (cleaned || 'BOND').slice(0, 20);
  }

  onSubmit(): void {
    const tickerControl = this.form.get('ticker');
    const nameVal = this.form.get('name')?.value?.trim() || '';

    if (!this.isBalanceTracked && (!tickerControl?.value || !tickerControl.value.trim())) {
      tickerControl?.setErrors({ required: true });
      return;
    }

    if (this.form.invalid) return;

    this.errorMessage.set(null);
    const val = this.form.value;
    const finalTicker = val.ticker?.trim()
      ? val.ticker.trim().toUpperCase()
      : this.generateTickerFromName(nameVal);

    const request: CreateInstrumentRequest = {
      name: nameVal,
      ticker: finalTicker,
      asset_kind: val.asset_kind!,
      score: Number(val.score),
      lot_rules: val.lot_rules!,
      min_investment_minor_units: Number(val.min_investment_minor_units) || 0,
      yahoo_symbol: val.asset_kind === 'PRICE_QUOTED' ? finalTicker : undefined
    };

    this.store.createInstrument(val.macro_name!, request).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message || 'Falha ao cadastrar ativo.');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
