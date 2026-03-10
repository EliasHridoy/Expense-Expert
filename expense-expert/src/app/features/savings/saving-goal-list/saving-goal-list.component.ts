import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SavingGoal } from '../../../core/models/saving.model';

@Component({
  selector: 'app-saving-goal-list',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      @for (goal of goals; track goal.id) {
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col justify-between">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{{ goal.purpose }}</h3>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {{ goal.savedAmount | number:'1.0-0' }} / {{ goal.targetAmount | number:'1.0-0' }}
              </p>
              @if (goal.startMonth && goal.endMonth) {
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {{ formatMonth(goal.startMonth) }} → {{ formatMonth(goal.endMonth) }}
                  ({{ getDurationLabel(goal) }})
                </p>
              }
            </div>
            <div class="flex flex-shrink-0 gap-2 ml-2">
              <button
                (click)="addEntry.emit(goal)"
                class="text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1"
              >
                + Save
              </button>
              <button
                (click)="edit.emit(goal)"
                class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-1"
              >
                Edit
              </button>
              <button
                (click)="delete.emit(goal)"
                class="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 ml-1"
              >
                Delete
              </button>
            </div>
          </div>
          <div class="mt-auto pt-2">
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                class="h-2 rounded-full bg-green-500 transition-all"
                [style.width.%]="getProgress(goal)"
              ></div>
            </div>
          </div>
        </div>
      } @empty {
        <p class="text-sm col-span-full text-gray-400 dark:text-gray-500 text-center py-4">No saving goals for this month.</p>
      }
    </div>
  `,
})
export class SavingGoalListComponent {
  @Input() goals: SavingGoal[] = [];
  @Output() edit = new EventEmitter<SavingGoal>();
  @Output() addEntry = new EventEmitter<SavingGoal>();
  @Output() delete = new EventEmitter<SavingGoal>();

  getProgress(goal: SavingGoal): number {
    if (goal.targetAmount === 0) return 0;
    return Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
  }

  formatMonth(monthStr: string): string {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  }

  getDurationLabel(goal: SavingGoal): string {
    if (!goal.durationValue || !goal.durationUnit) return '';
    const val = goal.durationValue;
    const unit = goal.durationUnit;
    if (unit === 'years') {
      return val === 1 ? '1 year' : `${val} years`;
    }
    return val === 1 ? '1 month' : `${val} months`;
  }
}
