import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="flex items-center justify-center" [class]="containerClass">
      <div
        class="animate-spin rounded-full border-2 border-gray-300 border-t-primary-600"
        [class]="sizeClass"
      ></div>
    </div>
  `,
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() fullPage = false;

  get sizeClass(): string {
    const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
    return sizes[this.size];
  }

  get containerClass(): string {
    return this.fullPage ? 'min-h-[50vh]' : 'py-4';
  }
}
