import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CheckInKiosk from '../CheckInKiosk';
import { axiosPublic } from '../../../api/axios';

vi.mock('../../../api/axios', () => ({
  axiosPublic: {
    post: vi.fn(),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

describe('CheckInKiosk Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders kiosk check-in header and instructions', () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <CheckInKiosk />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Patient Check-In Kiosk/i)).toBeInTheDocument();
  });

  it('submits patient check-in via axiosPublic to correct endpoint', async () => {
    axiosPublic.post.mockResolvedValue({
      data: {
        id: 104,
        status: 'CHECKED_IN',
      },
    });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <CheckInKiosk />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const walkInBtn = screen.getByRole('button', { name: /Walk-In Visit/i });
    fireEvent.click(walkInBtn);

    const confirmBtn = await screen.findByRole('button', { name: /Confirm Check-In/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(axiosPublic.post).toHaveBeenCalledWith('/reception/kiosk/self-checkin', expect.anything());
    });
  });
});
 