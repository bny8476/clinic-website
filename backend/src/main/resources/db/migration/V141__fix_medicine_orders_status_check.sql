-- V141__fix_medicine_orders_status_check.sql
-- Remove legacy restrictive check constraint on medicine_orders.status column

ALTER TABLE medicine_orders DROP CONSTRAINT IF EXISTS medicine_orders_status_check;

-- Ensure all valid statuses can be saved in medicine_orders
ALTER TABLE medicine_orders ADD CONSTRAINT medicine_orders_status_check CHECK (
    status IN (
        'CREATED', 'PATIENT_REVIEWED', 'CART_ADDED', 
        'PENDING', 'PENDING_PAYMENT', 'PAID', 
        'PHARMACY_PROCESSING', 'READY_FOR_PICKUP', 
        'DISPATCHED', 'DELIVERED', 'COMPLETED', 
        'CANCELLED', 'REFUNDED', 'FULFILLED'
    )
);
