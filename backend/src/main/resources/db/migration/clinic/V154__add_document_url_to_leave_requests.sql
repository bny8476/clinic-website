-- V154: Add document_url to leave_requests for medical certificates and supporting leave attachments
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS document_url TEXT;
