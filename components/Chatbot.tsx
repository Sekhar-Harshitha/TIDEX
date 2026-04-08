import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles, Minimize2 } from 'lucide-react';
import { getChatResponse } from '../services/geminiService';
import { useApp } from '../context/AppContext';

export const Chatbot: React.FC = () => {
  const { t } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset welcome message when language changes or on mount
    setMessages([
      { role: 'model', text: t('welcomeChat') }
    ]);
  }, [t]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await getChatResponse(messages, userMsg);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I couldn't reach the server." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {isOpen && (
        <div className="bg-midnight-900 border border-midnight-700 w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in slide-in-from-bottom-5 mb-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-ocean-700 to-ocean-900 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-white">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">TideX Assistant</h3>
                <p className="text-[10px] text-ocean-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <Minimize2 size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-midnight-950/50">
            {messages.map((msg, idx) => (
              <div key={`${idx}-${msg.role}-${msg.text.substring(0, 10)}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-ocean-600 text-white rounded-tr-none' 
                    : 'bg-midnight-800 text-slate-200 border border-midnight-700 rounded-tl-none'
                }`}>
                  {msg.role === 'model' && (
                    <div className="flex items-center gap-1.5 mb-1 text-ocean-400 text-xs font-bold uppercase tracking-wider">
                      <Sparkles size={10} /> AI
                    </div>
                  )}
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-midnight-800 border border-midnight-700 rounded-2xl rounded-tl-none p-3 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-midnight-900 border-t border-midnight-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('askHelp')}
              className="flex-1 bg-midnight-950 border border-midnight-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-ocean-500 outline-none"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-ocean-600 hover:bg-ocean-500 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto bg-ocean-600 hover:bg-ocean-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(2,132,199,0.5)] transition-all hover:scale-110 active:scale-95 group"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} className="fill-current" />}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-midnight-950 animate-ping"></span>
        )}
      </button>
    </div>
  );
};