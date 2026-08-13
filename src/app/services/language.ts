import { Injectable, signal } from '@angular/core';

export type Lang = 'en' | 'fr';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  lang = signal<Lang>((localStorage.getItem('dino_lang') as Lang) || 'en');

  toggle() {
    const next: Lang = this.lang() === 'en' ? 'fr' : 'en';
    this.lang.set(next);
    localStorage.setItem('dino_lang', next);
  }
}