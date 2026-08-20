import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAuth } from '../../../context/pharmacy/AuthContext';

// Mock the module directly
vi.mock('../../../context/pharmacy/AuthContext', () => {
  return {
    useAuth: vi.fn(),
    AuthProvider: ({ children }) => <>{children}</>
  };
});

describe('ProtectedRoute', () => {
  it('redirects to login when unauthenticated', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute><div data-testid="protected-content">Protected Content</div></ProtectedRoute>} />
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    useAuth.mockReturnValue({
      user: { id: 1, username: 'testuser', roles: ['PHARMACY_STAFF'] },
      isAuthenticated: true,
      loading: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});
