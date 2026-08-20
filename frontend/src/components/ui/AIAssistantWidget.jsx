import { useState, useEffect, useRef } from 'react';
import { axiosPrivate } from '../../api/axios';
import { Bot, Loader, MessageSquare, Send, Sparkles, X } from 'lucide-react';

const AIAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your Aurelian Health AI Assistant. How can I help you today? You can ask about your symptoms, appointment booking, or clinic services.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const send = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await axiosPrivate.post('/v1/ai/chat', { message: input });
      setMessages(prev => [...prev, { sender: 'bot', text: res.data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I am having trouble connecting to the server.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-center hover:shadow-[0_8px_30px_rgb(37,99,235,0.4)] hover:scale-105 transition-all duration-300 z-50 border-none cursor-pointer group animate-in slide-in-from-bottom-4 zoom-in-90"
        >
          <MessageSquare size={22} className="group-hover:hidden" />
          <Sparkles size={22} className="hidden group-hover:block animate-pulse" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[360px] sm:w-[420px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden font-sans border border-slate-100 animate-in slide-in-from-bottom-10 fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 pt-5 pb-5 flex items-center justify-between text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-inner">
                  <Bot size={22} className="text-white" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-indigo-600 rounded-full"></div>
              </div>
              <div className="flex flex-col">
                <h3 className="m-0 text-[15px] font-bold tracking-wide">Aurelian Health AI</h3>
                <span className="text-[11px] text-blue-100 font-medium">Always here to help</span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsOpen(false)}
              className="relative z-10 bg-white/10 border-none text-white cursor-pointer w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 hover:rotate-90 transition-all duration-200"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 bg-slate-50 flex flex-col gap-4 relative">
            <div className="text-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-full">Today</span>
            </div>
            
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                {m.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 shrink-0 self-end mb-1">
                    <Bot size={14} className="text-blue-600" />
                  </div>
                )}
                <div 
                  className={`max-w-[80%] p-3.5 px-4 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                    m.sender === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 shrink-0 self-end mb-1">
                  <Bot size={14} className="text-blue-600" />
                </div>
                <div className="max-w-[80%] p-3.5 px-4 rounded-2xl bg-white border border-slate-100 rounded-bl-sm shadow-sm flex items-center gap-1.5 h-[46px]">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
            <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-full p-1.5 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all shadow-sm">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent border-none px-4 py-2 text-[14px] outline-none focus:outline-none focus:ring-0 focus:border-transparent text-slate-700 placeholder:text-slate-400"
                disabled={isTyping}
              />
              <button 
                onClick={send}
                disabled={!input.trim() || isTyping}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  input.trim() && !isTyping
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:scale-105' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
              </button>
            </div>
            <div className="text-center mt-3">
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                Powered by Aurelian AI
              </span>
            </div>
          </div>

        </div>
      )}
    </>
  );
};

export default AIAssistantWidget;
