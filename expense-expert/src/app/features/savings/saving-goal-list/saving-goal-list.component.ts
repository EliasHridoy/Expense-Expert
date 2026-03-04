import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SavingGoal } from '../../../core/models/saving.model';

@Component({
  selector: 'app-saving-goal-list',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="space-y-3">
      @for (goal of goals; track goal.id) {
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div class="flex items-start justify-between mb-2">
            <div>
              <h3 class="text-sm font-medium text-gray-900 capitalize">{{ goal.purpose }}</h3>
              <p class="text-xs text-gray-400">
                {{ goal.savedAmount | number:'1.0-0' }} / {{ goal.targetAmount | number:'1.0-0' }}
              </p>
            </div>
            <div class="flex gap-2">
              <button
                (click)="addEntry.emit(goal)"
                class="text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1"
              >
                + Save
              </button>
              <button
                (click)="edit.emit(goal)"
                class="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
              >
                Edit
              </button>
            </div>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="h-2 rounded-full bg-green-500 transition-all"
              [style.width.%]="getProgress(goal)"
            ></div>
          </div>
        </div>
      } @empty {
        <p class="text-sm text-gray-400 text-center py-4">No saving goals for this month.</p>
      }
    </div>
  `,
})
export class SavingGoalListComponent {
  @Input() goals: SavingGoal[] = [];
  @Output() edit = new EventEmitter<SavingGoal>();
  @Output() addEntry = new EventEmitter<SavingGoal>();

  getProgress(goal: SavingGoal): number {
    if (goal.targetAmount === 0) return 0;
    return Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
  }
}
