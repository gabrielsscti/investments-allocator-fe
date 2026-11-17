import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { PortfolioStoreService } from '../../core/services/portfolio-store.service';
import { SetQuarantineRequest } from '../../core/models/portfolio.models';

export interface QuarantineDialogData {
  instrumentId: number;
  ticker: string;
  name: string;
  quarantined: boolean;
  note?: string;
}

@Component({
  selector: 'app-quarantine-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule
  ],
  templateUrl: './quarantine-dialog.component.html',
  styleUrls: ['./quarantine-dialog.component.scss']
})
export class QuarantineDialogComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly store = inject(PortfolioStoreService);
  private readonly dialogRef = inject(MatDialogRef<QuarantineDialogComponent>);
  protected readonly data: QuarantineDialogData = inject(MAT_DIALOG_DATA);

  protected readonly form = this.fb.group({
    quarantined: [this.data.quarantined],
    note: [this.data.note || '']
  });

  onSubmit(): void {
    const val = this.form.value;
    const request: SetQuarantineRequest = {
      quarantined: Boolean(val.quarantined),
      note: val.note?.trim() || undefined
    };

    this.store.setQuarantine(this.data.instrumentId, request).subscribe({
      next: () => {
        this.dialogRef.close(true);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
