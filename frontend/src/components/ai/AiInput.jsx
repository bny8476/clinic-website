import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

export const AiInput = ({ onSend, isSending, disabled }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!text || !text.trim() || isSending || disabled) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="p-3 border-t border-slate-200/80 bg-white/80 backdrop-blur-sm rounded-b-2xl">
      <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-sky-500/30 focus-within:border-sky-500 transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Aurelian AI assistant... (Enter to send, Shift+Enter for new line)"
          disabled={disabled || isSending}
          maxLength={2000}
          className="w-full bg-transparent resize-none outline-none text-xs sm:text-sm text-slate-800 placeholder-slate-400 py-1.5 pr-10 min-h-[38px] max-h-[120px]"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim() || isSending || disabled}
          className="absolute right-2 p-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-40 disabled:hover:bg-sky-600 transition-all shadow-sm shrink-0"
          title="Send message"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
      
      <div className="flex justify-between items-center px-1 mt-1 text-[10px] text-slate-400">
        <span>AI assistant does not substitute medical advice.</span>
        <span>{text.length}/2000</span>
      </div>
    </div>
  );
};
