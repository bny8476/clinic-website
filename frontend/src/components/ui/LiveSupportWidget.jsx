import { useState } from 'react';
import { axiosPrivate } from '../../api/axios';

export default function LiveSupportWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'agent', text: 'Hello! I am a live support agent. How can I assist you today?', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
    ]);
    const [input, setInput] = useState('');

    const send = async () => {
        if (!input.trim()) return;
        const userMsg = { sender: 'user', text: input, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // In a real app, this would use WebSockets. Here we mock a generic REST submission.
        try {
            await axiosPrivate.post('/v1/patient/support/tickets', {
                subject: 'Live Chat Support',
                description: input,
                channel: 'LIVE_CHAT'
            });
            
            setTimeout(() => {
                setMessages(prev => [...prev, { 
                    sender: 'agent', 
                    text: 'Thank you. A support ticket has been created and an agent will respond shortly.', 
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                }]);
            }, 1000);
        } catch (err) {
            setMessages(prev => [...prev, { sender: 'agent', text: 'Error connecting to support.', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
        }
    };

    return (
        <>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors z-50 border-none cursor-pointer"
                >
                    <HelpCircle size={28} />
                </button>
            )}

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[350px] sm:w-[400px] h-[500px] bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col z-50 overflow-hidden font-sans">
                    <div className="bg-indigo-600 p-4 flex items-center justify-between text-white shrink-0">
                        <div className="flex items-center gap-2">
                            <MessageSquare size={20} />
                            <h3 className="m-0 text-sm font-bold tracking-wide">Live Support</h3>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="bg-transparent border-none text-white cursor-pointer p-1 hover:bg-white/10 rounded"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-3">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                                    m.sender === 'user' 
                                        ? 'bg-indigo-600 text-white rounded-tr-sm' 
                                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm'
                                }`}>
                                    {m.text}
                                    <div className={`text-[10px] mt-1 text-right ${m.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {m.time}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && send()}
                            placeholder="Type a message..."
                            className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-sm outline-none border-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button 
                            onClick={send}
                            className="bg-indigo-600 text-white border-none p-2.5 rounded-full cursor-pointer hover:bg-indigo-700 flex items-center justify-center shrink-0 transition"
                        >
                            <Send size={16} className="ml-0.5" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
