import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { I18nProvider, useTranslation } from './i18nContext';

const TestComponent = () => {
  const { t, changeLanguage, language } = useTranslation();
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="welcome">{t('welcome')}</span>
      <span data-testid="appointments">{t('appointments')}</span>
      <button data-testid="switch-ta" onClick={() => changeLanguage('ta')}>Switch Tamil</button>
      <button data-testid="switch-en" onClick={() => changeLanguage('en')}>Switch English</button>
    </div>
  );
};

describe('I18nProvider', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined' && localStorage.removeItem) {
      localStorage.removeItem('app_language');
    }
  });

  it('renders default English translations', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(screen.getByTestId('welcome').textContent).toBe('Welcome to Healthcare Portal');
    expect(screen.getByTestId('appointments').textContent).toBe('Appointments');
  });

  it('switches to Tamil translation upon request', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    act(() => {
      screen.getByTestId('switch-ta').click();
    });

    expect(screen.getByTestId('lang').textContent).toBe('ta');
    expect(screen.getByTestId('welcome').textContent).toBe('நல்வரவு - மருத்துவ சேவை தளம்');
    expect(screen.getByTestId('appointments').textContent).toBe('முன்பதிவுகள்');
  });
});
