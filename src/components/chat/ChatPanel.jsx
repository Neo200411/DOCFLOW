import React, { useState, useRef, useEffect } from 'react';
import { Bot, User } from 'lucide-react';
import ChatInput from './ChatInput';

const SUGGESTIONS = [
  "What are the key requirements in the PRD?",
  "Summarize the system architecture",
  "What is the testing strategy?"
];

const MOCK_RESPONSES = {
  "What are the key requirements in the PRD?": "Based on the project documents, the main requirements include a scalable user authentication system, real-time data synchronization across clients, and a modular frontend architecture to support future feature expansion.",
  "Summarize the system architecture": "The system architecture follows a microservices pattern, utilizing Node.js for the backend API, React for the client, and a PostgreSQL database for persistent storage, all containerized with Docker.",
  "What is the testing strategy?": "The testing strategy involves comprehensive unit testing for all core utilities, integration testing for API endpoints, and end-to-end testing using Cypress for critical user flows prior to deployment."
};

const ChatPanel = () => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (text) => {
    const userMsg = { id: Date.now().toString(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate network delay
    setTimeout(() => {
      const responseText = MOCK_RESPONSES[text] || "This is a mock response for the Phase 2 prototype. The RAG assistant will be connected in a later phase.";
      const botMsg = { id: (Date.now() + 1).toString(), text: responseText, sender: 'bot' };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border/50 bg-surface">
        <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
          <Bot size={20} className="text-primary" />
          DocFlow AI Assistant
        </h2>
        <p className="text-sm text-gray-400 mt-1">Ask anything about your project documents.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <Bot size={48} className="text-primary/20 mb-4" />
            <h3 className="text-gray-200 font-medium mb-6">How can I help you today?</h3>
            <div className="flex flex-col gap-2 w-full">
              {SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(suggestion)}
                  className="text-sm text-left p-3 rounded-lg border border-border bg-surface hover:border-primary/50 hover:bg-surface-hover transition-colors text-gray-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-primary/20 text-primary-light' : 'bg-surface border border-border text-gray-400'}`}>
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-surface border border-border text-gray-200 rounded-tl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-surface border border-border text-gray-400 flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
};

export default ChatPanel;
