import { Pipe, PipeTransform } from '@angular/core';

export type RelativeDateInput = Date | string | number | { toDate: () => Date } | null | undefined;

@Pipe({ name: 'relativeDate', standalone: true })
export class RelativeDatePipe implements PipeTransform {
  transform(value: RelativeDateInput): string {
    if (!value) return '';

    const date = value instanceof Date
      ? value
      : (typeof value === 'object' && 'toDate' in value)
        ? value.toDate()
        : new Date(value as string | number);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
