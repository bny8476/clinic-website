import { Droplet, CalendarDays, ClipboardList, 
  CheckCircle2, Clock, XCircle, Pill, Heart
} from 'lucide-react';

export const PatientHeaderWidget = ({ patientName, today }) => (
  <div className="mb-6">
    <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--color-navy-900)] m-0">
      Welcome back, {patientName}
    </h1>
    <p className="text-sm text-[var(--color-text-muted)] m-0 mt-1">
      {today} &bull; Personal Health Portal & Appointments.
    </p>
  </div>
);

export const PatientKPIWidget = ({ appointmentsLoading, appointmentsList, profile }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <KPICard icon={CalendarDays} label="Upcoming Visits" value={appointmentsLoading ? '...' : appointmentsList?.length || 0} colorToken="navy" />
    <KPICard icon={Pill} label="Active Prescriptions" value="2 Active" colorToken="success" />
    <KPICard icon={Heart} label="Vitals Health Score" value="Normal" colorToken="info" />
    <KPICard icon={Droplet} label="Blood Group" value={profile?.bloodGroup || 'O+'} colorToken="danger" />
  </div>
);

export const PatientProfileWidget = ({ profileLoading, profile }) => (
  <Card>
    <Card.Header>
      <h2 className="font-display font-bold text-lg text-[var(--color-navy-900)] m-0 flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-[var(--color-navy-800)]" />
        Patient Profile
      </h2>
    </Card.Header>
    <Card.Body>
      {profileLoading ? (
        <Skeleton count={3} variant="line" className="h-6" />
      ) : profile ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--color-surface-alt)]/50 border border-[var(--color-border)]">
            <div className="p-2 rounded-sm bg-[var(--color-navy-800)]/10 text-[var(--color-navy-800)]">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] block">Emergency Contact</span>
              <span className="text-sm font-bold text-[var(--color-navy-900)]">
                {profile.emergencyContactName || 'N/A'} ({profile.emergencyContactPhone || 'N/A'})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--color-surface-alt)]/50 border border-[var(--color-border)]">
            <div className="p-2 rounded-sm bg-[var(--color-navy-800)]/10 text-[var(--color-navy-800)]">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] block">Blood Group</span>
              <span className="text-sm font-bold text-[var(--color-navy-900)]">{profile.bloodGroup || 'Not specified'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--color-surface-alt)]/50 border border-[var(--color-border)]">
            <div className="p-2 rounded-sm bg-[var(--color-navy-800)]/10 text-[var(--color-navy-800)]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] block">Address</span>
              <span className="text-sm font-bold text-[var(--color-navy-900)]">{profile.address || 'Not specified'}</span>
            </div>
          </div>
          <div className="pt-2">
            <Link to="/patient/profile-edit">
              <Button variant="secondary" fullWidth>Edit Profile</Button>
            </Link>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="Incomplete Profile"
          description="Please complete your patient profile details."
          action={<Link to="/patient/profile-edit"><Button variant="primary" size="sm">Complete Profile</Button></Link>}
        />
      )}
    </Card.Body>
  </Card>
);

const getStatusBadge = (status) => {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED':
    case 'BOOKED':
      return <Badge variant="success" icon={CheckCircle2}>{status}</Badge>;
    case 'PENDING':
      return <Badge variant="warning" icon={Clock}>{status}</Badge>;
    case 'CANCELLED':
      return <Badge variant="danger" icon={XCircle}>{status}</Badge>;
    default:
      return <Badge variant="neutral">{status || 'Scheduled'}</Badge>;
  }
};

export const PatientAppointmentsWidget = ({ appointmentsLoading, appointmentsList }) => (
  <Card>
    <Card.Header>
      <div className="flex items-center justify-between w-full">
        <h2 className="font-display font-bold text-lg text-[var(--color-navy-900)] m-0 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[var(--color-navy-800)]" />
          Upcoming Appointments
        </h2>
        <Link to="/doctors"><Button variant="ghost" size="sm">+ Book New</Button></Link>
      </div>
    </Card.Header>
    <Card.Body>
      {appointmentsLoading ? (
        <Skeleton count={3} variant="line" className="h-10 mb-2" />
      ) : appointmentsList?.length > 0 ? (
        <div className="divide-y divide-[var(--color-border)]">
          {appointmentsList.map((apt) => (
            <div key={apt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[var(--color-navy-600)] m-0">
                  {new Date(apt.startTime || Date.now()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                <p className="text-sm font-bold text-[var(--color-navy-900)] m-0 mt-0.5">
                  Dr. {apt.doctorFirstName} {apt.doctorLastName}
                </p>
              </div>
              <div>{getStatusBadge(apt.status)}</div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="No appointments scheduled"
          description="You don't have any upcoming clinic visits or doctor appointments."
          action={<Link to="/doctors"><Button variant="secondary" size="sm">Browse Doctors & Book</Button></Link>}
        />
      )}
    </Card.Body>
  </Card>
);
