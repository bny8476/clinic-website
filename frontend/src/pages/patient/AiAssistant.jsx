import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import useAuthStore from '../../store/authStore';

const AiAssistant = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    // Get or Create Session
    const { data: session, isLoading: sessionLoading } = useQuery({
        queryKey: ['aiSession', user?.id],
        queryFn: async () => {
            const res = await axiosPrivate.post('/v1/patient/assistant/session');
            return res.data;
        }
    });

    // Get Messages for the active session
    const { data: messages, isLoading: messagesLoading } = useQuery({
        queryKey: ['aiMessages', session?.id],
        queryFn: async () => {
            if (!session?.id) return [];
            const res = await axiosPrivate.get(`/v1/patient/assistant/session/${session.id}/messages`);
            return res.data;
        },
        enabled: !!session?.id
    });

    const sendMutation = useMutation({
        mutationFn: async (content) => {
            const res = await axiosPrivate.post(`/v1/patient/assistant/session/${session.id}/message`, { content });
            return res.data; // AI response
        },
        onMutate: async (content) => {
            // Optimistic update
            await queryClient.cancelQueries(['aiMessages', session?.id]);
            const previousMessages = queryClient.getQueryData(['aiMessages', session?.id]) || [];
            
            const optimisticUserMessage = {
                id: Date.now(),
                sender: 'USER',
                content: content,
                createdAt: new Date().toISOString()
            };
            
            queryClient.setQueryData(['aiMessages', session?.id], [...previousMessages, optimisticUserMessage]);
            return { previousMessages };
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['aiMessages', session?.id]);
        },
        onError: (err, newTodo, context) => {
            queryClient.setQueryData(['aiMessages', session?.id], context.previousMessages);
        }
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, sendMutation.isPending]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputValue.trim() || !session?.id) return;
        
        sendMutation.mutate(inputValue);
        setInputValue('');
    };

    if (sessionLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-200">
                    <Bot size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">AI Health Assistant</h2>
                    <p className="text-slate-500 text-sm">Ask me about your symptoms or clinic services.</p>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                    {messages?.length === 0 && (
                        <div className="text-center text-slate-500 mt-10">
                            <Bot size={48} className="mx-auto mb-4 text-slate-300" />
                            <p>Hello! How can I help you today?</p>
                        </div>
                    )}
                    
                    {messages?.map((msg) => {
                        const isUser = msg.sender === 'USER';
                        return (
                            <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-slate-200 text-slate-600' : 'bg-indigo-600 text-white'}`}>
                                    {isUser ? <UserIcon size={16} /> : <Bot size={16} />}
                                </div>
                                <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${isUser ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                    <div className={`text-[10px] mt-1 text-right ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {sendMutation.isPending && (
                        <div className="flex gap-3 flex-row">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                <Bot size={16} />
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-200">
                    <form onSubmit={handleSend} className="relative flex items-center">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your message..."
                            disabled={sendMutation.isPending}
                            className="w-full pl-5 pr-14 py-4 bg-slate-100 rounded-full border-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-slate-800"
                        />
                        <button 
                            type="submit" 
                            disabled={!inputValue.trim() || sendMutation.isPending}
                            className="absolute right-2 p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center"
                        >
                            <Send size={18} className="ml-0.5" />
                        </button>
                    </form>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-slate-400">AI responses are for general information only and do not constitute medical advice.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiAssistant;
