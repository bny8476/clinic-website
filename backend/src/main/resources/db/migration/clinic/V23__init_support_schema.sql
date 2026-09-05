-- V23: Customer Support Schema

CREATE TABLE IF NOT EXISTS support_tickets (
    id                BIGSERIAL PRIMARY KEY,
    ticket_number     VARCHAR(50) NOT NULL UNIQUE,
    user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject           VARCHAR(255) NOT NULL,
    category          VARCHAR(50) NOT NULL DEFAULT 'GENERAL', -- GENERAL, BILLING, TECHNICAL, APPOINTMENT, PHARMACY
    priority          VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    status            VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
    assigned_agent_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_messages (
    id                BIGSERIAL PRIMARY KEY,
    ticket_id         BIGINT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message           TEXT NOT NULL,
    is_agent_response BOOLEAN NOT NULL DEFAULT false,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);
