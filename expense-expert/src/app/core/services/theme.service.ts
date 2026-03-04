import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'expense-expert-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(false);

  constructor() {
    this.loadTheme();
  }

  toggle(): void {
    this.isDark.update((v) => !v);
    this.applyTheme();
    localStorage.setItem(THEME_KEY, this.isDark() ? 'dark' : 'light');
  }

  private loadTheme(): void {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') {
      this.isDark.set(true);
    } else if (saved === null) {
      // Respect system preference
      this.isDark.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    this.applyTheme();
  }

  private applyTheme(): void {
    if (this.isDark()) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
