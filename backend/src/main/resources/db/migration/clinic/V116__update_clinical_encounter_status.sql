-- Update existing 'Draft' and other string statuses to standard ENUM-compatible strings
UPDATE clinical_encounters SET status = 'DRAFT' WHERE status = 'Draft';
UPDATE clinical_encounters SET status = 'IN_PROGRESS' WHERE status = 'In Progress';
UPDATE clinical_encounters SET status = 'PENDING_ORDERS' WHERE status = 'Pending Orders';
UPDATE clinical_encounters SET status = 'FINALIZED' WHERE status = 'Finalized';
UPDATE clinical_encounters SET status = 'SIGNED' WHERE status = 'Signed';
UPDATE clinical_encounters SET status = 'AMENDED' WHERE status = 'Amended';
UPDATE clinical_encounters SET status = 'CANCELLED' WHERE status = 'Cancelled';
UPDATE clinical_encounters SET status = 'CLOSED' WHERE status = 'Closed';

-- Since JPA with @Enumerated(EnumType.STRING) uses VARCHAR, the column type 
-- remains VARCHAR(255). We just needed to normalize the existing data to 
-- match the Java enum names exactly.
