import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import PatientPrescriptions from '../PatientPrescriptions';
import { axiosPrivate } from '../../../api/axios';

vi.mock('../../../api/axios', () => ({
  axiosPrivate: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../../../store/authStore', () => ({
  default: () => ({
    user: { id: 201, name: 'Alice Patient' },
  }),
}));

const MOCK_PATIENT_PRESCRIPTIONS = [
  {
    id: 101,
    doctorName: 'Sarah Jenkins',
    createdAt: '2026-09-04T08:00:00Z',
    diagnosis: 'Mild Asthma',
    notes: 'Take inhaler as needed',
    pharmacyStatus: 'DISPENSED',
    refillsRemaining: 2,
    items: [
      { id: 1, medicationName: 'Albuterol Inhaler', dosage: '90mcg', frequency: 'PRN', duration: '30 Days', instructions: '2 puffs every 4 to 6 hours as needed' },
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

describe('PatientPrescriptions Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axiosPrivate.get.mockImplementation((url) => {
      if (url.includes('/prescriptions/patient/')) {
        return Promise.resolve({ data: MOCK_PATIENT_PRESCRIPTIONS });
      }
      if (url.includes('/prescriptions/refill')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('renders patient prescriptions list', async () => {
    renderWithProviders(<PatientPrescriptions />);

    await waitFor(() => {
      expect(screen.getByText('Dr. Sarah Jenkins')).toBeInTheDocument();
    });
    expect(screen.getByText('Albuterol Inhaler')).toBeInTheDocument();
    expect(screen.getAllByText('Dispensed').length).toBeGreaterThan(0);
  });

  it('opens refill modal when clicking request refill button', async () => {
    renderWithProviders(<PatientPrescriptions />);

    await waitFor(() => screen.getByText('Dr. Sarah Jenkins'));

    const refillBtn = screen.getByText(/Request Refill \(2 left\)/i);
    fireEvent.click(refillBtn);

    expect(await screen.findByText(/Request Prescription Refill/i)).toBeInTheDocument();
  });

  it('submits refill request successfully', async () => {
    axiosPrivate.post.mockResolvedValue({ data: { id: 1, status: 'PENDING' } });
    renderWithProviders(<PatientPrescriptions />);

    await waitFor(() => screen.getByText('Dr. Sarah Jenkins'));

    fireEvent.click(screen.getByText(/Request Refill \(2 left\)/i));

    const submitBtn = await screen.findByText('Submit Refill Request');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(axiosPrivate.post).toHaveBeenCalledWith('/prescriptions/refill', expect.objectContaining({
        prescriptionId: 101,
      }));
    });
  });
});
