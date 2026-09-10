/**
 * unifiedMockData.js — Master single source of truth for unified mock data
 * across all portals, pages, dashboards, tables, and workflows in Elixir Health Care.
 */

export const MOCK_PATIENTS = [
  {
    id: 1,
    name: 'John Smith',
    email: 'patient@clinic.com',
    mrn: 'MRN-2026-001',
    dob: '1985-06-15',
    age: 41,
    gender: 'Male',
    phone: '+1-555-0199',
    address: '742 Evergreen Terrace, Springfield',
    bloodGroup: 'O+',
    allergies: ['Penicillin'],
    conditions: ['Hypertension'],
    emergencyContact: 'Mary Smith (+1-555-0198)',
    insuranceProvider: 'Blue Cross Shield',
    insurancePolicyNumber: 'POL-BC-998811'
  },
  {
    id: 2,
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@example.com',
    mrn: 'MRN-2026-002',
    dob: '1990-03-22',
    age: 36,
    gender: 'Female',
    phone: '+1-555-0211',
    address: '123 Maple Street, Springfield',
    bloodGroup: 'A+',
    allergies: ['Latex'],
    conditions: ['Asthma'],
    emergencyContact: 'David Jenkins (+1-555-0212)',
    insuranceProvider: 'Aetna Health',
    insurancePolicyNumber: 'POL-AE-442233'
  },
  {
    id: 3,
    name: 'Michael Chang',
    email: 'michael.chang@example.com',
    mrn: 'MRN-2026-003',
    dob: '1978-11-04',
    age: 47,
    gender: 'Male',
    phone: '+1-555-0344',
    address: '456 Oak Avenue, Springfield',
    bloodGroup: 'B+',
    allergies: ['None'],
    conditions: ['Gallstones'],
    emergencyContact: 'Lisa Chang (+1-555-0345)',
    insuranceProvider: 'United Healthcare',
    insurancePolicyNumber: 'POL-UH-771122'
  }
];

export const PRIMARY_PATIENT = MOCK_PATIENTS[0];

export const MOCK_DOCTORS = [
  {
    id: 1,
    name: 'Dr. John Doe',
    email: 'doctor@clinic.com',
    specialty: 'Cardiology & General Medicine',
    qualification: 'MD, FACC',
    regNumber: 'DOC-CARD-2026-88',
    department: 'Cardiology',
    phone: '+1-555-0100',
    room: 'Room 102',
    rating: 4.9,
    experienceYears: 15,
    consultationFee: 100.00
  },
  {
    id: 2,
    name: 'Dr. Emily Davis',
    email: 'emily.davis@clinic.com',
    specialty: 'Pediatrics',
    qualification: 'MD, FAAP',
    regNumber: 'DOC-PED-2026-42',
    department: 'Pediatrics',
    phone: '+1-555-0101',
    room: 'Room 201',
    rating: 4.8,
    experienceYears: 11,
    consultationFee: 85.00
  },
  {
    id: 3,
    name: 'Dr. Michael Lee',
    email: 'michael.lee@clinic.com',
    specialty: 'Orthopedics & General Surgery',
    qualification: 'MS, FACS',
    regNumber: 'DOC-SURG-2026-19',
    department: 'Surgery',
    phone: '+1-555-0102',
    room: 'OR-2',
    rating: 4.9,
    experienceYears: 18,
    consultationFee: 150.00
  }
];

export const PRIMARY_DOCTOR = MOCK_DOCTORS[0];

export const MOCK_APPOINTMENTS = [
  {
    id: 'APT-2026-001',
    appointmentNumber: 'APT-2026-001',
    patientId: 1,
    patientName: 'John Smith',
    mrn: 'MRN-2026-001',
    doctorId: 1,
    doctorName: 'Dr. John Doe',
    department: 'Cardiology',
    date: '2026-09-10',
    time: '09:00 AM',
    status: 'CONFIRMED',
    type: 'In-Person Consultation',
    reason: 'Routine Cardiac Follow-up & BP Check',
    token: 'T-101',
    room: 'Room 102',
    fee: 100.00
  },
  {
    id: 'APT-2026-002',
    appointmentNumber: 'APT-2026-002',
    patientId: 2,
    patientName: 'Sarah Jenkins',
    mrn: 'MRN-2026-002',
    doctorId: 2,
    doctorName: 'Dr. Emily Davis',
    department: 'Pediatrics',
    date: '2026-09-10',
    time: '10:30 AM',
    status: 'COMPLETED',
    type: 'Follow-up',
    reason: 'Pediatric Wellness Check',
    token: 'T-102',
    room: 'Room 201',
    fee: 85.00
  },
  {
    id: 'APT-2026-003',
    appointmentNumber: 'APT-2026-003',
    patientId: 3,
    patientName: 'Michael Chang',
    mrn: 'MRN-2026-003',
    doctorId: 3,
    doctorName: 'Dr. Michael Lee',
    department: 'Surgery',
    date: '2026-09-11',
    time: '11:00 AM',
    status: 'SCHEDULED',
    type: 'Pre-Op Evaluation',
    reason: 'Laparoscopic Cholecystectomy Consult',
    token: 'T-103',
    room: 'OR-2',
    fee: 150.00
  }
];

export const MOCK_QUEUE_TOKENS = [
  {
    id: 'T-101',
    tokenNumber: 'T-101',
    patientName: 'John Smith',
    mrn: 'MRN-2026-001',
    doctorName: 'Dr. John Doe',
    department: 'Cardiology',
    room: 'Room 102',
    status: 'IN_CONSULTATION',
    estimatedWait: '0 min',
    issuedAt: '08:45 AM'
  },
  {
    id: 'T-102',
    tokenNumber: 'T-102',
    patientName: 'Sarah Jenkins',
    mrn: 'MRN-2026-002',
    doctorName: 'Dr. Emily Davis',
    department: 'Pediatrics',
    room: 'Room 201',
    status: 'WAITING',
    estimatedWait: '15 min',
    issuedAt: '09:15 AM'
  }
];

export const MOCK_ENCOUNTERS = [
  {
    id: 'ENC-2026-001',
    encounterNumber: 'ENC-2026-001',
    patientId: 1,
    patientName: 'John Smith',
    mrn: 'MRN-2026-001',
    doctorName: 'Dr. John Doe',
    date: '2026-09-10',
    bp: '120/80 mmHg',
    pulse: '72 bpm',
    temp: '98.6 °F',
    weight: '75 kg',
    spO2: '98%',
    diagnosis: 'Primary Hypertension - Well Controlled',
    notes: 'Patient reports no chest pain or shortness of breath. Prescriptions renewed.'
  }
];

export const MOCK_PRESCRIPTIONS = [
  {
    id: 'RX-2026-001',
    prescriptionNumber: 'RX-2026-001',
    patientId: 1,
    patientName: 'John Smith',
    mrn: 'MRN-2026-001',
    doctorName: 'Dr. John Doe',
    date: '2026-09-10',
    status: 'FILLED',
    medicines: [
      { name: 'Lipitor / Atorvastatin 10mg', dosage: '1 tablet daily at bedtime', duration: '30 Days', qty: 30, price: 25.00 },
      { name: 'Amoxicillin 500mg', dosage: '1 capsule three times daily after food', duration: '5 Days', qty: 15, price: 15.00 },
      { name: 'Paracetamol 500mg', dosage: '1 tablet as needed for headache', duration: 'PRN', qty: 10, price: 5.00 }
    ]
  }
];

export const MOCK_PHARMACY_INVENTORY = [
  {
    id: 'MED-001',
    name: 'Lipitor / Atorvastatin 10mg',
    sku: 'MED-LIP-10',
    category: 'Cardiology',
    stock: 250,
    price: 25.00,
    supplier: 'PharmaDistributors Ltd',
    reorderLevel: 50
  },
  {
    id: 'MED-002',
    name: 'Amoxicillin 500mg',
    sku: 'MED-AMX-500',
    category: 'Antibiotics',
    stock: 500,
    price: 15.00,
    supplier: 'PharmaDistributors Ltd',
    reorderLevel: 100
  },
  {
    id: 'MED-003',
    name: 'Paracetamol 500mg',
    sku: 'MED-PCM-500',
    category: 'Analgesics',
    stock: 1000,
    price: 5.00,
    supplier: 'Apex Med Supplies',
    reorderLevel: 200
  }
];

export const MOCK_PURCHASE_ORDERS = [
  {
    id: 'PO-9001',
    poNumber: 'PO-9001',
    vendorName: 'PharmaDistributors Ltd',
    orderDate: '2026-09-01',
    totalAmount: 1250.00,
    status: 'DELIVERED',
    itemsCount: 3
  }
];

export const MOCK_LAB_REPORTS = [
  {
    id: 'LAB-2026-001',
    labNumber: 'LAB-2026-001',
    patientId: 1,
    patientName: 'John Smith',
    mrn: 'MRN-2026-001',
    orderedBy: 'Dr. John Doe',
    testName: 'Comprehensive Lipid Profile & Fasting Blood Glucose',
    category: 'Biochemistry',
    date: '2026-09-10',
    status: 'COMPLETED',
    results: [
      { parameter: 'Total Cholesterol', value: '185 mg/dL', refRange: '120 - 200 mg/dL', status: 'NORMAL' },
      { parameter: 'Fasting Blood Sugar', value: '95 mg/dL', refRange: '70 - 99 mg/dL', status: 'NORMAL' },
      { parameter: 'HDL Cholesterol', value: '52 mg/dL', refRange: '> 40 mg/dL', status: 'NORMAL' },
      { parameter: 'LDL Cholesterol', value: '110 mg/dL', refRange: '< 100 mg/dL', status: 'SLIGHTLY_ELEVATED' }
    ]
  }
];

export const MOCK_RADIOLOGY_REPORTS = [
  {
    id: 'RAD-2026-001',
    radNumber: 'RAD-2026-001',
    patientId: 1,
    patientName: 'John Smith',
    mrn: 'MRN-2026-001',
    orderedBy: 'Dr. John Doe',
    procedureName: 'Chest X-Ray PA View',
    category: 'X-Ray',
    date: '2026-09-10',
    status: 'COMPLETED',
    findings: 'Lungs are clear bilaterally. No cardiomegaly or focal pulmonary consolidation identified.',
    impression: 'Normal Chest Radiograph.'
  }
];

export const MOCK_INVOICES = [
  {
    id: 'INV-2026-001',
    invoiceNumber: 'INV-2026-001',
    patientId: 1,
    patientName: 'John Smith',
    mrn: 'MRN-2026-001',
    date: '2026-09-10',
    subtotal: 190.00,
    tax: 0.00,
    discount: 0.00,
    total: 190.00,
    status: 'PAID',
    paymentMethod: 'Credit Card',
    items: [
      { description: 'Cardiology Consultation (Dr. John Doe)', amount: 100.00 },
      { description: 'Lipid & Blood Sugar Lab Panel', amount: 50.00 },
      { description: 'Pharmacy Prescriptions (Lipitor + Amoxicillin + Paracetamol)', amount: 40.00 }
    ]
  }
];

export const MOCK_SURGERIES = [
  {
    id: 'OT-2026-001',
    otNumber: 'OT-2026-001',
    patientId: 3,
    patientName: 'Michael Chang',
    mrn: 'MRN-2026-003',
    surgeon: 'Dr. Michael Lee',
    procedure: 'Laparoscopic Cholecystectomy',
    otRoom: 'OR-2',
    scheduledDate: '2026-09-12',
    scheduledTime: '08:00 AM - 10:30 AM',
    status: 'SCHEDULED',
    anesthetist: 'Dr. Sarah Connor',
    scrubNurse: 'Nurse Emma Watson'
  }
];

export const MOCK_SUPPORT_TICKETS = [
  {
    id: 'TKT-1001',
    ticketNumber: 'TKT-1001',
    patientId: 1,
    patientName: 'John Smith',
    mrn: 'MRN-2026-001',
    email: 'patient@clinic.com',
    category: 'Portal Access / Lab Results',
    subject: 'Cannot view my latest lab results',
    description: 'I logged into the patient portal but the PDF report for my lipid panel says pending although doctor told me it is ready.',
    priority: 'HIGH',
    status: 'OPEN',
    createdAt: '2026-09-10 09:30 AM',
    assignedTo: 'Support Desk Lead'
  }
];

export const MOCK_AUDIT_LOGS = [
  {
    id: 'AUD-9001',
    auditId: 'AUD-9001',
    timestamp: '2026-09-10 09:15:22',
    actor: 'Dr. John Doe',
    role: 'ROLE_DOCTOR',
    action: 'VIEW_PATIENT_RECORD',
    resource: 'Patient Record MRN-2026-001 (John Smith)',
    ipAddress: '192.168.1.105',
    status: 'SUCCESS'
  },
  {
    id: 'AUD-9002',
    auditId: 'AUD-9002',
    timestamp: '2026-09-10 09:20:10',
    actor: 'System Admin',
    role: 'ROLE_SUPER_ADMIN',
    action: 'UPDATE_SYSTEM_CONFIG',
    resource: 'Elixir Health Care Security Policy',
    ipAddress: '192.168.1.1',
    status: 'SUCCESS'
  }
];

export const MOCK_VENDORS = [
  {
    id: 1,
    name: 'PharmaDistributors Ltd',
    contactPerson: 'Robert Miller',
    email: 'contact@pharmadistributors.com',
    phone: '+1-555-9876',
    suppliedItems: ['Lipitor', 'Amoxicillin', 'Medical Supplies'],
    activeOrdersCount: 1,
    totalSpend: 12500.00,
    status: 'ACTIVE'
  }
];
