import React from 'react';
import { Bot, User, AlertCircle } from 'lucide-react';

const formatMessageText = (text) => {
  if (!text) return '';
  
  // Format bullet points and bolding safely
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Process bold text **text**
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const formattedLine = parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      return (
        <li key={i} className="ml-4 list-disc my-1">
          {formattedLine}
        </li>
      );
    }

    return (
      <p key={i} className={i > 0 ? 'mt-2' : ''}>
        {formattedLine}
      </p>
    );
  });
};

export const AiMessage = ({ role, content, createdAt, isError }) => {
  const isUser = role === 'user';
  const formattedTime = createdAt
    ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex gap-3 my-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Icon Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-medium text-xs shadow-sm ${
        isUser
          ? 'bg-gradient-to-br from-sky-500 to-blue-600'
          : isError
            ? 'bg-amber-500'
            : 'bg-gradient-to-br from-indigo-600 to-teal-500'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : isError ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Bubble */}
      <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-sky-600 text-white rounded-tr-none shadow-sm'
          : isError
            ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-none'
            : 'bg-slate-100/90 text-slate-800 border border-slate-200/70 rounded-tl-none'
      }`}>
        <div className="whitespace-pre-wrap">{formatMessageText(content)}</div>

        {formattedTime && (
          <div className={`text-[10px] mt-1.5 text-right font-mono opacity-60 ${isUser ? 'text-sky-100' : 'text-slate-500'}`}>
            {formattedTime}
          </div>
        )}
      </div>
    </div>
  );
};
