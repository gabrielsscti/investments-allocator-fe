import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PortfolioStoreService } from '../../core/services/portfolio-store.service';
import { CreateInflowRequest } from '../../core/models/inflow.models';
import { BrlCurrencyMaskDirective } from '../../shared/directives/brl-currency-mask.directive';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';
import { PlanLegsTableComponent } from './plan-legs-table.component';

@Component({
  selector: 'app-inflow-ritual',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    BrlCurrencyMaskDirective,
    BrlCurrencyPipe,
    PlanLegsTableComponent
  ],
  templateUrl: './inflow-ritual.component.html',
  styleUrls: ['./inflow-ritual.component.scss']
})
export class InflowRitualComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly store = inject(PortfolioStoreService);

  protected readonly form = this.fb.group({
    amount_minor_units: [500000, [Validators.required, Validators.min(100)]],
    note: ['']
  });

  onCalculate(): void {
    if (this.form.invalid) return;

    const val = this.form.value;
    const request: CreateInflowRequest = {
      amount_minor_units: Number(val.amount_minor_units),
      currency: 'BRL',
      note: val.note?.trim() || undefined
    };

    this.store.calculateInflow(request).subscribe();
  }

  onDiscardPlan(): void {
    const currentPlan = this.store.activePlan();
    if (!currentPlan) return;

    if (confirm('Deseja descartar este plano de aporte e iniciar um novo cálculo?')) {
      this.store.cancelPlan(currentPlan.plan_id).subscribe();
    }
  }
}
