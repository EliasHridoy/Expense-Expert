import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Person } from '../../../core/models/person.model';

@Component({
  selector: 'app-person-select',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex items-center gap-2">
      <select
        [ngModel]="selectedId"
        (ngModelChange)="selected.emit($event)"
        class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
      >
        <option value="" disabled>Select a person</option>
        @for (person of persons; track person.id) {
          <option [value]="person.id">{{ person.name }}</option>
        }
      </select>

      @if (!showAddForm()) {
        <button
          type="button"
          (click)="showAddForm.set(true)"
          class="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors whitespace-nowrap"
        >
          + Add
        </button>
      } @else {
        <div class="flex items-center gap-1">
          <input
            [(ngModel)]="newPersonName"
            placeholder="Name"
            class="w-28 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            (keyup.enter)="addPerson()"
          />
          <button
            type="button"
            (click)="addPerson()"
            class="rounded-lg bg-primary-600 px-2 py-2 text-sm text-white hover:bg-primary-700 transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            (click)="showAddForm.set(false); newPersonName = ''"
            class="rounded-lg bg-gray-100 px-2 py-2 text-sm text-gray-600 hover:bg-gray-200 transition-colors"
          >
            X
          </button>
        </div>
      }
    </div>
  `,
})
export class PersonSelectComponent {
  @Input() persons: Person[] = [];
  @Input() selectedId: string | null = null;
  @Output() selected = new EventEmitter<string>();
  @Output() personAdded = new EventEmitter<string>();

  showAddForm = signal(false);
  newPersonName = '';

  addPerson(): void {
    const name = this.newPersonName.trim();
    if (name) {
      this.personAdded.emit(name);
      this.newPersonName = '';
      this.showAddForm.set(false);
    }
  }
}
