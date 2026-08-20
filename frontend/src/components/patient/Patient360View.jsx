import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { format, differenceInYears, parseISO } from 'date-fns';

const Patient360View = ({ patientId, onBack, onNavigateToPrescription }) => {
  const [activeTab, setActiveTab] = useState('Overview');

  const { data: patient360, isLoading, error } = useQuery({
    queryKey: ['patient-360', patientId],
    queryFn: async () => (await axiosPrivate.get(`/patients/${patientId}/360`)).data,
  });

  if (isLoading) return <div className="p-10 text-center text-slate-500 font-medium">Loading patient 360 profile...</div>;
  if (error || !patient360 || !patient360.identity) return <div className="p-10 text-center text-red-500 font-medium">Failed to load patient profile</div>;

  const { profile, identity, recentVitals, recentAppointments, upcomingAppointments, recentPrescriptions, recentLabOrders, invoices, clinicalNotes } = patient360;

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    return differenceInYears(new Date(), parseISO(dob));
  };

  const generateDisplayId = (id) => {
    if (!id) return '-';
    return `PAT-${String(id).padStart(5, '0')}`;
  };

  const getFullName = () => {
    if (!identity) return 'Unknown Patient';
    return `${identity.firstName || ''} ${identity.lastName || ''}`.trim();
  };

  const parseJsonArray = (jsonString) => {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  };

  const allergies = parseJsonArray(profile?.allergies);
  const chronicConditions = parseJsonArray(profile?.chronicConditions);
  const currentMedications = parseJsonArray(profile?.currentMedications);

  const tabs = ['Overview', 'Appointments', 'Prescriptions', 'Lab Reports', 'Medical History', 'Billing & Payments'];

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* LEFT SIDEBAR: Profile Card */}
      <div className="w-full lg:w-[340px] flex-shrink-0 flex flex-col gap-6">
        
        {/* Profile Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center">
          <div className="flex items-center gap-4 w-full mb-6">
            <img loading="lazy" 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName())}&background=random`} 
              alt={getFullName()}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">{getFullName()}</h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5 mb-1.5">ID: {generateDisplayId(patientId)}</p>
              <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-[#5B21B6] text-[10px] font-bold rounded-md uppercase tracking-wide">
                Active Patient
              </span>
            </div>
          </div>

          {/* Detail List */}
          <div className="w-full flex flex-col gap-4 text-xs font-semibold text-slate-500 border-t border-slate-100 pt-5">
            <div className="grid grid-cols-[32px_90px_1fr] items-center">
              <User size={15} className="text-[#5B21B6] justify-self-center" />
              <span className="text-slate-400">Age / Gender</span>
              <span className="text-slate-800">{calculateAge(profile?.dateOfBirth)} Years / {profile?.gender || 'N/A'}</span>
            </div>
            <div className="grid grid-cols-[32px_90px_1fr] items-center">
              <Phone size={15} className="text-[#5B21B6] justify-self-center" />
              <span className="text-slate-400">Phone</span>
              <span className="text-slate-800">{identity.phoneNumber || 'N/A'}</span>
            </div>
            <div className="grid grid-cols-[32px_90px_1fr] items-center">
              <Mail size={15} className="text-[#5B21B6] justify-self-center" />
              <span className="text-slate-400">Email</span>
              <span className="text-slate-800 break-all">{identity.email || 'N/A'}</span>
            </div>
            <div className="grid grid-cols-[32px_90px_1fr] items-center">
              <Droplet size={15} className="text-[#5B21B6] justify-self-center" />
              <span className="text-slate-400">Blood Group</span>
              <span className="text-slate-800">{profile?.bloodGroup || 'N/A'}</span>
            </div>
            <div className="grid grid-cols-[32px_90px_1fr] items-center">
              <Calendar size={15} className="text-[#5B21B6] justify-self-center" />
              <span className="text-slate-400">Date of Birth</span>
              <span className="text-slate-800">{profile?.dateOfBirth ? format(parseISO(profile.dateOfBirth), 'dd MMM yyyy') : 'N/A'}</span>
            </div>
            <div className="grid grid-cols-[32px_90px_1fr] items-start mt-1">
              <MapPin size={15} className="text-[#5B21B6] justify-self-center mt-0.5" />
              <span className="text-slate-400">Address</span>
              <span className="text-slate-800 leading-tight">{profile?.address || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        {profile?.emergencyContactName && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative">
            <h3 className="text-[13px] font-bold text-slate-800 mb-4 flex justify-between items-center">
              Emergency Contact
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">{profile.emergencyContactName}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">{profile.emergencyContactPhone || 'N/A'}</p>
              </div>
              <button className="w-8 h-8 rounded-full bg-indigo-50 text-[#5B21B6] flex items-center justify-center">
                <Phone size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Allergies */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative">
          <h3 className="text-[13px] font-bold text-slate-800 mb-4 flex justify-between items-center">
            Allergies
          </h3>
          {allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allergies.map((allergy, idx) => (
                <span key={idx} className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 text-[11px] font-bold rounded-md flex items-center gap-1">
                  <AlertTriangle size={10} /> {allergy}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-medium italic">No known allergies</p>
          )}
        </div>
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Tabs */}
        <div className="bg-white rounded-t-xl border border-b-0 border-slate-200 px-6 pt-4 flex gap-6 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold whitespace-nowrap transition-colors relative ${
                activeTab === tab ? 'text-[#5B21B6]' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#5B21B6] rounded-t-md"></div>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="bg-white rounded-b-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6">
          
          {activeTab === 'Overview' && (
            <>
              {/* Summary Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Card 1 */}
                <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-[#5B21B6] flex items-center justify-center shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 mb-1">Last Appointment</p>
                    {recentAppointments?.length > 0 ? (
                      <>
                        <p className="text-[14px] font-bold text-slate-800">{format(parseISO(recentAppointments[0].startTime), 'dd MMM yyyy')}</p>
                        <p className="text-[11px] font-semibold text-slate-500 mt-1">{format(parseISO(recentAppointments[0].startTime), 'hh:mm a')}</p>
                        <p className="text-[11px] font-semibold text-slate-500">with Dr. {recentAppointments[0].doctorLastName}</p>
                      </>
                    ) : (
                      <p className="text-[13px] font-medium text-slate-400 mt-2 italic">No past appointments</p>
                    )}
                  </div>
                </div>
                {/* Card 2 */}
                <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 text-[#16A34A] flex items-center justify-center shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 mb-1">Next Appointment</p>
                    {upcomingAppointments?.length > 0 ? (
                      <>
                        <p className="text-[14px] font-bold text-slate-800">{format(parseISO(upcomingAppointments[0].startTime), 'dd MMM yyyy')}</p>
                        <p className="text-[11px] font-semibold text-slate-500 mt-1">{format(parseISO(upcomingAppointments[0].startTime), 'hh:mm a')}</p>
                        <p className="text-[11px] font-semibold text-slate-500">with Dr. {upcomingAppointments[0].doctorLastName}</p>
                      </>
                    ) : (
                      <p className="text-[13px] font-medium text-slate-400 mt-2 italic">No upcoming</p>
                    )}
                  </div>
                </div>
                {/* Card 3 */}
                <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 text-[#EA580C] flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 mb-1">Recent Rx</p>
                    <p className="text-[17px] font-bold text-slate-800 mb-1">{recentPrescriptions?.length || 0}</p>
                    <button onClick={() => setActiveTab('Prescriptions')} className="text-[11px] font-bold text-slate-500 hover:text-slate-800">View prescriptions</button>
                  </div>
                </div>
                {/* Card 4 */}
                <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
                    <Activity size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 mb-1">Recent Vitals</p>
                    <p className="text-[17px] font-bold text-slate-800 mb-1">{recentVitals?.length || 0}</p>
                    <button onClick={() => setActiveTab('Medical History')} className="text-[11px] font-bold text-slate-500 hover:text-slate-800">View history</button>
                  </div>
                </div>
              </div>

              {/* Medical Summary Details */}
              <div className="w-full">
                <h3 className="text-[15px] font-bold text-slate-800 mb-4">Medical Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold text-slate-400 mb-1">Medical History Summary</p>
                    <p className="text-[13px] font-bold text-slate-800">{profile?.medicalHistorySummary || 'No summary provided.'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold text-slate-400 mb-1">Chronic Conditions</p>
                    <p className="text-[13px] font-bold text-slate-800">{chronicConditions.length > 0 ? chronicConditions.join(', ') : 'None'}</p>
                  </div>
                  
                  {recentVitals?.length > 0 ? (
                    <>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 mb-1">Latest Blood Pressure</p>
                        <p className="text-[13px] font-bold text-slate-800">{recentVitals[0].bloodPressure || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 mb-1">Latest Heart Rate</p>
                        <p className="text-[13px] font-bold text-slate-800">{recentVitals[0].heartRate ? `${recentVitals[0].heartRate} bpm` : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 mb-1">Latest Weight</p>
                        <p className="text-[13px] font-bold text-slate-800">{recentVitals[0].weight ? `${recentVitals[0].weight} kg` : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400 mb-1">Latest Temp</p>
                        <p className="text-[13px] font-bold text-slate-800">{recentVitals[0].temperature ? `${recentVitals[0].temperature} °C` : 'N/A'}</p>
                      </div>
                      <div className="col-span-1 md:col-span-4">
                        <p className="text-[11px] font-semibold text-slate-400 mb-1">Vitals Updated</p>
                        <p className="text-[13px] font-bold text-slate-800">{format(parseISO(recentVitals[0].recordedAt), 'dd MMM yyyy, hh:mm a')}</p>
                      </div>
                    </>
                  ) : (
                     <div className="col-span-4">
                        <p className="text-sm font-medium text-slate-400 italic">No vitals recorded yet.</p>
                     </div>
                  )}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Two Column Bottom Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Recent Medical History / Events */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[14px] font-bold text-slate-800">Recent Visits & Prescriptions</h3>
                    <button className="text-[#5B21B6] text-[11px] font-bold hover:underline">View All</button>
                  </div>
                  
                  <div className="flex flex-col gap-6 relative before:absolute before:left-[45px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                    
                    {/* Interleave appointments and prescriptions briefly as a mock timeline if they exist */}
                    {recentAppointments?.slice(0,3).map((apt, idx) => (
                       <div key={`apt-${apt.id}`} className="flex gap-4 relative z-10">
                        <div className="w-[45px] pt-0.5 shrink-0 flex flex-col items-center bg-white">
                          <span className="text-[15px] font-bold text-slate-800 leading-none">{format(parseISO(apt.startTime), 'dd')}</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{format(parseISO(apt.startTime), 'MMM yyyy')}</span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-[#5B21B6] absolute left-[41.5px] top-1.5 ring-4 ring-white"></div>
                        <div className="flex-1 pl-3 pb-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[12px] font-bold text-slate-800">Consultation with Dr. {apt.doctorLastName}</p>
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-[#5B21B6] text-[9px] font-bold rounded">Visit</span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-500 leading-relaxed">{apt.reasonForVisit || 'Follow-up'}</p>
                        </div>
                      </div>
                    ))}

                    {(!recentAppointments || recentAppointments.length === 0) && (
                      <p className="text-xs italic text-slate-400 pl-16">No past visits on record.</p>
                    )}
                  </div>
                </div>

                {/* Current Medications */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[14px] font-bold text-slate-800">Current Medications</h3>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {currentMedications.length > 0 ? currentMedications.map((med, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-serif italic font-bold">Rx</div>
                          <span className="text-[12px] font-bold text-slate-800">{med}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[9px] font-bold rounded-md">Active</span>
                      </div>
                    )) : (
                      <p className="text-sm font-medium text-slate-400 italic">No current medications listed.</p>
                    )}
                  </div>

                  <div className="mt-5 text-center">
                     {onNavigateToPrescription && (
                         <button 
                            onClick={() => onNavigateToPrescription(patientId)}
                            className="text-[#5B21B6] bg-indigo-50 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors mx-auto inline-block">
                          + New Prescription
                        </button>
                     )}
                  </div>
                </div>

              </div>
            </>
          )}

          {activeTab === 'Appointments' && (
            <div className="w-full">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Appointment History</h3>
              <div className="flex flex-col gap-4">
                {recentAppointments?.length > 0 || upcomingAppointments?.length > 0 ? (
                  <>
                    {upcomingAppointments?.map(apt => (
                      <div key={apt.id} className="p-4 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-[#1E40AF]">{format(parseISO(apt.startTime), 'dd MMM yyyy, hh:mm a')}</p>
                          <p className="text-xs font-semibold text-[#3B82F6]">Dr. {apt.doctorLastName}</p>
                        </div>
                        <span className="px-3 py-1 bg-[#BFDBFE] text-[#1D4ED8] text-[10px] font-bold rounded-md uppercase">Upcoming</span>
                      </div>
                    ))}
                    {recentAppointments?.map(apt => (
                      <div key={apt.id} className="p-4 rounded-xl border border-slate-200 bg-white flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{format(parseISO(apt.startTime), 'dd MMM yyyy, hh:mm a')}</p>
                          <p className="text-xs font-semibold text-slate-500">Dr. {apt.doctorLastName}</p>
                        </div>
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md uppercase">{apt.status || 'Past'}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-slate-500 italic">No appointments found.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Prescriptions' && (
            <div className="w-full">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Prescriptions</h3>
              <div className="flex flex-col gap-4">
                {recentPrescriptions?.length > 0 ? recentPrescriptions.map(rx => (
                  <div key={rx.id} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-slate-800">Date: {format(parseISO(rx.dateIssued), 'dd MMM yyyy')}</p>
                      <span className="px-3 py-1 bg-indigo-50 text-[#5B21B6] text-[10px] font-bold rounded-md uppercase">{rx.status}</span>
                    </div>
                    <p className="text-xs text-slate-500">Items: {rx.items?.length || 0}</p>
                  </div>
                )) : <p className="text-sm text-slate-500 italic">No prescriptions found.</p>}
              </div>
            </div>
          )}

          {activeTab === 'Lab Reports' && (
            <div className="w-full">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Lab Reports</h3>
              <div className="flex flex-col gap-4">
                {recentLabOrders?.length > 0 ? recentLabOrders.map(order => (
                  <div key={order.id} className="p-4 rounded-xl border border-slate-200 bg-white flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{order.testCatalog?.testName || 'Lab Test'}</p>
                      <p className="text-xs font-semibold text-slate-500">Requested: {format(parseISO(order.requestedAt), 'dd MMM yyyy')}</p>
                    </div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md uppercase">{order.status}</span>
                  </div>
                )) : <p className="text-sm text-slate-500 italic">No lab reports found.</p>}
              </div>
            </div>
          )}

          {activeTab === 'Medical History' && (
            <div className="w-full">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Clinical Notes</h3>
              <div className="flex flex-col gap-4">
                {clinicalNotes?.length > 0 ? clinicalNotes.map(note => (
                  <div key={note.id} className="p-4 rounded-xl border border-slate-200 bg-white">
                    <p className="text-sm font-bold text-slate-800 mb-2">{format(parseISO(note.createdAt), 'dd MMM yyyy')}</p>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap">{note.noteText}</p>
                    {note.diagnosisCodes && (
                      <p className="text-xs font-bold text-slate-500 mt-2">Diagnosis: {note.diagnosisCodes}</p>
                    )}
                  </div>
                )) : <p className="text-sm text-slate-500 italic">No clinical notes found.</p>}
              </div>
            </div>
          )}

          {activeTab === 'Billing & Payments' && (
            <div className="w-full">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Invoices</h3>
              <div className="flex flex-col gap-4">
                {invoices?.length > 0 ? invoices.map(inv => (
                  <div key={inv.id} className="p-4 rounded-xl border border-slate-200 bg-white flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Invoice #{inv.id}</p>
                      <p className="text-xs font-semibold text-slate-500">Date: {format(parseISO(inv.createdAt), 'dd MMM yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">${inv.totalAmount}</p>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{inv.status}</span>
                    </div>
                  </div>
                )) : <p className="text-sm text-slate-500 italic">No invoices found.</p>}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Patient360View;
