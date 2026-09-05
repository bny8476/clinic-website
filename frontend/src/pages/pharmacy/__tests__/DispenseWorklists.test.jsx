import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import DispenseWorklists from '../DispenseWorklists';
import { axiosPrivate } from '../../../api/axios';

vi.mock('../../../api/axios', () => ({
  axiosPrivate: {
    get: vi.fn(),
    post: vi.fn(),
  },
  default: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

vi.mock('../../../hooks/usePageData', () => ({
  usePageData: () => ({
    items: [
      {
        id: 501,
        prescriptionId: 101,
        patientName: 'Robert Paulson',
        doctorName: 'Dr. House',
        status: 'PENDING',
        items: [
          { medicineId: 10, medicineName: 'Amoxicillin', quantity: 20 },
        ],
      },
    ],
    isLoading: false,
  }),
}));

function renderWithProviders(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DispenseWorklists Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pending dispensing items', async () => {
    renderWithProviders(<DispenseWorklists />);

    await waitFor(() => {
      expect(screen.getByText('Robert Paulson')).toBeInTheDocument();
    });
    expect(screen.getByText('Amoxicillin')).toBeInTheDocument();
  });
});
