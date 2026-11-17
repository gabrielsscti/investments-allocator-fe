import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PortfolioStoreService } from './core/services/portfolio-store.service';
import { BrlCurrencyPipe } from './shared/pipes/brl-currency.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    BrlCurrencyPipe
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  protected readonly store = inject(PortfolioStoreService);

  ngOnInit(): void {
    this.store.loadSummary();
    this.store.loadActivePlan();
  }

  retry(): void {
    this.store.loadSummary();
    this.store.loadActivePlan();
  }
}
