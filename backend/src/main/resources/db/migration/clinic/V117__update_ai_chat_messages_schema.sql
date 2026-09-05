-- V117__update_ai_chat_messages_schema.sql
-- Renames columns in ai_chat_messages to match the AiChatMessage entity.

ALTER TABLE ai_chat_messages RENAME COLUMN sender TO sender_type;
ALTER TABLE ai_chat_messages RENAME COLUMN created_at TO sent_at;


