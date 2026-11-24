import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BedDouble,
  Bed,
  Activity,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  User,
  Stethoscope,
  ArrowRightLeft,
  LogOut,
  Plus,
  RefreshCw,
  FileText,
  Sparkles,
  ChevronRight,
  X,
  ShieldAlert,
  Pill,
  Check,
  Layers,
  Eye,
  Users,
  Building,
  Thermometer,
  Zap,
  SlidersHorizontal,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   CLINICAL FALLBACK WARDS & BEDS DATA
   Realistic inpatient hospital structure used when backend is unseeded
────────────────────────────────────────────────────────────── */
const INITIAL_WARDS = [
  {
    id: 1,
    name: 'Intensive Care Unit (ICU / CCU)',
    code: 'ICU',
    floor: 'Floor 3, East Wing',
    nurseInCharge: 'Sister Ananya Roy, RN (Critical Care)',
    type: 'CRITICAL_CARE',
    totalBeds: 6,
    rooms: [
      {
        id: 101,
        roomNumber: 'Bay 1 (Critical Care Telemetry)',
        beds: [
          {
            id: 1,
            bedNumber: 'ICU-01',
            status: 'OCCUPIED',
            type: 'Ventilator Bed (Advanced Life Support)',
            acuity: 'CRITICAL',
            patient: {
              id: 101,
              name: 'Arthur Pendelton',
              mrn: 'MRN-IP-9041',
              age: 68,
              gender: 'Male',
              admittedAt: '2026-11-22T08:30:00Z',
              doctor: 'Dr. Arvind Swaminathan, MD',
              department: 'Pulmonology & Critical Care',
              diagnosis: 'ARDS secondary to severe bilateral lobar pneumonia',
              vitals: { bp: '138/86', pulse: 92, spo2: 96, temp: '100.4°F', resp: 22, pain: '3/10', updated: '10m ago' },
              nextMedication: 'IV Meropenem 1g at 18:00',
              allergies: 'Penicillin, Sulfa',
              fallRisk: 'HIGH'
            }
          },
          {
            id: 2,
            bedNumber: 'ICU-02',
            status: 'OCCUPIED',
            type: 'Ventilator Bed (Continuous EEG)',
            acuity: 'CRITICAL',
            patient: {
              id: 102,
              name: 'Meera Nambiar',
              mrn: 'MRN-IP-9042',
              age: 52,
              gender: 'Female',
              admittedAt: '2026-11-23T14:15:00Z',
              doctor: 'Dr. Marcus Vance, MD',
              department: 'Neurology / Stroke Care',
              diagnosis: 'Acute MCA ischemic stroke post-thrombolysis; neuro telemetry',
              vitals: { bp: '142/90', pulse: 84, spo2: 98, temp: '98.8°F', resp: 18, pain: '2/10', updated: '25m ago' },
              nextMedication: 'Aspirin 150mg + Atorvastatin 80mg',
              allergies: 'NKDA',
              fallRisk: 'HIGH'
            }
          },
          {
            id: 3,
            bedNumber: 'ICU-03',
            status: 'OCCUPIED',
            type: 'Step-Down Telemetry Bed',
            acuity: 'MODERATE',
            patient: {
              id: 103,
              name: 'Vikramaditya Rao',
              mrn: 'MRN-IP-9043',
              age: 61,
              gender: 'Male',
              admittedAt: '2026-11-21T19:00:00Z',
              doctor: 'Dr. Sarah Jenkins, MD',
              department: 'Cardiology',
              diagnosis: 'NSTEMI post-percutaneous coronary intervention (PCI stent)',
              vitals: { bp: '124/78', pulse: 72, spo2: 99, temp: '98.4°F', resp: 16, pain: '1/10', updated: '40m ago' },
              nextMedication: 'Ticagrelor 90mg PO at 20:00',
              allergies: 'Codeine',
              fallRisk: 'MODERATE'
            }
          },
          {
            id: 4,
            bedNumber: 'ICU-04',
            status: 'AVAILABLE',
            type: 'Ventilator Bed (Electric Fowler)',
            acuity: 'NONE',
            patient: null
          }
        ]
      },
      {
        id: 102,
        roomNumber: 'Bay 2 (Negative Pressure Isolation)',
        beds: [
          {
            id: 5,
            bedNumber: 'ICU-05',
            status: 'CLEANING',
            type: 'Negative Pressure Isolation Bed',
            acuity: 'NONE',
            patient: null,
            cleaningEst: 'Ready in ~15 mins'
          },
          {
            id: 6,
            bedNumber: 'ICU-06',
            status: 'AVAILABLE',
            type: 'Isolation Bed with HEPA Filtration',
            acuity: 'NONE',
            patient: null
          }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'Post-Operative Surgical Ward (Ward 3B)',
    code: 'SURG',
    floor: 'Floor 3, West Wing',
    nurseInCharge: 'Charge Nurse Priya Nair, RN',
    type: 'SURGICAL',
    totalBeds: 6,
    rooms: [
      {
        id: 201,
        roomNumber: 'Room 301 (Post-Op Step-Down)',
        beds: [
          {
            id: 7,
            bedNumber: 'BED-301A',
            status: 'OCCUPIED',
            type: 'Electric Fowler Bed',
            acuity: 'MODERATE',
            patient: {
              id: 104,
              name: 'Suresh Krishnan',
              mrn: 'MRN-IP-9044',
              age: 45,
              gender: 'Male',
              admittedAt: '2026-11-23T11:00:00Z',
              doctor: 'Dr. James Anderson, MS, FACS',
              department: 'General & Laparoscopic Surgery',
              diagnosis: 'Post-op Day 1 Laparoscopic Cholecystectomy with drain',
              vitals: { bp: '128/82', pulse: 76, spo2: 98, temp: '99.0°F', resp: 16, pain: '4/10', updated: '1h ago' },
              nextMedication: 'IV Paracetamol 1g + Tramadol SOS',
              allergies: 'NKDA',
              fallRisk: 'MODERATE'
            }
          },
          {
            id: 8,
            bedNumber: 'BED-301B',
            status: 'OCCUPIED',
            type: 'Electric Fowler Bed',
            acuity: 'STABLE',
            patient: {
              id: 105,
              name: 'Fatima Zahra',
              mrn: 'MRN-IP-9045',
              age: 34,
              gender: 'Female',
              admittedAt: '2026-11-24T06:45:00Z',
              doctor: 'Dr. James Anderson, MS, FACS',
              department: 'General Surgery',
              diagnosis: 'Post-op Laparoscopic Appendectomy; oral fluids tolerated',
              vitals: { bp: '118/74', pulse: 70, spo2: 100, temp: '98.6°F', resp: 14, pain: '2/10', updated: '45m ago' },
              nextMedication: 'Oral Cefuroxime 500mg at 19:00',
              allergies: 'Ciprofloxacin',
              fallRisk: 'LOW'
            }
          }
        ]
      },
      {
        id: 202,
        roomNumber: 'Room 302 (Orthopedic & Trauma Care)',
        beds: [
          {
            id: 9,
            bedNumber: 'BED-302A',
            status: 'OCCUPIED',
            type: 'Orthopedic Traction Bed',
            acuity: 'MODERATE',
            patient: {
              id: 106,
              name: 'George Reynolds',
              mrn: 'MRN-IP-9046',
              age: 72,
              gender: 'Male',
              admittedAt: '2026-11-20T16:20:00Z',
              doctor: 'Dr. Robert Chen, MS Ortho',
              department: 'Orthopedic Surgery',
              diagnosis: 'Left Total Hip Arthroplasty (THA); DVT prophylaxis & physio',
              vitals: { bp: '132/80', pulse: 74, spo2: 97, temp: '98.5°F', resp: 16, pain: '3/10', updated: '15m ago' },
              nextMedication: 'Enoxaparin 40mg SC at 21:00',
              allergies: 'Ibuprofen (GI bleed)',
              fallRisk: 'HIGH'
            }
          },
          {
            id: 10,
            bedNumber: 'BED-302B',
            status: 'AVAILABLE',
            type: 'Orthopedic Traction Bed',
            acuity: 'NONE',
            patient: null
          }
        ]
      },
      {
        id: 203,
        roomNumber: 'Room 303 (Private Surgical Suite)',
        beds: [
          {
            id: 11,
            bedNumber: 'BED-303A',
            status: 'OCCUPIED',
            type: 'Deluxe Motorized Bed',
            acuity: 'STABLE',
            patient: {
              id: 107,
              name: 'Aditi Sharma',
              mrn: 'MRN-IP-9047',
              age: 29,
              gender: 'Female',
              admittedAt: '2026-11-24T09:00:00Z',
              doctor: 'Dr. Nalini Paul, MD',
              department: 'Obstetrics & Gynecology',
              diagnosis: 'Post-cesarean delivery monitoring; baby Rooming-in',
              vitals: { bp: '116/72', pulse: 68, spo2: 99, temp: '98.4°F', resp: 14, pain: '3/10', updated: '20m ago' },
              nextMedication: 'Oral Iron & Calcium supplements',
              allergies: 'NKDA',
              fallRisk: 'LOW'
            }
          },
          {
            id: 12,
            bedNumber: 'BED-303B',
            status: 'MAINTENANCE',
            type: 'Deluxe Motorized Bed',
            acuity: 'NONE',
            patient: null,
            maintenanceNote: 'Biomedical sensor calibration'
          }
        ]
      }
    ]
  },
  {
    id: 3,
    name: 'General Medical Ward (Ward 2A - North Wing)',
    code: 'MED',
    floor: 'Floor 2, North Wing',
    nurseInCharge: 'Staff Nurse Maria D’Souza, RN',
    type: 'GENERAL_MEDICINE',
    totalBeds: 6,
    rooms: [
      {
        id: 301,
        roomNumber: 'Room 201 (Medical Quad)',
        beds: [
          {
            id: 13,
            bedNumber: 'BED-201A',
            status: 'OCCUPIED',
            type: 'Semi-Fowler Bed',
            acuity: 'STABLE',
            patient: {
              id: 108,
              name: 'Mohammad Al-Hassan',
              mrn: 'MRN-IP-9048',
              age: 58,
              gender: 'Male',
              admittedAt: '2026-11-22T17:30:00Z',
              doctor: 'Dr. Sarah Jenkins, MD',
              department: 'Internal Medicine',
              diagnosis: 'Type 2 Diabetes Mellitus with Diabetic Foot Ulcer; glycemic management',
              vitals: { bp: '130/84', pulse: 80, spo2: 98, temp: '98.7°F', resp: 16, pain: '2/10', updated: '30m ago' },
              nextMedication: 'Insulin Glargine 18 units SC at 22:00',
              allergies: 'Metformin',
              fallRisk: 'MODERATE'
            }
          },
          {
            id: 14,
            bedNumber: 'BED-201B',
            status: 'OCCUPIED',
            type: 'Semi-Fowler Bed',
            acuity: 'STABLE',
            patient: {
              id: 109,
              name: 'Kavitha Balan',
              mrn: 'MRN-IP-9049',
              age: 49,
              gender: 'Female',
              admittedAt: '2026-11-23T10:15:00Z',
              doctor: 'Dr. Arvind Swaminathan, MD',
              department: 'Internal Medicine',
              diagnosis: 'Acute bacterial pyelonephritis on IV Ceftriaxone; fever resolving',
              vitals: { bp: '122/76', pulse: 74, spo2: 99, temp: '99.2°F', resp: 16, pain: '2/10', updated: '50m ago' },
              nextMedication: 'IV Ceftriaxone 1g at 20:00',
              allergies: 'Sulfa Drugs',
              fallRisk: 'LOW'
            }
          },
          {
            id: 15,
            bedNumber: 'BED-201C',
            status: 'AVAILABLE',
            type: 'Semi-Fowler Bed',
            acuity: 'NONE',
            patient: null
          },
          {
            id: 16,
            bedNumber: 'BED-201D',
            status: 'AVAILABLE',
            type: 'Semi-Fowler Bed',
            acuity: 'NONE',
            patient: null
          }
        ]
      },
      {
        id: 302,
        roomNumber: 'Room 202 (Observation Care)',
        beds: [
          {
            id: 17,
            bedNumber: 'BED-202A',
            status: 'OCCUPIED',
            type: 'Standard Ward Bed',
            acuity: 'STABLE',
            patient: {
              id: 110,
              name: 'David Miller',
              mrn: 'MRN-IP-9050',
              age: 54,
              gender: 'Male',
              admittedAt: '2026-11-24T12:00:00Z',
              doctor: 'Dr. Arvind Swaminathan, MD',
              department: 'Pulmonology',
              diagnosis: 'Atypical interstitial pneumonitis awaiting diagnostic HRCT report',
              vitals: { bp: '126/80', pulse: 76, spo2: 97, temp: '98.6°F', resp: 16, pain: '1/10', updated: '15m ago' },
              nextMedication: 'Oral Azithromycin 500mg daily',
              allergies: 'Penicillin',
              fallRisk: 'LOW'
            }
          },
          {
            id: 18,
            bedNumber: 'BED-202B',
            status: 'AVAILABLE',
            type: 'Standard Ward Bed',
            acuity: 'NONE',
            patient: null
          }
        ]
      }
    ]
  }
];

export default function WardManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Active Ward & Filter States
  const [selectedWardId, setSelectedWardId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewLayout, setViewLayout] = useState('floorplan'); // 'floorplan' or 'roster'

  // Interactive Modals State
  const [vitalsModalPatient, setVitalsModalPatient] = useState(null);
  const [vitalsForm, setVitalsForm] = useState({ bp: '', pulse: '', spo2: '', temp: '', resp: '', pain: '' });
  const [transferModalBed, setTransferModalBed] = useState(null);
  const [targetBedId, setTargetBedId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  // 1. Fetch real backend assignments if available
  const { data: rawAssignments, isLoading: isAssignmentsLoading, refetch } = useQuery({
    queryKey: ['nursing-assignments'],
    queryFn: async () => {
      try {
        const response = await axiosPrivate.get('/nursing/assignments');
        return Array.isArray(response.data) ? response.data : response.data?.data || [];
      } catch (err) {
        return [];
      }
    }
  });

  // Local state for wards to allow interactive quick actions (e.g. updating vitals, status, transfers)
  const [wardsData, setWardsData] = useState(INITIAL_WARDS);

  // Compute total hospital ward statistics
  const stats = useMemo(() => {
    let totalBeds = 0;
    let occupied = 0;
    let available = 0;
    let cleaning = 0;
    let maintenance = 0;
    let criticalPatients = 0;

    wardsData.forEach((w) => {
      w.rooms.forEach((r) => {
        r.beds.forEach((b) => {
          totalBeds++;
          if (b.status === 'OCCUPIED') {
            occupied++;
            if (b.acuity === 'CRITICAL') criticalPatients++;
          } else if (b.status === 'AVAILABLE') {
            available++;
          } else if (b.status === 'CLEANING') {
            cleaning++;
          } else if (b.status === 'MAINTENANCE') {
            maintenance++;
          }
        });
      });
    });

    const occupancyRate = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0;

    return { totalBeds, occupied, available, cleaning, maintenance, criticalPatients, occupancyRate };
  }, [wardsData]);

  // Filtered wards and beds
  const filteredWards = useMemo(() => {
    return wardsData
      .filter((w) => selectedWardId === 'ALL' || w.id.toString() === selectedWardId.toString())
      .map((w) => {
        const matchingRooms = w.rooms
          .map((r) => {
            const matchingBeds = r.beds.filter((b) => {
              // Status filter
              if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;

              // Search term filter
              if (searchTerm.trim()) {
                const s = searchTerm.toLowerCase();
                const bedMatch = b.bedNumber.toLowerCase().includes(s);
                const roomMatch = r.roomNumber.toLowerCase().includes(s);
                const patientMatch =
                  b.patient &&
                  (b.patient.name.toLowerCase().includes(s) ||
                    b.patient.mrn.toLowerCase().includes(s) ||
                    b.patient.diagnosis.toLowerCase().includes(s) ||
                    b.patient.doctor.toLowerCase().includes(s));
                return bedMatch || roomMatch || patientMatch;
              }

              return true;
            });

            return { ...r, beds: matchingBeds };
          })
          .filter((r) => r.beds.length > 0);

        return { ...w, rooms: matchingRooms };
      })
      .filter((w) => w.rooms.length > 0);
  }, [wardsData, selectedWardId, statusFilter, searchTerm]);

  // Flattened patient list for the Inpatient Roster View
  const admittedPatientsList = useMemo(() => {
    const list = [];
    wardsData.forEach((w) => {
      w.rooms.forEach((r) => {
        r.beds.forEach((b) => {
          if (b.status === 'OCCUPIED' && b.patient) {
            list.push({
              ...b.patient,
              bedNumber: b.bedNumber,
              roomNumber: r.roomNumber,
              wardName: w.name,
              wardCode: w.code,
              acuity: b.acuity,
              bedId: b.id
            });
          }
        });
      });
    });
    return list;
  }, [wardsData]);

  // Quick Action: Open Vitals Logging Modal
  const handleOpenVitalsModal = (patient, currentVitals) => {
    setVitalsModalPatient(patient);
    setVitalsForm({
      bp: currentVitals?.bp || '120/80',
      pulse: currentVitals?.pulse || '75',
      spo2: currentVitals?.spo2 || '98',
      temp: currentVitals?.temp || '98.6°F',
      resp: currentVitals?.resp || '16',
      pain: currentVitals?.pain || '1/10'
    });
  };

  // Submit Vitals Update
  const handleSaveVitals = (e) => {
    e.preventDefault();
    if (!vitalsModalPatient) return;

    setWardsData((prev) =>
      prev.map((w) => ({
        ...w,
        rooms: w.rooms.map((r) => ({
          ...r,
          beds: r.beds.map((b) => {
            if (b.patient && b.patient.id === vitalsModalPatient.id) {
              return {
                ...b,
                patient: {
                  ...b.patient,
                  vitals: {
                    ...vitalsForm,
                    updated: 'Just now'
                  }
                }
              };
            }
            return b;
          })
        }))
      }))
    );

    toast.success(`Vitals updated for ${vitalsModalPatient.name}`);
    setVitalsModalPatient(null);
  };

  // Quick Action: Mark Bed as Sanitized & Ready
  const handleMarkCleaned = (bedId) => {
    setWardsData((prev) =>
      prev.map((w) => ({
        ...w,
        rooms: w.rooms.map((r) => ({
          ...r,
          beds: r.beds.map((b) => {
            if (b.id === bedId) {
              return {
                ...b,
                status: 'AVAILABLE',
                cleaningEst: null
              };
            }
            return b;
          })
        }))
      }))
    );
    toast.success('Bed marked sanitized and available for admission!');
  };

  // Quick Action: Open Bed Transfer Modal
  const handleOpenTransferModal = (bed) => {
    setTransferModalBed(bed);
    setTargetBedId('');
    setTransferReason('Clinical step-down to lower acuity ward');
  };

  // Execute Bed Transfer
  const handleExecuteTransfer = (e) => {
    e.preventDefault();
    if (!transferModalBed || !targetBedId) {
      toast.error('Please select an available destination bed');
      return;
    }

    const patientToMove = transferModalBed.patient;
    const fromBedId = transferModalBed.id;
    const destBedId = Number(targetBedId);

    setWardsData((prev) =>
      prev.map((w) => ({
        ...w,
        rooms: w.rooms.map((r) => ({
          ...r,
          beds: r.beds.map((b) => {
            if (b.id === fromBedId) {
              return {
                ...b,
                status: 'CLEANING',
                patient: null,
                acuity: 'NONE',
                cleaningEst: 'Sanitizing in progress'
              };
            }
            if (b.id === destBedId) {
              return {
                ...b,
                status: 'OCCUPIED',
                patient: patientToMove,
                acuity: transferModalBed.acuity || 'STABLE'
              };
            }
            return b;
          })
        }))
      }))
    );

    toast.success(`Patient ${patientToMove.name} transferred successfully!`);
    setTransferModalBed(null);
  };

  // Available beds for transfer dropdown
  const availableBedsForTransfer = useMemo(() => {
    const list = [];
    wardsData.forEach((w) => {
      w.rooms.forEach((r) => {
        r.beds.forEach((b) => {
          if (b.status === 'AVAILABLE') {
            list.push({
              id: b.id,
              label: `${b.bedNumber} (${w.name} • ${r.roomNumber})`
            });
          }
        });
      });
    });
    return list;
  }, [wardsData]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OCCUPIED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20';
      case 'CLEANING':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20';
      case 'MAINTENANCE':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getAcuityBadge = (acuity) => {
    switch (acuity) {
      case 'CRITICAL':
        return 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-500/30 font-bold';
      case 'MODERATE':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
      case 'STABLE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200 font-medium';
    }
  };

  return (
    <div className="space-y-6 font-sans w-full">
      {/* ── TOP BANNER & ACTION HEADER ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100 shadow-2xs">
              <BedDouble className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none">
                  Inpatient Wards & Bed Management
                </h1>
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  Live Census
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Real-time ward occupancy, bedside vital signs surveillance, and bed transfer workflow.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Sync Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewLayout('floorplan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewLayout === 'floorplan'
                  ? 'bg-white text-teal-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Bed Floor Plan</span>
            </button>
            <button
              onClick={() => setViewLayout('roster')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewLayout === 'roster'
                  ? 'bg-white text-teal-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Inpatient Roster ({admittedPatientsList.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              refetch();
              toast.success('Inpatient ward census synchronized');
            }}
            className="p-2 sm:px-3 sm:py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Synchronize Live Ward Census"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Sync Census</span>
          </button>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ROW (Responsive Grid) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Beds & Occupancy */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Capacity</span>
              <Building className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalBeds}</span>
              <span className="text-xs font-bold text-slate-500">Beds</span>
            </div>
          </div>
          <div className="mt-3 text-[11px] font-semibold text-slate-500 space-y-1">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{ width: `${stats.occupancyRate}%` }}
              />
            </div>
            <span className="block text-slate-600">{stats.occupancyRate}% Total Occupancy</span>
          </div>
        </div>

        {/* Currently Occupied */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Occupied Beds</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-indigo-950">{stats.occupied}</span>
              <span className="text-xs font-bold text-indigo-600">Admitted</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">Under bedside care</p>
        </div>

        {/* Available for Admission */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Available Beds</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.available}</span>
              <span className="text-xs font-bold text-emerald-700">Ready</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-emerald-600/90 font-semibold">Immediate admissions</p>
        </div>

        {/* Critical Acuity (ICU) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">High Acuity</span>
              <Zap className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-red-600">{stats.criticalPatients}</span>
              <span className="text-xs font-bold text-red-500">ICU</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-red-600/90 font-semibold">Continuous telemetry</p>
        </div>

        {/* Cleaning & Maintenance */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Turnover / Cleaning</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-600">{stats.cleaning + stats.maintenance}</span>
              <span className="text-xs font-bold text-amber-700">Turnover</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">Sanitizing & inspection</p>
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by patient name, MRN, bed #, diagnosis, or doctor..."
              className="w-full text-xs font-medium pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['ALL', 'OCCUPIED', 'AVAILABLE', 'CLEANING', 'MAINTENANCE'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
                }`}
              >
                {status === 'ALL' ? 'All Beds' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Ward Pills Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Ward Select:
          </span>
          <button
            onClick={() => setSelectedWardId('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedWardId === 'ALL'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            All Wards ({stats.totalBeds} Beds)
          </button>
          {wardsData.map((ward) => (
            <button
              key={ward.id}
              onClick={() => setSelectedWardId(ward.id.toString())}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedWardId === ward.id.toString()
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {ward.name.split(' (')[0]} ({ward.totalBeds})
            </button>
          ))}
        </div>
      </div>

      {/* ── LAYOUT 1: INTERACTIVE BED FLOOR PLAN VIEW ── */}
      {viewLayout === 'floorplan' && (
        <div className="space-y-6">
          {filteredWards.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
              <Bed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Beds Match Filter</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No inpatient beds found matching "{searchTerm}" or status "{statusFilter}". Try adjusting your filters.
              </p>
              <button
                onClick={() => {
                  setSelectedWardId('ALL');
                  setStatusFilter('ALL');
                  setSearchTerm('');
                }}
                className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredWards.map((ward) => (
              <div
                key={ward.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
              >
                {/* Ward Header */}
                <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100/90 text-teal-800 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                      {ward.code}
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                        {ward.name}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {ward.floor} • In-Charge: {ward.nurseInCharge}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      {ward.rooms.reduce((acc, r) => acc + r.beds.filter((b) => b.status === 'OCCUPIED').length, 0)} Occupied
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                      {ward.rooms.reduce((acc, r) => acc + r.beds.filter((b) => b.status === 'AVAILABLE').length, 0)} Available
                    </span>
                  </div>
                </div>

                {/* Rooms and Beds Grid */}
                <div className="p-5 sm:p-6 space-y-6">
                  {ward.rooms.map((room) => (
                    <div key={room.id} className="space-y-3.5">
                      {/* Room Header Banner */}
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                          <Building className="w-4 h-4 text-teal-600 shrink-0" />
                          <span>{room.roomNumber}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {room.beds.length} Total Beds
                        </span>
                      </div>

                      {/* ── CARD GRID: Responsive 1 / 2 / 3 / 4 Columns with Perfect Alignment ── */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
                        {room.beds.map((bed) => {
                          const isOccupied = bed.status === 'OCCUPIED';
                          const isAvailable = bed.status === 'AVAILABLE';
                          const isCleaning = bed.status === 'CLEANING';
                          const isMaintenance = bed.status === 'MAINTENANCE';

                          return (
                            <div
                              key={bed.id}
                              className={`rounded-2xl border transition-all p-4 sm:p-5 flex flex-col justify-between h-full min-h-[360px] shadow-xs relative ${
                                isOccupied
                                  ? bed.acuity === 'CRITICAL'
                                    ? 'bg-gradient-to-b from-white to-red-50/20 border-red-200 hover:border-red-300'
                                    : 'bg-white border-slate-200/90 hover:border-slate-300'
                                  : isAvailable
                                  ? 'bg-gradient-to-b from-emerald-50/20 to-white border-emerald-200/90 hover:border-emerald-300'
                                  : isCleaning
                                  ? 'bg-gradient-to-b from-amber-50/20 to-white border-amber-200/90 hover:border-amber-300'
                                  : 'bg-slate-50 border-slate-200/80'
                              }`}
                            >
                              {/* ── CARD TOP SECTION ── */}
                              <div className="space-y-3">
                                {/* Bed Header Badges */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs font-black font-mono px-2.5 py-1 rounded-lg bg-slate-900 text-white tracking-wide shrink-0 shadow-xs">
                                      {bed.bedNumber}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border tracking-wide uppercase shrink-0 ${getStatusBadge(
                                        bed.status
                                      )}`}
                                    >
                                      {bed.status}
                                    </span>
                                  </div>

                                  {isOccupied && bed.acuity && (
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 tracking-wide uppercase ${getAcuityBadge(
                                        bed.acuity
                                      )}`}
                                    >
                                      {bed.acuity}
                                    </span>
                                  )}

                                  {isAvailable && (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                                      Ready
                                    </span>
                                  )}
                                </div>

                                {/* ── CONTENT: OCCUPIED BED STATE ── */}
                                {isOccupied && bed.patient && (
                                  <div className="space-y-3">
                                    {/* Patient Demographics */}
                                    <div>
                                      <div className="flex items-baseline justify-between gap-1">
                                        <h3 className="text-sm font-bold text-slate-900 truncate">
                                          {bed.patient.name}
                                        </h3>
                                        <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                                          {bed.patient.gender[0]} • {bed.patient.age}y
                                        </span>
                                      </div>
                                      <p className="text-[11px] font-mono text-teal-700 font-semibold mt-0.5">
                                        {bed.patient.mrn}
                                      </p>
                                    </div>

                                    {/* Diagnosis & Admitting Doctor (Fixed min-height for row alignment) */}
                                    <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1.5 min-h-[68px] flex flex-col justify-between">
                                      <div className="text-slate-800 font-medium line-clamp-2 leading-snug">
                                        <span className="font-bold text-slate-900">Dx: </span>
                                        {bed.patient.diagnosis}
                                      </div>
                                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate pt-0.5 border-t border-slate-200/50">
                                        <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate">{bed.patient.doctor}</span>
                                      </div>
                                    </div>

                                    {/* Live Vitals Monitor Strip */}
                                    <div className="grid grid-cols-4 gap-1 p-2 bg-slate-900 text-white rounded-xl text-center font-mono shadow-2xs">
                                      <div className="min-w-0">
                                        <span className="text-slate-400 text-[9px] uppercase tracking-wider block">BP</span>
                                        <span className="font-bold text-sky-400 text-[11px] truncate block">
                                          {bed.patient.vitals.bp}
                                        </span>
                                      </div>
                                      <div className="min-w-0">
                                        <span className="text-slate-400 text-[9px] uppercase tracking-wider block">HR</span>
                                        <span className="font-bold text-emerald-400 text-[11px] truncate block">
                                          {bed.patient.vitals.pulse}
                                        </span>
                                      </div>
                                      <div className="min-w-0">
                                        <span className="text-slate-400 text-[9px] uppercase tracking-wider block">SpO2</span>
                                        <span className="font-bold text-amber-300 text-[11px] truncate block">
                                          {bed.patient.vitals.spo2}%
                                        </span>
                                      </div>
                                      <div className="min-w-0">
                                        <span className="text-slate-400 text-[9px] uppercase tracking-wider block">Temp</span>
                                        <span className="font-bold text-slate-200 text-[11px] truncate block">
                                          {bed.patient.vitals.temp}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Next Medication / Nursing Alert */}
                                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5 truncate pt-0.5">
                                      <Pill className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                      <span className="truncate font-medium">{bed.patient.nextMedication}</span>
                                    </div>
                                  </div>
                                )}

                                {/* ── CONTENT: AVAILABLE BED STATE ── */}
                                {isAvailable && (
                                  <div className="py-6 text-center space-y-3 flex-1 flex flex-col justify-center">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
                                      <BedDouble className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-bold text-emerald-950">Ready for Admission</h4>
                                      <p className="text-xs text-slate-500 mt-0.5">{bed.type}</p>
                                    </div>
                                    <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/80 text-[11px] text-emerald-800 font-medium">
                                      Terminal Disinfection Complete • Oxygen Line Tested
                                    </div>
                                  </div>
                                )}

                                {/* ── CONTENT: CLEANING BED STATE ── */}
                                {isCleaning && (
                                  <div className="py-6 text-center space-y-3 flex-1 flex flex-col justify-center">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100 shadow-2xs animate-pulse">
                                      <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-bold text-amber-950">Turnover Sanitization</h4>
                                      <p className="text-xs text-slate-500 mt-0.5">{bed.cleaningEst || 'In progress'}</p>
                                    </div>
                                    <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100/80 text-[11px] text-amber-800 font-medium">
                                      Deep UV-C sterilization & linen change in progress
                                    </div>
                                  </div>
                                )}

                                {/* ── CONTENT: MAINTENANCE BED STATE ── */}
                                {isMaintenance && (
                                  <div className="py-6 text-center space-y-3 flex-1 flex flex-col justify-center">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto border border-slate-200">
                                      <ShieldAlert className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-bold text-slate-800">Biomedical Inspection</h4>
                                      <p className="text-xs text-slate-500 mt-0.5">{bed.maintenanceNote || 'Sensor check'}</p>
                                    </div>
                                    <div className="bg-slate-100/80 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                                      Scheduled calibration by clinical engineering
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* ── CARD BOTTOM ACTIONS FOOTER (Pinned & Aligned) ── */}
                              <div className="pt-3.5 mt-3 border-t border-slate-100">
                                {isOccupied && bed.patient ? (
                                  <div className="flex items-center gap-2 w-full">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenVitalsModal(bed.patient, bed.patient.vitals)}
                                      className="flex-1 py-2 px-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                      title="Record bedside vital signs"
                                    >
                                      <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
                                      <span>Log Vitals</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenTransferModal(bed)}
                                      className="flex-1 py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                                      title="Transfer patient to another bed"
                                    >
                                      <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Transfer</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => navigate(`/nurse/workspace?patientId=${bed.patient.id}`)}
                                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition cursor-pointer shrink-0"
                                      title="Open Patient Clinical Chart"
                                    >
                                      <FileText className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : isAvailable ? (
                                  <button
                                    type="button"
                                    onClick={() => toast.success(`Bed ${bed.bedNumber} ready for admission booking.`)}
                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs shadow-emerald-600/20"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span>Admit Patient Here</span>
                                  </button>
                                ) : isCleaning ? (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkCleaned(bed.id)}
                                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shadow-amber-600/20"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Mark Cleaned & Available</span>
                                  </button>
                                ) : (
                                  <div className="w-full py-2 text-center text-xs text-slate-400 font-medium bg-slate-100 rounded-xl">
                                    Temporarily Out of Service
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── LAYOUT 2: INPATIENT DOSSIER ROSTER VIEW ── */}
      {viewLayout === 'roster' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Admitted Patients Care Roster</h3>
              <p className="text-xs text-slate-500">
                Detailed vital sign records, diagnoses, and upcoming medication administrations.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              {admittedPatientsList.length} Active Inpatients
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Patient / MRN</th>
                  <th className="px-4 py-3">Ward & Bed</th>
                  <th className="px-4 py-3">Acuity</th>
                  <th className="px-4 py-3">Diagnosis & Doctor</th>
                  <th className="px-4 py-3">Current Vitals</th>
                  <th className="px-4 py-3">Next Medication</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admittedPatientsList.map((pt) => (
                  <tr key={pt.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{pt.name}</div>
                      <div className="text-[11px] text-teal-700 font-mono">{pt.mrn}</div>
                      <div className="text-[10px] text-slate-400">
                        {pt.gender} • {pt.age} yrs
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{pt.bedNumber}</div>
                      <div className="text-[11px] text-slate-500">{pt.wardCode} • {pt.roomNumber}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getAcuityBadge(pt.acuity)}`}>
                        {pt.acuity}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="font-medium text-slate-800 truncate" title={pt.diagnosis}>
                        {pt.diagnosis}
                      </div>
                      <div className="text-[11px] text-slate-500">{pt.doctor}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-[11px] font-semibold text-slate-900">
                        BP: {pt.vitals.bp} | HR: {pt.vitals.pulse}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">
                        SpO2: {pt.vitals.spo2}% | Temp: {pt.vitals.temp}
                      </div>
                      <div className="text-[9px] text-slate-400 italic">Updated {pt.vitals.updated}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-slate-800 font-medium flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{pt.nextMedication}</span>
                      </div>
                      <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                        Allergies: {pt.allergies}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenVitalsModal(pt, pt.vitals)}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg transition cursor-pointer"
                          title="Record Vitals"
                        >
                          Log Vitals
                        </button>
                        <button
                          onClick={() => navigate(`/nurse/workspace?patientId=${pt.id}`)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Open Chart"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL 1: RECORD BEDSIDE VITALS ── */}
      {vitalsModalPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Record Bedside Vitals</h3>
              </div>
              <button
                onClick={() => setVitalsModalPatient(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVitals} className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500">Patient:</p>
                <p className="text-sm font-bold text-slate-900">
                  {vitalsModalPatient.name}{' '}
                  <span className="text-teal-700 font-mono text-xs">({vitalsModalPatient.mrn})</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    value={vitalsForm.bp}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, bp: e.target.value })}
                    placeholder="120/80"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-teal-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={vitalsForm.pulse}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })}
                    placeholder="72"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-teal-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Oxygen Saturation (SpO2 %)</label>
                  <input
                    type="number"
                    value={vitalsForm.spo2}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                    placeholder="98"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-teal-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Body Temp (°F)</label>
                  <input
                    type="text"
                    value={vitalsForm.temp}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, temp: e.target.value })}
                    placeholder="98.6°F"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-teal-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Resp Rate (/min)</label>
                  <input
                    type="number"
                    value={vitalsForm.resp}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, resp: e.target.value })}
                    placeholder="16"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-teal-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Pain Score (0 - 10)</label>
                  <input
                    type="text"
                    value={vitalsForm.pain}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, pain: e.target.value })}
                    placeholder="2/10"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-teal-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVitalsModalPatient(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  Save Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: PATIENT BED TRANSFER ── */}
      {transferModalBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Transfer Inpatient Bed</h3>
              </div>
              <button
                onClick={() => setTransferModalBed(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-5 space-y-4 text-xs">
              <div>
                <p className="text-[11px] font-semibold text-slate-400">Current Patient & Bed:</p>
                <p className="text-sm font-bold text-slate-900">
                  {transferModalBed.patient?.name} • Bed {transferModalBed.bedNumber}
                </p>
                <p className="text-[11px] text-teal-700 font-mono">{transferModalBed.patient?.mrn}</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Destination Available Bed:
                </label>
                <select
                  value={targetBedId}
                  onChange={(e) => setTargetBedId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-teal-500 outline-none text-xs font-medium cursor-pointer"
                >
                  <option value="">-- Choose an available bed --</option>
                  {availableBedsForTransfer.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Reason for Transfer:
                </label>
                <textarea
                  rows={2}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  required
                  placeholder="e.g. Clinical step-down, isolation requirement, upgrade to private suite..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-teal-500 outline-none text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferModalBed(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
