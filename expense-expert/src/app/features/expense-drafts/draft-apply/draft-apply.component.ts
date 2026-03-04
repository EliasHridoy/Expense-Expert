import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseDraftService } from '../../../core/services/expense-draft.service';
import { ToastService } from '../../../core/services/toast.service';
import { DraftApplication, ExpenseDraft } from '../../../core/models/expense-draft.model';
import { InstallmentTrackerComponent } from '../installment-tracker/installment-tracker.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-draft-apply',
  standalone: true,
  imports: [DecimalPipe, FormsModule, InstallmentTrackerComponent, LoadingSpinnerComponent],
  template: `
    @if (isLoading()) {
      <app-loading-spinner size="lg" [fullPage]="true" />
    } @else if (application() && draft()) {
      <div class="max-w-lg mx-auto">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ draft()!.title }}</h1>
        <p class="text-sm text-gray-500 mb-6">{{ application()!.month }}</p>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <app-installment-tracker [application]="application()!" />

          <div class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between text-gray-500">
              <span>Target</span>
              <span>{{ application()!.targetAmount | number:'1.0-0' }}</span>
            </div>
            <div class="flex justify-between text-gray-500">
              <span>Paid</span>
              <span>{{ application()!.paidAmount | number:'1.0-0' }}</span>
            </div>
            <div class="flex justify-between font-medium text-gray-900">
              <span>Remaining</span>
              <span>{{ application()!.targetAmount - application()!.paidAmount | number:'1.0-0' }}</span>
            </div>
          </div>
        </div>

        @if (application()!.status !== 'completed') {
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Record Payment</h3>
            <div class="flex gap-3">
              <input
                [(ngModel)]="paymentAmount"
                type="number"
                min="1"
                [placeholder]="'Suggested: ' + suggestedAmount"
                class="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
              <button
                (click)="recordPayment()"
                [disabled]="!paymentAmount || paymentAmount <= 0 || isRecording()"
                class="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                Pay
              </button>
            </div>
          </div>
        }

        <!-- Payment History -->
        @if (application()!.payments.length > 0) {
          <div class="mt-6">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Payment History</h3>
            <div class="space-y-2">
              @for (payment of application()!.payments; track $index) {
                <div class="flex justify-between items-center bg-white rounded-lg border border-gray-100 px-4 py-3 text-sm">
                  <span class="text-gray-500">Installment {{ $index + 1 }}</span>
                  <span class="font-medium text-gray-900">{{ payment.amount | number:'1.0-0' }}</span>
                </div>
              }
            </div>
          </div>
        }

        <button
          (click)="router.navigate(['/drafts'])"
          class="mt-6 text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Drafts
        </button>
      </div>
    }
  `,
})
export class DraftApplyComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private draftService = inject(ExpenseDraftService);
  private toastService = inject(ToastService);
  router = inject(Router);

  application = signal<DraftApplication | null>(null);
  draft = signal<ExpenseDraft | null>(null);
  isLoading = signal(true);
  isRecording = signal(false);
  paymentAmount: number | null = null;

  get suggestedAmount(): number {
    const app = this.application();
    if (!app || app.totalInstallments === 0) return 0;
    return Math.ceil((app.targetAmount - app.paidAmount) / Math.max(app.totalInstallments - app.installmentsPaid, 1));
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.draftService.getApplicationById(id).subscribe((app) => {
      this.application.set(app);
      if (app) {
        this.draftService.getDraftById(app.draftId).subscribe((draft) => {
          this.draft.set(draft);
          this.isLoading.set(false);
        });
      }
    });
  }

  async recordPayment(): Promise<void> {
    if (!this.paymentAmount || !this.application() || !this.draft()) return;

    this.isRecording.set(true);
    try {
      await this.draftService.recordInstallmentPayment(
        this.application()!,
        this.paymentAmount,
        this.draft()!
      );
      this.toastService.success('Payment recorded');
      this.paymentAmount = null;
    } catch {
      this.toastService.error('Failed to record payment');
    } finally {
      this.isRecording.set(false);
    }
  }
}
