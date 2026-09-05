-- Indexes for Ambulance Proximity Search
CREATE INDEX IF NOT EXISTS idx_ambulance_location ON ambulances(current_latitude, current_longitude);
CREATE INDEX IF NOT EXISTS idx_ambulance_status ON ambulances(status, is_active);

-- Indexes for Assignment Lookups
CREATE INDEX IF NOT EXISTS idx_amb_assignment_amb_status ON ambulance_assignments(ambulance_id, status);
CREATE INDEX IF NOT EXISTS idx_amb_assignment_request ON ambulance_assignments(request_id);


