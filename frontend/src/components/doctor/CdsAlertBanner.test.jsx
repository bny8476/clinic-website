import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

describe('CdsAlertBanner Component', () => {
  const mockAlert = {
    id: 1,
    patientId: 100,
    message: 'CRITICAL DRUG ALLERGY: Patient is allergic to Penicillin.',
    severity: 'CRITICAL',
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  it('renders alert message and severity badge correctly', () => {
    render(<CdsAlertBanner alert={mockAlert} onAcknowledge={() => {}} />);
    
    expect(screen.getByText(/CRITICAL CDS Alert/i)).toBeInTheDocument();
    expect(screen.getByText(/CRITICAL DRUG ALLERGY: Patient is allergic to Penicillin./i)).toBeInTheDocument();
  });

  it('calls onAcknowledge when Acknowledge button is clicked', () => {
    const handleAcknowledge = vi.fn();
    render(<CdsAlertBanner alert={mockAlert} onAcknowledge={handleAcknowledge} />);

    const ackButton = screen.getByRole('button', { name: /Acknowledge/i });
    fireEvent.click(ackButton);

    expect(handleAcknowledge).toHaveBeenCalledWith(1);
  });
});
