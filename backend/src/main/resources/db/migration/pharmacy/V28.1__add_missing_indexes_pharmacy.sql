-- Pharmacy / Inventory indexes
CREATE INDEX IF NOT EXISTS idx_pharmacy_batch_return_medicine ON pharmacy_batch_return_to_supplier(medicine_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_batch_return_supplier ON pharmacy_batch_return_to_supplier(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_credit_bills_bill_id ON pharmacy_credit_bills(bill_id);
