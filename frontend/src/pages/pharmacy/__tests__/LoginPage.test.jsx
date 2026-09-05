import PortalLoginPage from '../../auth/PortalLoginPage';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { isTokenValid } from '../../../store/authStore';

vi.mock('../../../store/authStore', () => {
  const mockState = {
    login: vi.fn().mockResolvedValue(true),
    verifyMfa: vi.fn(),
    mfaPending: false,
    error: null,
    isLoading: false,
    mfaEmail: null,
    roles: [],
    clearError: vi.fn(),
    clearStaleToken: vi.fn(),
  };
  const useAuthStoreMock = () => mockState;
  useAuthStoreMock.getState = () => mockState;
  return {
    default: useAuthStoreMock,
    isTokenValid: vi.fn().mockReturnValue(false)
  };
});

describe('PortalLoginPage', () => {
  const renderWithProviders = (component) => {
    return render(
      <MemoryRouter initialEntries={['/doctor/login']}>
        <Routes>
          <Route path="/:portalSlug/login" element={component} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders login form with portal title', () => {
    isTokenValid.mockReturnValue(false);
    renderWithProviders(<PortalLoginPage />);
    expect(screen.getByText(/Sign in to continue to your account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });
});
