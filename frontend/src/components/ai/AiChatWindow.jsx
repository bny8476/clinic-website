import React, { useRef, useEffect, useState } from 'react';
import { Bot, History, Plus, RotateCcw, X, AlertTriangle } from 'lucide-react';
import { AiMessage } from './AiMessage';
import { AiInput } from './AiInput';
import { AiConversationList } from './AiConversationList';

export const AiChatWindow = ({
  messages,
  conversations,
  activeConversationId,
  isSending,
  rateLimitError,
  onSendMessage,
  onStartNewChat,
  onSelectConversation,
  onDeleteConversation,
  onClearMessages,
  onClose
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  return (
    <div className="relative flex h-[580px] w-[380px] sm:w-[420px] max-w-[95vw] bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-800 flex-col">
      {/* Slide-out History Overlay */}
      {showHistory && (
        <div className="absolute inset-0 z-30 flex">
          <AiConversationList
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={onSelectConversation}
            onNew={onStartNewChat}
            onDelete={onDeleteConversation}
            onClose={() => setShowHistory(false)}
          />
          <div
            className="flex-1 bg-black/40 backdrop-blur-xs cursor-pointer"
            onClick={() => setShowHistory(false)}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-teal-400 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Bot className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
              Aurelian AI Assistant
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Powered by Groq • Clinic Assistant</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Chat history"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={onStartNewChat}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="New conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => activeConversationId && onClearMessages(activeConversationId)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Clear current messages"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors ml-1"
            title="Close chatbot"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Rate Limit Banner */}
      {rateLimitError && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/15 border-b border-amber-500/30 text-amber-900 text-xs font-medium shrink-0 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{rateLimitError}</span>
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-gradient-to-b from-slate-50/50 to-white">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-3 shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">How can I help you today?</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[260px]">
              Ask me about clinic appointments, doctor schedules, medical departments, pharmacy, or general health guidance.
            </p>

            <div className="mt-4 flex flex-col gap-1.5 w-full max-w-[260px]">
              {[
                "How do I book an appointment?",
                "What medical departments are available?",
                "What are the clinic operating hours?"
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(suggestion)}
                  className="text-left text-xs p-2 rounded-xl bg-slate-100/80 hover:bg-sky-50 hover:text-sky-700 border border-slate-200/60 transition-all"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <AiMessage
              key={msg.id || index}
              role={msg.role}
              content={msg.content}
              createdAt={msg.createdAt}
              isError={msg.isError}
            />
          ))
        )}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-3 bg-slate-100/80 border border-slate-200/60 rounded-2xl w-fit">
            <Bot className="w-3.5 h-3.5 text-sky-600 animate-bounce" />
            <span className="font-medium text-slate-600">Aurelian AI is thinking...</span>
            <div className="flex gap-1 items-center ml-1">
              <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-ping" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <AiInput onSend={onSendMessage} isSending={isSending} />
    </div>
  );
};
