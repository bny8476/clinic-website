CREATE TABLE active_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id BIGINT,
    token_hash VARCHAR(255),
    ip_address VARCHAR(64),
    user_agent VARCHAR(512),
    device VARCHAR(255),
    location_estimate VARCHAR(255),
    login_time TIMESTAMP,
    last_activity TIMESTAMP,
    revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX idx_active_sessions_tenant_id ON active_sessions(tenant_id);

CREATE TABLE ai_audit_logs (id BIGSERIAL, processing_time_ms BIGINT, recorded_at TIMESTAMP not null, tenant_id BIGINT, user_id BIGINT not null, action_type VARCHAR(255), model_version VARCHAR(255), payload TEXT, user_role VARCHAR(255), PRIMARY KEY (id));

CREATE TABLE ai_prompt_templates (is_active BOOLEAN not null, id BIGSERIAL, tenant_id BIGINT, model_config_id VARCHAR(255), system_prompt TEXT, template_key VARCHAR(255) not null unique, PRIMARY KEY (id));

CREATE TABLE api_keys (rate_limit_limit INTEGER, revoked BOOLEAN not null, created_at TIMESTAMP not null, expires_at TIMESTAMP, id BIGSERIAL, tenant_id BIGINT, key_value VARCHAR(255) not null unique, name VARCHAR(255) not null, scopes VARCHAR(255), PRIMARY KEY (id));

CREATE TABLE appraisal_goals (appraisal_id BIGINT not null, created_at TIMESTAMP with time zone not null, id BIGSERIAL, updated_at TIMESTAMP with time zone not null, status VARCHAR(30) not null, title VARCHAR(200) not null, description TEXT, PRIMARY KEY (id));

CREATE TABLE approval_requests (approved_by BIGINT, created_at TIMESTAMP not null, id BIGSERIAL, requested_by BIGINT, action_type VARCHAR(255), payload_details TEXT, status VARCHAR(255), PRIMARY KEY (id));

CREATE TABLE backup_histories (completed_at TIMESTAMP, id BIGSERIAL, size_bytes BIGINT, started_at TIMESTAMP, tenant_id BIGINT, backup_type VARCHAR(255), status VARCHAR(255), storage_location VARCHAR(255), PRIMARY KEY (id));

CREATE TABLE cashier_sessions (card_collections NUMERIC(12,2), cash_collections NUMERIC(12,2), closing_float NUMERIC(12,2), digital_collections NUMERIC(12,2), opening_float NUMERIC(12,2) not null, refunds_issued NUMERIC(12,2), variance_amount NUMERIC(12,2), approved_by BIGINT, branch_id BIGINT not null, cashier_id BIGINT not null, closed_at TIMESTAMP with time zone, id BIGSERIAL, opened_at TIMESTAMP with time zone not null, status VARCHAR(20) not null CHECK (status IN ('APPROVED','CLOSED','DISCREPANCY','OPEN')), PRIMARY KEY (id));

CREATE TABLE chart_of_accounts (is_active BOOLEAN not null, branch_id BIGINT, created_at TIMESTAMP with time zone not null, id BIGSERIAL, parent_account_id BIGINT, updated_at TIMESTAMP with time zone not null, account_code VARCHAR(20) not null unique, account_name VARCHAR(100) not null, account_type VARCHAR(20) not null CHECK (account_type IN ('ASSET','EQUITY','EXPENSE','LIABILITY','REVENUE')), PRIMARY KEY (id));

CREATE TABLE credit_debit_notes (amount NUMERIC(12,2) not null, created_at TIMESTAMP with time zone not null, id BIGSERIAL, invoice_id BIGINT not null, issued_by BIGINT, note_number VARCHAR(50) not null unique, reason VARCHAR(255) not null, note_type VARCHAR(10) not null CHECK (note_type IN ('CREDIT','DEBIT')), PRIMARY KEY (id));

CREATE TABLE daily_closings (closing_date date not null, net_deposit NUMERIC(12,2) not null, total_collections NUMERIC(12,2) not null, total_refunds NUMERIC(12,2) not null, total_revenue NUMERIC(12,2) not null, approved_by BIGINT, branch_id BIGINT not null, closed_by BIGINT, created_at TIMESTAMP with time zone not null, id BIGSERIAL, status VARCHAR(20) not null CHECK (status IN ('APPROVED','DRAFT','REJECTED','SUBMITTED')), PRIMARY KEY (id));

CREATE TABLE departments (is_active BOOLEAN, head_doctor_id BIGINT, id BIGSERIAL, description TEXT, name VARCHAR(255) not null unique, PRIMARY KEY (id));

CREATE TABLE employee_appraisals (overall_rating INTEGER, created_at TIMESTAMP with time zone not null, employee_id BIGINT not null, id BIGSERIAL, reviewer_id BIGINT not null, updated_at TIMESTAMP with time zone not null, status VARCHAR(30) not null, cycle VARCHAR(50) not null, comments TEXT, PRIMARY KEY (id));

CREATE TABLE employee_credentials (expiry_date date, is_verified BOOLEAN not null, issue_date date not null, created_at TIMESTAMP with time zone not null, employee_id BIGINT not null, id BIGSERIAL, updated_at TIMESTAMP with time zone not null, status VARCHAR(30) not null, credential_type VARCHAR(50) not null, credential_number VARCHAR(100) not null, issuing_authority VARCHAR(100) not null, PRIMARY KEY (id));

CREATE TABLE employee_documents (is_verified BOOLEAN not null, created_at TIMESTAMP with time zone not null, employee_id BIGINT not null, id BIGSERIAL, updated_at TIMESTAMP with time zone not null, verified_by BIGINT, document_type VARCHAR(50) not null, title VARCHAR(200) not null, file_url VARCHAR(500) not null, PRIMARY KEY (id));

CREATE TABLE employee_rosters (roster_date date not null, branch_id BIGINT not null, created_at TIMESTAMP with time zone not null, employee_id BIGINT not null, id BIGSERIAL, shift_template_id BIGINT not null, updated_at TIMESTAMP with time zone not null, status VARCHAR(30) not null, PRIMARY KEY (id));

CREATE TABLE home_visit_assignments (assigned_at TIMESTAMP not null, id BIGSERIAL, request_id BIGINT unique, staff_user_id BIGINT not null, tenant_id BIGINT, status VARCHAR(255), PRIMARY KEY (id));

CREATE TABLE job_applications (created_at TIMESTAMP with time zone not null, id BIGSERIAL, job_requisition_id BIGINT not null, updated_at TIMESTAMP with time zone not null, applicant_phone VARCHAR(20), status VARCHAR(30) not null, applicant_email VARCHAR(100) not null, applicant_name VARCHAR(100) not null, resume_url VARCHAR(500), interview_notes json, PRIMARY KEY (id));

CREATE TABLE job_requisitions (max_salary NUMERIC(12,2), min_salary NUMERIC(12,2), required_experience_years INTEGER, vacancy_count INTEGER not null, branch_id BIGINT not null, created_at TIMESTAMP with time zone not null, id BIGSERIAL, updated_at TIMESTAMP with time zone not null, status VARCHAR(20) not null, department VARCHAR(100) not null, title VARCHAR(100) not null, required_qualifications TEXT, interview_panel json, PRIMARY KEY (id));

CREATE TABLE journal_entries (entry_date date not null, approved_by BIGINT, created_at TIMESTAMP with time zone not null, id BIGSERIAL, prepared_by BIGINT, reference_id BIGINT, journal_number VARCHAR(50) not null unique, reference_type VARCHAR(50), description VARCHAR(255) not null, status VARCHAR(20) not null CHECK (status IN ('DRAFT','POSTED','REVERSED')), PRIMARY KEY (id));

CREATE TABLE lab_inventory_items (minimum_threshold INTEGER not null, quantity INTEGER not null, branch_id BIGINT not null, created_at TIMESTAMP with time zone not null, id BIGSERIAL, updated_at TIMESTAMP with time zone not null, sku VARCHAR(50) not null unique, unit VARCHAR(50), item_name VARCHAR(100) not null, PRIMARY KEY (id));

CREATE TABLE lab_quality_controls (branch_id BIGINT not null, id BIGSERIAL, performed_at TIMESTAMP with time zone not null, performed_by BIGINT not null, test_catalog_id BIGINT not null, status VARCHAR(50) not null, notes TEXT, PRIMARY KEY (id));

CREATE TABLE leave_balances (accrued NUMERIC(6,2) not null, balance NUMERIC(6,2) not null, leave_year INTEGER not null, taken NUMERIC(6,2) not null, created_at TIMESTAMP with time zone not null, employee_id BIGINT not null, id BIGSERIAL, leave_policy_id BIGINT not null, updated_at TIMESTAMP with time zone not null, PRIMARY KEY (id));

CREATE TABLE leave_policies (annual_allocation NUMERIC(38,2) not null, carry_forward_limit NUMERIC(38,2), is_encashable BOOLEAN not null, created_at TIMESTAMP with time zone not null, id BIGSERIAL, updated_at TIMESTAMP with time zone not null, leave_type VARCHAR(50) not null, PRIMARY KEY (id));

CREATE TABLE marketing_campaigns (created_at TIMESTAMP with time zone, end_date TIMESTAMP with time zone, id BIGSERIAL, start_date TIMESTAMP with time zone, updated_at TIMESTAMP with time zone, channel VARCHAR(20) not null, status VARCHAR(20) not null, name VARCHAR(100) not null, target_audience VARCHAR(100), description TEXT, PRIMARY KEY (id));

CREATE TABLE offboarding_requests (last_working_day date not null, created_at TIMESTAMP with time zone not null, employee_id BIGINT not null unique, id BIGSERIAL, updated_at TIMESTAMP with time zone not null, status VARCHAR(30) not null, reason VARCHAR(50) not null, clearance_checklist json, PRIMARY KEY (id));

CREATE TABLE onboarding_checklists (created_at TIMESTAMP with time zone not null, employee_id BIGINT not null unique, id BIGSERIAL, updated_at TIMESTAMP with time zone not null, status VARCHAR(30) not null, tasks json, PRIMARY KEY (id));

CREATE TABLE patient_addresses (is_default BOOLEAN not null, latitude NUMERIC(10,6), longitude NUMERIC(10,6), id BIGSERIAL, patient_id BIGINT not null, tenant_id BIGINT, address_line1 VARCHAR(255), address_line2 VARCHAR(255), city VARCHAR(255), landmark VARCHAR(255), state VARCHAR(255), zip_code VARCHAR(255), PRIMARY KEY (id));

CREATE TABLE patient_advances (amount NUMERIC(12,2) not null, amount_used NUMERIC(12,2) not null, branch_id BIGINT not null, created_at TIMESTAMP with time zone not null, id BIGSERIAL, patient_profile_id BIGINT not null, payment_id BIGINT, status VARCHAR(20) not null, notes TEXT, PRIMARY KEY (id));

CREATE TABLE payment_allocations (amount NUMERIC(12,2) not null, allocated_at TIMESTAMP with time zone not null, id BIGSERIAL, invoice_id BIGINT not null, payment_id BIGINT not null, PRIMARY KEY (id));


CREATE TABLE radiology_annotations (author_id BIGINT not null, created_at TIMESTAMP with time zone not null, id BIGSERIAL, study_id BIGINT not null, updated_at TIMESTAMP with time zone not null, status VARCHAR(20) not null, annotation_type VARCHAR(50) not null, series_instance_uid VARCHAR(255), sop_instance_uid VARCHAR(255), annotation_data json not null, PRIMARY KEY (id));

CREATE TABLE radiology_appointments (duration_minutes INTEGER not null, branch_id BIGINT not null, created_at TIMESTAMP with time zone not null, id BIGSERIAL, patient_id BIGINT not null, request_id BIGINT not null, scheduled_time TIMESTAMP with time zone not null, technician_id BIGINT, updated_at TIMESTAMP with time zone not null, modality VARCHAR(30) not null, status VARCHAR(30) not null, room_or_machine VARCHAR(100), cancellation_reason VARCHAR(255), PRIMARY KEY (id));

CREATE TABLE radiology_inventory_items (minimum_threshold INTEGER not null, quantity INTEGER not null, branch_id BIGINT not null, created_at TIMESTAMP with time zone not null, expiry_date TIMESTAMP with time zone, id BIGSERIAL, updated_at TIMESTAMP with time zone not null, unit VARCHAR(20) not null, batch_number VARCHAR(50), sku VARCHAR(50) not null unique, item_name VARCHAR(100) not null, PRIMARY KEY (id));

CREATE TABLE refunds (amount NUMERIC(12,2) not null, approved_by BIGINT, created_at TIMESTAMP with time zone not null, id BIGSERIAL, invoice_id BIGINT, payment_id BIGINT not null, requested_by BIGINT, updated_at TIMESTAMP with time zone not null, idempotency_key VARCHAR(100), refund_reference VARCHAR(100) unique, refund_reason VARCHAR(255) not null, status VARCHAR(25) not null CHECK (status IN ('APPROVED','FAILED','INITIATED','PENDING_APPROVAL','PROCESSED','REJECTED')), PRIMARY KEY (id));

CREATE TABLE retention_policies (legal_hold BOOLEAN not null, retention_days INTEGER not null, id BIGSERIAL, tenant_id BIGINT, data_category VARCHAR(255) not null, PRIMARY KEY (id));

CREATE TABLE shift_templates (break_duration_minutes INTEGER not null, end_time time(0) not null, grace_period_minutes INTEGER not null, is_overnight BOOLEAN not null, start_time time(0) not null, branch_id BIGINT not null, created_at TIMESTAMP with time zone not null, id BIGSERIAL, updated_at TIMESTAMP with time zone not null, name VARCHAR(100) not null, PRIMARY KEY (id));

CREATE TABLE staff_documents (created_at TIMESTAMP with time zone, id BIGSERIAL, staff_id BIGINT not null, updated_at TIMESTAMP with time zone, uploaded_by BIGINT, document_type VARCHAR(100) not null, file_path VARCHAR(255) not null, filename VARCHAR(255) not null, PRIMARY KEY (id));

CREATE TABLE staff_payroll (allowances NUMERIC(10,2), basic_salary NUMERIC(10,2) not null, deductions NUMERIC(10,2), net_salary NUMERIC(10,2) not null, month_year VARCHAR(7) not null, created_at TIMESTAMP with time zone, id BIGSERIAL, staff_id BIGINT not null, updated_at TIMESTAMP with time zone, status VARCHAR(20) not null, PRIMARY KEY (id));

CREATE TABLE superadmin_integration_configs (active BOOLEAN not null, id BIGSERIAL, tenant_id BIGINT, encrypted_credentials TEXT, integration_type VARCHAR(255) not null, provider_name VARCHAR(255) not null, PRIMARY KEY (id));

CREATE TABLE surgery_inventory_usage (quantity_used INTEGER not null, id BIGSERIAL, recorded_at TIMESTAMP with time zone not null, recorded_by_user_id BIGINT not null, surgery_booking_id BIGINT not null, item_code VARCHAR(50) not null, item_name VARCHAR(100) not null, PRIMARY KEY (id));

CREATE TABLE tax_configurations (effective_from date not null, effective_to date, is_active BOOLEAN not null, tax_rate NUMERIC(5,2) not null, created_at TIMESTAMP with time zone not null, id BIGSERIAL, updated_at TIMESTAMP with time zone not null, tax_code VARCHAR(50) not null unique, tax_name VARCHAR(100) not null, PRIMARY KEY (id));

CREATE TABLE teleconsult_consents (consent_for_recording BOOLEAN not null, consent_for_treatment BOOLEAN not null, appointment_id BIGINT not null, id BIGSERIAL, patient_id BIGINT not null, signed_at TIMESTAMP not null, tenant_id BIGINT, ip_address VARCHAR(255), PRIMARY KEY (id));

CREATE TABLE teleconsult_sessions (appointment_id BIGINT not null, created_at TIMESTAMP not null, ended_at TIMESTAMP, id BIGSERIAL, started_at TIMESTAMP, tenant_id BIGINT, updated_at TIMESTAMP not null, doctor_token TEXT, patient_token TEXT, provider_type VARCHAR(255), recording_url VARCHAR(255), room_id VARCHAR(255), status VARCHAR(255), PRIMARY KEY (id));

ALTER TABLE if exists appraisal_goals ADD CONSTRAINT FKjnuqpgiw6or957yvxot2xtb4b FOREIGN KEY (appraisal_id) REFERENCES employee_appraisals;

ALTER TABLE if exists cashier_sessions ADD CONSTRAINT FK3t8t3lot4xm00s3ngxl9hr2oc FOREIGN KEY (branch_id) REFERENCES branches;

ALTER TABLE if exists chart_of_accounts ADD CONSTRAINT FK3laiketw3bu7y23ipj9datdi6 FOREIGN KEY (parent_account_id) REFERENCES chart_of_accounts;

ALTER TABLE if exists credit_debit_notes ADD CONSTRAINT FK6jpf74d38auu2ttlq5ipblv2p FOREIGN KEY (invoice_id) REFERENCES invoices;

ALTER TABLE if exists daily_closings ADD CONSTRAINT FK2nqugs1v6jp6wmw92bity74u2 FOREIGN KEY (branch_id) REFERENCES branches;

ALTER TABLE if exists employee_appraisals ADD CONSTRAINT FK8dnyotbiei23s06c81objfy8t FOREIGN KEY (employee_id) REFERENCES employees;

ALTER TABLE if exists employee_appraisals ADD CONSTRAINT FKdgxy0qprkbfg4xfl21naao7t9 FOREIGN KEY (reviewer_id) REFERENCES employees;

ALTER TABLE if exists employee_credentials ADD CONSTRAINT FK14ftg5aqc0rm9qeh75jyeqjwb FOREIGN KEY (employee_id) REFERENCES employees;

ALTER TABLE if exists employee_documents ADD CONSTRAINT FK28g0aba9xtbkf6bp9pnvtcw5e FOREIGN KEY (employee_id) REFERENCES employees;

ALTER TABLE if exists employee_rosters ADD CONSTRAINT FKf70n5hd4ticp6tbhq6dfxqpnr FOREIGN KEY (branch_id) REFERENCES branches;

ALTER TABLE if exists employee_rosters ADD CONSTRAINT FKaxxkr28b1k1mp8ywl2ksutmgg FOREIGN KEY (employee_id) REFERENCES employees;

ALTER TABLE if exists employee_rosters ADD CONSTRAINT FKpulrqu1plo8msu8pmmqj8dxgh FOREIGN KEY (shift_template_id) REFERENCES shift_templates;

ALTER TABLE if exists home_visit_assignments ADD CONSTRAINT FKshy5iny3u6rvv5v169kffhlo8 FOREIGN KEY (request_id) REFERENCES home_visit_requests;

ALTER TABLE if exists job_applications ADD CONSTRAINT FK1kdoftc7kkpwjd37qovknias7 FOREIGN KEY (job_requisition_id) REFERENCES job_requisitions;

ALTER TABLE if exists job_requisitions ADD CONSTRAINT FKne2p7gwwq0r2icoq0cvggjmj2 FOREIGN KEY (branch_id) REFERENCES branches;

ALTER TABLE if exists lab_inventory_items ADD CONSTRAINT FKai0b95l39wvi8f9orqkgfkut7 FOREIGN KEY (branch_id) REFERENCES branches;

ALTER TABLE if exists lab_quality_controls ADD CONSTRAINT FKcvh1o79cygr1fl9h7cntxolp1 FOREIGN KEY (branch_id) REFERENCES branches;

ALTER TABLE if exists lab_quality_controls ADD CONSTRAINT FKnfuh2m6sawemt0ocfjrqe4ud3 FOREIGN KEY (performed_by) REFERENCES users;

ALTER TABLE if exists lab_quality_controls ADD CONSTRAINT FK3jaur8gw0juv9e83e7p42m4fc FOREIGN KEY (test_catalog_id) REFERENCES lab_test_catalog;

ALTER TABLE if exists leave_balances ADD CONSTRAINT FKmvepkwsegu6bt3ps5rfh1dx92 FOREIGN KEY (employee_id) REFERENCES employees;

ALTER TABLE if exists leave_balances ADD CONSTRAINT FK4y1yfhnmd4tlytk9sxjybdfxn FOREIGN KEY (leave_policy_id) REFERENCES leave_policies;

ALTER TABLE if exists offboarding_requests ADD CONSTRAINT FKohjgx569e7riuypqdfycqq159 FOREIGN KEY (employee_id) REFERENCES employees;

ALTER TABLE if exists onboarding_checklists ADD CONSTRAINT FKgf652sndfl5s0mseepq86k07n FOREIGN KEY (employee_id) REFERENCES employees;

ALTER TABLE if exists patient_advances ADD CONSTRAINT FKaenw9eogr243q75qrp7rx4v23 FOREIGN KEY (branch_id) REFERENCES branches;

ALTER TABLE if exists patient_advances ADD CONSTRAINT FKbri1olja3yujj7ya4q9wlyeco FOREIGN KEY (patient_profile_id) REFERENCES patient_profiles;

ALTER TABLE if exists patient_advances ADD CONSTRAINT FKraha34qq02ca1wnhn8ar02e3w FOREIGN KEY (payment_id) REFERENCES payments;

ALTER TABLE if exists payment_allocations ADD CONSTRAINT FK12k58td8oudl7ihiuvyuprf FOREIGN KEY (invoice_id) REFERENCES invoices;

ALTER TABLE if exists payment_allocations ADD CONSTRAINT FKf6kmlajje9ey0ae5kr2u71xdu FOREIGN KEY (payment_id) REFERENCES payments;

ALTER TABLE if exists radiology_annotations ADD CONSTRAINT FKq8q8cnlso2snh0eym0rbnq7wq FOREIGN KEY (author_id) REFERENCES users;

ALTER TABLE if exists radiology_annotations ADD CONSTRAINT FK9cn4ivhg7lhhl2okni19r0p5b FOREIGN KEY (study_id) REFERENCES dicom_studies;

ALTER TABLE if exists radiology_appointments ADD CONSTRAINT FKlxobuag5784coapwet1t25y1x FOREIGN KEY (branch_id) REFERENCES branches;

ALTER TABLE if exists radiology_appointments ADD CONSTRAINT FKikjgqqsui22jdp08j87lhmu FOREIGN KEY (patient_id) REFERENCES patient_profiles;

ALTER TABLE if exists radiology_appointments ADD CONSTRAINT FKmbcbfknnqb7h4149e6iog5thf FOREIGN KEY (request_id) REFERENCES imaging_requests;

ALTER TABLE if exists radiology_appointments ADD CONSTRAINT FKgeejbble7xj29fba4eifyulf4 FOREIGN KEY (technician_id) REFERENCES users;

ALTER TABLE if exists radiology_inventory_items ADD CONSTRAINT FKjywxpwb26pjww5bx643oa4mxr FOREIGN KEY (branch_id) REFERENCES branches;

ALTER TABLE if exists refunds ADD CONSTRAINT FK9nc6v2i53phr47jujlu7dchdi FOREIGN KEY (invoice_id) REFERENCES invoices;

ALTER TABLE if exists refunds ADD CONSTRAINT FKpt9ic0j1y6xwlej99wnynvnpy FOREIGN KEY (payment_id) REFERENCES payments;

ALTER TABLE if exists shift_templates ADD CONSTRAINT FKpi83ii37up58mygkqliihd726 FOREIGN KEY (branch_id) REFERENCES branches;

ALTER TABLE if exists staff_documents ADD CONSTRAINT FK615e5b6lnw3gwkbnac0r5euo4 FOREIGN KEY (staff_id) REFERENCES users;

ALTER TABLE if exists staff_payroll ADD CONSTRAINT FKjf55eqwpbuieffmwwkhae752c FOREIGN KEY (staff_id) REFERENCES users;

ALTER TABLE if exists surgery_inventory_usage ADD CONSTRAINT FKcb9m78kf2ua78famleflkyspv FOREIGN KEY (recorded_by_user_id) REFERENCES users;

ALTER TABLE if exists surgery_inventory_usage ADD CONSTRAINT FKrbb77v6hu5wmnnr16kkuw0q03 FOREIGN KEY (surgery_booking_id) REFERENCES surgery_bookings;