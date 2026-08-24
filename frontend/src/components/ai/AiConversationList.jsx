import React from 'react';
import { MessageSquare, Plus, Trash2, X } from 'lucide-react';

export const AiConversationList = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClose
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 text-white rounded-l-2xl p-4 w-64 border-r border-slate-800">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400">Chat History</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat Button */}
      <button
        onClick={() => {
          onNew();
          onClose();
        }}
        className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium text-xs shadow-md transition-all"
      >
        <Plus className="w-4 h-4" />
        <span>New Conversation</span>
      </button>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto mt-4 space-y-1.5 pr-1">
        {conversations.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-8">
            No previous conversations
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            return (
              <div
                key={conv.id}
                onClick={() => {
                  onSelect(conv.id);
                  onClose();
                }}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                  isActive
                    ? 'bg-sky-600/30 border border-sky-500/50 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate mr-2">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span className="truncate">{conv.title || 'Conversation'}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-all"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
