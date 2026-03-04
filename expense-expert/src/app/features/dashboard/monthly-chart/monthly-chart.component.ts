import { Component, Input, OnChanges, ViewChild, ElementRef, SimpleChanges } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { MonthlyTrend } from '../../../core/models/dashboard.model';

Chart.register(...registerables);

@Component({
  selector: 'app-monthly-chart',
  standalone: true,
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 class="text-sm font-semibold text-gray-700 mb-4">Expenses - Last 6 Months</h3>
      <div class="relative h-64">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
})
export class MonthlyChartComponent implements OnChanges {
  @Input({ required: true }) data!: MonthlyTrend[];
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.renderChart();
    }
  }

  private renderChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.data.map((d) => {
      const [year, month] = d.month.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
        month: 'short',
      });
    });

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Expenses',
            data: this.data.map((d) => d.totalExpenses),
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderRadius: 6,
          },
          {
            label: 'Savings',
            data: this.data.map((d) => d.totalSavings),
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    };

    this.chart = new Chart(this.chartCanvas.nativeElement, config);
  }
}
