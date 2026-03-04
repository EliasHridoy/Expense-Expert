import { Component, inject, signal, OnInit } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { MonthSummary, MonthlyTrend } from '../../../core/models/dashboard.model';
import { SummaryCardsComponent } from '../summary-cards/summary-cards.component';
import { MonthlyChartComponent } from '../monthly-chart/monthly-chart.component';
import { MonthPickerComponent } from '../../../shared/components/month-picker/month-picker.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    SummaryCardsComponent,
    MonthlyChartComponent,
    MonthPickerComponent,
    LoadingSpinnerComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-page-header title="Dashboard" />

    <div class="flex items-center justify-end mb-6">
      <app-month-picker [currentMonth]="currentMonth()" (monthChanged)="onMonthChange($event)" />
    </div>

    @if (isLoading()) {
      <app-loading-spinner size="lg" [fullPage]="true" />
    } @else {
      @if (summary()) {
        <app-summary-cards [summary]="summary()!" class="block mb-6" />
      }

      @if (trend().length > 0) {
        <app-monthly-chart [data]="trend()" />
      }
    }
  `,
})
export class DashboardPageComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  currentMonth = signal(this.getCurrentMonth());
  summary = signal<MonthSummary | null>(null);
  trend = signal<MonthlyTrend[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadData();
  }

  onMonthChange(month: string): void {
    this.currentMonth.set(month);
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);

    this.dashboardService.getCurrentMonthSummary(this.currentMonth()).subscribe((summary) => {
      this.summary.set(summary);
      this.isLoading.set(false);
    });

    this.dashboardService.getMonthlyTrend(6).subscribe((trend) => {
      this.trend.set(trend);
    });
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
