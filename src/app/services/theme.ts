import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'dino-theme';

  get isDarkMode(): boolean {
    return this.readStoredTheme() === 'dark';
  }

  initializeTheme(): void {
    const storedTheme = this.readStoredTheme();
    this.setTheme(storedTheme === 'dark' ? 'dark' : 'light');
  }

  toggleTheme(): void {
    const nextValue = !this.isDarkMode;
    this.setTheme(nextValue ? 'dark' : 'light');
  }

  setTheme(theme: 'light' | 'dark'): void {
    const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
    document.body.dataset['theme'] = normalizedTheme;
    localStorage.setItem(this.storageKey, normalizedTheme);
  }

  private readStoredTheme(): string {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return 'light';
    }

    return localStorage.getItem(this.storageKey) ?? 'light';
  }
}
