
const PatientProfileCard = ({ patient }) => {
  if (!patient) return null;
  
  return (
    <div className="card">
      <div className="profile-card-header">
        <h3><UserIcon size={18} style={{marginRight: '8px'}}/> {patient.firstName} {patient.lastName}</h3>
      </div>
      <div className="profile-list">
        <div className="profile-list-item">
          <span className="profile-list-icon"><Phone aria-hidden="true" size={20} className="text-navy-600" /></span>
          <div className="profile-list-content">
            <label>Emergency Contact</label>
            <span>{patient.emergencyContactName || 'N/A'} ({patient.emergencyContactPhone || 'N/A'})</span>
          </div>
        </div>
        <div className="profile-list-item">
          <span className="profile-list-icon"><Droplet aria-hidden="true" size={20} className="text-navy-600" /></span>
          <div className="profile-list-content">
            <label>Blood Group</label>
            <span>{patient.bloodGroup || 'N/A'}</span>
          </div>
        </div>
        <div className="profile-list-item">
          <span className="profile-list-icon"><MapPin aria-hidden="true" size={20} className="text-navy-600" /></span>
          <div className="profile-list-content">
            <label>Address</label>
            <span>{patient.address || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfileCard;
