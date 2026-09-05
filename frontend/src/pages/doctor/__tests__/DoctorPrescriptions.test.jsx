import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import DoctorPrescriptions from '../DoctorPrescriptions';
import { axiosPrivate } from '../../../api/axios';

vi.mock('../../../api/axios', () => ({
  axiosPrivate: {
    get: vi.fn(),
  },
}));

vi.mock('../../../store/authStore', () => ({
  default: () => ({
    user: { id: 101, name: 'Dr. Smith' },
  }),
}));

const MOCK_PRESCRIPTIONS = [
  {
    id: 1,
    patientId: 10,
    patientName: 'Jane Doe',
    createdAt: '2026-09-04T10:00:00Z',
    diagnosis: 'Hypertension',
    status: 'ACTIVE',
    pharmacyStatus: 'PENDING',
    items: [
      { id: 1, medicationName: 'Amlodipine', dosage: '5mg', frequency: 'Once Daily', duration: '30 Days' },
    ],
  },
  {
    id: 2,
    patientId: 11,
    patientName: 'John Wayne',
    createdAt: '2026-09-03T15:30:00Z',
    diagnosis: 'Diabetes Type 2',
    status: 'COMPLETED',
    pharmacyStatus: 'DISPENSED',
    items: [
      { id: 2, medicationName: 'Metformin', dosage: '500mg', frequency: 'Twice Daily', duration: '60 Days' },
    ],
  },
];

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

describe('DoctorPrescriptions Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axiosPrivate.get.mockResolvedValue({ data: MOCK_PRESCRIPTIONS });
  });

  it('fetches and displays doctor prescriptions', async () => {
    renderWithProviders(<DoctorPrescriptions />);
    
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
    expect(screen.getByText('John Wayne')).toBeInTheDocument();
    expect(screen.getAllByText('Hypertension').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Diabetes Type 2').length).toBeGreaterThan(0);
  });

  it('renders pharmacy status badges correctly', async () => {
    renderWithProviders(<DoctorPrescriptions />);
    
    await waitFor(() => {
      expect(screen.getByText('Pending Pharmacy')).toBeInTheDocument();
    });
    expect(screen.getByText('Dispensed')).toBeInTheDocument();
  });

  it('filters prescriptions when switching tabs', async () => {
    renderWithProviders(<DoctorPrescriptions />);
    
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    const activeTab = screen.getByRole('button', { name: /Active/i });
    fireEvent.click(activeTab);

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('handles empty state when no prescriptions returned', async () => {
    axiosPrivate.get.mockResolvedValue({ data: [] });
    renderWithProviders(<DoctorPrescriptions />);

    await waitFor(() => {
      expect(screen.getByText('Prescriptions')).toBeInTheDocument();
    });
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });
});
