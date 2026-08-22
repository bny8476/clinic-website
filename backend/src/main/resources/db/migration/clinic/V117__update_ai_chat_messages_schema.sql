-- V117__update_ai_chat_messages_schema.sql
-- Renames columns in ai_chat_messages to match the AiChatMessage entity.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'ai_chat_messages' 
          AND column_name = 'sender'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'ai_chat_messages' 
          AND column_name = 'sender_type'
    ) THEN
        ALTER TABLE ai_chat_messages RENAME COLUMN sender TO sender_type;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'ai_chat_messages' 
          AND column_name = 'created_at'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'ai_chat_messages' 
          AND column_name = 'sent_at'
    ) THEN
        ALTER TABLE ai_chat_messages RENAME COLUMN created_at TO sent_at;
    END IF;
END $$;
