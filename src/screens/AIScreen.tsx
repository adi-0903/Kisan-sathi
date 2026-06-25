import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Send, Mic, Sparkles, Volume2, SquareSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchChatResponse } from '../lib/api';
import { useSubscription } from '../lib/subscription';
import { PremiumModal } from '../components/PremiumModal';
import { useAuth } from '../lib/AuthContext';

export function AIScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isExpired } = useSubscription();
  const { user } = useAuth();
  
  const isConsumer = user?.role === 'consumer';
  const initialGreeting = isConsumer 
    ? t('greeting') + "! I am Kisan GPT. How can I help you discover fresh organic farm produce, understand nutritional values, or support local Indian farmers today?"
    : t('greeting') + "! I am Kisan GPT. How can I help you with your farm today?";

  const [showPremiumOptions, setShowPremiumOptions] = useState(isExpired);
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
    { role: 'model', text: initialGreeting }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Clean up TTS when unmounting
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (i18n.language === 'hi') utterance.lang = 'hi-IN';
      else if (i18n.language === 'pa') utterance.lang = 'hi-IN'; // Fallback to Hindi for Punjabi if not supported
      else utterance.lang = 'en-IN';
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSend = async (text: string = input, wasVoice: boolean = false) => {
    if (isExpired) {
      setShowPremiumOptions(true);
      return;
    }
    if (!text.trim()) return;
    const newMsg = { role: 'user' as const, text };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await fetchChatResponse(text, i18n.language, user?.role);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      if (wasVoice) {
        speakText(responseText); // Speech-to-speech: auto reply with voice
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I am having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceData = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported on this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = i18n.language === 'en' ? 'en-IN' : (i18n.language === 'hi' ? 'hi-IN' : 'pa-IN');
    recognition.start();
    setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setInput(text);
      setIsListening(false);
      // Auto-send on voice input completion to enable quick speech-to-speech interaction
      handleSend(text, true); 
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const suggestions = isConsumer 
    ? [
        "Explain benefits of organic millets?",
        "How is Vedic Cow Ghee prepared?",
        "Healthy breakfast choices from local crops?"
      ]
    : [
        "Wheat yellowing?",
        "Today's Mandi price?",
        "Scheme for tractor?"
      ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50">
      <header className="flex items-center justify-between p-4 bg-white shadow-sm z-10">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-3 p-2 rounded-full bg-gray-100 text-gray-800">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center space-x-2">
            <Sparkles className="text-secondary" size={20} />
            <h1 className="text-lg font-bold text-gray-800">Kisan GPT</h1>
          </div>
        </div>
        {isSpeaking && (
          <button onClick={stopSpeaking} className="p-2 text-red-500 bg-red-50 rounded-full text-xs font-bold flex items-center space-x-1">
            <SquareSquare size={14} className="fill-current" />
            <span>Stop</span>
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-3 px-4 relative group ${
              msg.role === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              {msg.role === 'model' && (
                <button 
                  onClick={() => speakText(msg.text)} 
                  className="absolute -right-10 bottom-0 p-2 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Read Aloud"
                >
                  <Volume2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 rounded-bl-sm shadow-sm flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{animationDelay: '0.2s'}} />
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{animationDelay: '0.4s'}} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="bg-white border-t border-gray-200 p-3 pt-2 safe-area-bottom">
        <div className="flex space-x-2 overflow-x-auto no-scrollbar mb-3 pb-1">
          {suggestions.map(s => (
            <button key={s} onClick={() => handleSend(s, false)} className="whitespace-nowrap bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full border border-gray-200">
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <button 
            type="button" 
            onClick={handleVoiceData}
            className={`p-3 rounded-full flex-shrink-0 transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-primary'}`}
            title="Speak to ask"
          >
            <Mic size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input, false)}
            placeholder={t("ask_ai_placeholder")}
            className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button 
            type="button" 
            onClick={() => handleSend(input, false)}
            disabled={!input.trim()}
            className="p-3 bg-primary text-white rounded-full flex-shrink-0 disabled:opacity-50"
          >
            <Send size={20} className="ml-0.5" />
          </button>
        </div>
      </div>
      <PremiumModal isOpen={showPremiumOptions} onClose={() => setShowPremiumOptions(false)} message="Your 30-day free trial has expired. Upgrade to keep using Kisan GPT." />
    </div>
  );
}
