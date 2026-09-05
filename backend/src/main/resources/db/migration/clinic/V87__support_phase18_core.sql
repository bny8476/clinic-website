-- V87: Complete Support CRM and Knowledge Base Schema

-- 1. Agent Profiles and Workload
CREATE TABLE IF NOT EXISTS sp_agent_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id BIGINT REFERENCES branches(id),
    max_concurrent_tickets INT DEFAULT 5,
    current_active_tickets INT DEFAULT 0,
    primary_skills VARCHAR(255),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sp_agent_user ON sp_agent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sp_agent_branch ON sp_agent_profiles(branch_id);

-- 2. SLA Policies
CREATE TABLE IF NOT EXISTS sp_sla_policies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    priority VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, URGENT, CRITICAL
    category VARCHAR(50),
    first_response_minutes INT NOT NULL,
    resolution_minutes INT NOT NULL,
    business_hours_only BOOLEAN DEFAULT true,
    branch_id BIGINT REFERENCES branches(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Knowledge Base
CREATE TABLE IF NOT EXISTS sp_kb_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id BIGINT REFERENCES sp_kb_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sp_kb_articles (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES sp_kb_categories(id),
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    audience VARCHAR(50) DEFAULT 'PUBLIC', -- PUBLIC, PATIENTS_ONLY, STAFF_ONLY, CLINICAL_ONLY
    status VARCHAR(30) DEFAULT 'DRAFT', -- DRAFT, REVIEW, PUBLISHED, ARCHIVED
    author_id BIGINT REFERENCES users(id),
    view_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    version INT DEFAULT 1,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Unified Support Tickets
CREATE TABLE IF NOT EXISTS sp_tickets (
    id BIGSERIAL PRIMARY KEY,
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    idempotency_key VARCHAR(100) UNIQUE,
    requester_id BIGINT REFERENCES users(id),
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    channel VARCHAR(30) DEFAULT 'PORTAL', -- PORTAL, EMAIL, WHATSAPP, LIVE_CHAT, MANUAL
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    subcategory VARCHAR(50),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- NEW, OPEN, IN_PROGRESS, PENDING_CUSTOMER, PENDING_INTERNAL, ESCALATED, RESOLVED, CLOSED
    
    branch_id BIGINT REFERENCES branches(id),
    assigned_agent_id BIGINT REFERENCES users(id),
    assigned_team VARCHAR(50),
    
    sla_policy_id BIGINT REFERENCES sp_sla_policies(id),
    first_response_due_at TIMESTAMP WITH TIME ZONE,
    resolution_due_at TIMESTAMP WITH TIME ZONE,
    sla_status VARCHAR(30) DEFAULT 'ON_TRACK', -- ON_TRACK, AT_RISK, BREACHED, PAUSED
    
    -- References (without strict foreign keys to allow loose coupling)
    reference_appointment_id BIGINT,
    reference_order_id BIGINT,
    reference_invoice_id BIGINT,
    
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sp_ticket_requester ON sp_tickets(requester_id);
CREATE INDEX IF NOT EXISTS idx_sp_ticket_status ON sp_tickets(status);
CREATE INDEX IF NOT EXISTS idx_sp_ticket_agent ON sp_tickets(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_sp_ticket_branch ON sp_tickets(branch_id);

-- 5. Ticket Assignment Audit
CREATE TABLE IF NOT EXISTS sp_ticket_assignments (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES sp_tickets(id) ON DELETE CASCADE,
    previous_agent_id BIGINT REFERENCES users(id),
    new_agent_id BIGINT REFERENCES users(id),
    assigned_by_id BIGINT REFERENCES users(id),
    reason VARCHAR(255),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Ticket Messages (Unified Chat & Notes)
CREATE TABLE IF NOT EXISTS sp_messages (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES sp_tickets(id) ON DELETE CASCADE,
    sender_id BIGINT REFERENCES users(id),
    sender_name VARCHAR(100), -- For guests/external
    content TEXT NOT NULL,
    is_internal_note BOOLEAN DEFAULT false,
    channel VARCHAR(30) DEFAULT 'PORTAL',
    message_id_external VARCHAR(100), -- For tracking WhatsApp/Email IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sp_messages_ticket ON sp_messages(ticket_id);

-- 7. Attachments
CREATE TABLE IF NOT EXISTS sp_attachments (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES sp_tickets(id) ON DELETE CASCADE,
    message_id BIGINT REFERENCES sp_messages(id) ON DELETE CASCADE,
    uploaded_by_id BIGINT REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    s3_key VARCHAR(500) NOT NULL,
    is_internal_only BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Escalations & Complaints
CREATE TABLE IF NOT EXISTS sp_escalations (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES sp_tickets(id) ON DELETE CASCADE,
    escalated_by_id BIGINT REFERENCES users(id),
    target_team VARCHAR(50) NOT NULL, -- CLINICAL, FINANCE, PHARMACY, ADMIN
    target_user_id BIGINT REFERENCES users(id),
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING', -- PENDING, ACKNOWLEDGED, RESOLVED, REJECTED
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS sp_complaints (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES sp_tickets(id) ON DELETE CASCADE,
    patient_id BIGINT,
    severity VARCHAR(20) DEFAULT 'STANDARD', -- STANDARD, HIGH, CRITICAL, LEGAL
    investigator_id BIGINT REFERENCES users(id),
    investigation_notes TEXT, -- Highly restricted visibility
    status VARCHAR(30) DEFAULT 'INVESTIGATING', -- RECEIVED, INVESTIGATING, PROPOSED, CLOSED
    resolution_offered TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. CSAT Surveys
CREATE TABLE IF NOT EXISTS sp_csat_surveys (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES sp_tickets(id) ON DELETE CASCADE,
    patient_id BIGINT REFERENCES users(id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    is_responded BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE
);
