import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile, MealItem } from '../types';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Volume2,
  VolumeX,
  RefreshCw,
  Zap,
  HelpCircle,
  Clock
} from 'lucide-react';

interface MetabolicCoachProps {
  currentGlucose: number;
  glucoseTrend: string;
  timeInRangePercent: number;
  dailyGlycemicLoad: number;
  recentMeals: MealItem[];
  profile: UserProfile;
}

export const MetabolicCoach: React.FC<MetabolicCoachProps> = ({
  currentGlucose,
  glucoseTrend,
  timeInRangePercent,
  dailyGlycemicLoad,
  recentMeals,
  profile,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `Hello ${profile.name}! I am your GlucoFit AI metabolic health specialist. I am monitoring your real-time glucose stream (currently ${currentGlucose} mg/dL, ${glucoseTrend}). How can I help optimize your nutrition or blunt glycemic spikes today?`,
      timestamp: new Date().toISOString(),
      contextGlucose: currentGlucose,
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const quickPrompts = [
    'How do I lower my blood sugar after eating carbs?',
    'What should I order at an Italian restaurant?',
    'Why is food sequencing so effective for glucose?',
    'Suggest a low-glycemic bedtime snack',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputVal;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toISOString(),
      contextGlucose: currentGlucose,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputVal('');
    setIsTyping(true);

    try {
      const lastMeal = recentMeals[recentMeals.length - 1]?.name || 'Greek Yogurt Bowl';

      const res = await fetch('/api/gemini/metabolic-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
          userContext: {
            currentGlucose,
            trend: glucoseTrend,
            timeInRange: timeInRangePercent,
            dailyGlycemicLoad,
            lastMeal,
            dietPreference: profile.dietaryPreference,
          },
        }),
      });

      if (!res.ok) throw new Error('Chat response failed');
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Stay hydrated and consider a light walk to support glucose stability!',
        timestamp: new Date().toISOString(),
        contextGlucose: currentGlucose,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'I am temporarily experiencing network lag. In the meantime: taking a 10-minute walk after meals activates GLUT4 transporters to clear glucose from the bloodstream.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      const cleanText = text.replace(/[*#_]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div id="metabolic-coach-view" className="space-y-4 flex flex-col h-[calc(100vh-210px)] max-h-[640px]">
      {/* Header info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>GlucoFit AI Metabolic Coach</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Live CGM: {currentGlucose} mg/dL • TIR: {timeInRangePercent}%
            </p>
          </div>
        </div>

        {isSpeaking && (
          <button
            onClick={() => handleSpeak('')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 text-xs font-semibold"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Mute</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 p-2">
        {messages.map((m) => {
          const isUser = m.sender === 'user';

          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs shadow-xs space-y-1.5 leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                <div className="flex items-center justify-between text-[10px] opacity-70 pt-1 border-t border-current/10">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {!isUser && (
                    <button
                      onClick={() => handleSpeak(m.text)}
                      className="hover:opacity-100 flex items-center gap-1 text-[10px]"
                      title="Listen with voice TTS"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Listen</span>
                    </button>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center animate-spin">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span>GlucoFit AI is synthesizing metabolic science...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0 no-scrollbar">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-[11px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap transition-colors shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-xs flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask metabolic coach anything..."
          className="flex-1 px-3 py-2 text-xs bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || isTyping}
          className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
