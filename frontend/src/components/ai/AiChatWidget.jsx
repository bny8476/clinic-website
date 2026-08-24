import React, { useState } from 'react';
import { Bot, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAiChat } from '../../hooks/useAiChat';
import { AiChatWindow } from './AiChatWindow';

export const AiChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  const {
    activeConversationId,
    setActiveConversationId,
    messages,
    conversations,
    loadingConversations,
    loadingMessages,
    isSending,
    rateLimitError,
    sendMessage,
    startNewChat,
    deleteConversation,
    clearMessages
  } = useAiChat();

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mb-4"
          >
            <AiChatWindow
              messages={messages}
              conversations={conversations}
              activeConversationId={activeConversationId}
              isSending={isSending}
              rateLimitError={rateLimitError}
              onSendMessage={sendMessage}
              onStartNewChat={startNewChat}
              onSelectConversation={setActiveConversationId}
              onDeleteConversation={deleteConversation}
              onClearMessages={clearMessages}
              onClose={() => setIsOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-center gap-2.5 px-4 h-14 rounded-full shadow-2xl transition-all duration-300 font-medium text-sm text-white ${
          isOpen
            ? 'bg-slate-900 hover:bg-slate-800'
            : 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500'
        }`}
        aria-label="Toggle Groq AI Assistant"
      >
        <div className="relative flex items-center justify-center">
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Bot className="w-6 h-6 text-white animate-pulse" />
          )}
          
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
            </span>
          )}
        </div>

        <span className="hidden sm:inline font-semibold tracking-tight">
          {isOpen ? 'Close Chat' : 'Ask AI Assistant'}
        </span>
      </motion.button>
    </div>
  );
};

export default AiChatWidget;
