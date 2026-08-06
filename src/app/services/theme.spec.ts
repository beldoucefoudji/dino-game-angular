import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeService } from './theme';

describe('ThemeService', () => {
  beforeEach(() => {
    document.body.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('toggles the body theme and stores the preference', () => {
    const service = TestBed.runInInjectionContext(() => new ThemeService());

    service.toggleTheme();

    expect(document.body.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('dino-theme')).toBe('dark');
  });

  it('applies a specific theme immediately', () => {
    const service = TestBed.runInInjectionContext(() => new ThemeService());

    service.setTheme('dark');

    expect(document.body.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('dino-theme')).toBe('dark');
  });
});
