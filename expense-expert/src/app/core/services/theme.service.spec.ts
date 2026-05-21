import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

const THEME_KEY = 'expense-expert-theme';

describe('ThemeService', () => {
  let mockLocalStorage: { [key: string]: string };
  let matchMediaMock: jasmine.Spy;
  let addClassSpy: jasmine.Spy;
  let removeClassSpy: jasmine.Spy;

  beforeEach(() => {
    mockLocalStorage = {};

    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      return key in mockLocalStorage ? mockLocalStorage[key] : null;
    });
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });

    addClassSpy = spyOn(document.documentElement.classList, 'add');
    removeClassSpy = spyOn(document.documentElement.classList, 'remove');

    matchMediaMock = spyOn(window, 'matchMedia').and.returnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList);
  });

  describe('initialization', () => {
    it('should default to light theme if no saved preference and system prefers light', () => {
      const service = TestBed.inject(ThemeService);

      expect(service.isDark()).toBeFalse();
      expect(removeClassSpy).toHaveBeenCalledWith('dark');
      expect(localStorage.getItem).toHaveBeenCalledWith(THEME_KEY);
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should default to dark theme if no saved preference and system prefers dark', () => {
      matchMediaMock.and.returnValue({
        matches: true,
      } as unknown as MediaQueryList);

      const service = TestBed.inject(ThemeService);

      expect(service.isDark()).toBeTrue();
      expect(addClassSpy).toHaveBeenCalledWith('dark');
    });

    it('should load dark theme from localStorage if saved', () => {
      mockLocalStorage[THEME_KEY] = 'dark';

      const service = TestBed.inject(ThemeService);

      expect(service.isDark()).toBeTrue();
      expect(addClassSpy).toHaveBeenCalledWith('dark');
    });

    it('should load light theme from localStorage if saved', () => {
      mockLocalStorage[THEME_KEY] = 'light';

      const service = TestBed.inject(ThemeService);

      expect(service.isDark()).toBeFalse();
      expect(removeClassSpy).toHaveBeenCalledWith('dark');
    });
  });

  describe('toggle', () => {
    it('should toggle from light to dark', () => {
      mockLocalStorage[THEME_KEY] = 'light';
      const service = TestBed.inject(ThemeService);

      service.toggle();

      expect(service.isDark()).toBeTrue();
      expect(addClassSpy).toHaveBeenCalledWith('dark');
      expect(localStorage.setItem).toHaveBeenCalledWith(THEME_KEY, 'dark');
    });

    it('should toggle from dark to light', () => {
      mockLocalStorage[THEME_KEY] = 'dark';
      const service = TestBed.inject(ThemeService);

      service.toggle();

      expect(service.isDark()).toBeFalse();
      expect(removeClassSpy).toHaveBeenCalledWith('dark');
      expect(localStorage.setItem).toHaveBeenCalledWith(THEME_KEY, 'light');
    });
  });
});
