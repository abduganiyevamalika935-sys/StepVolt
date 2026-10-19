import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Zap,
  TrendingUp,
  Wrench,
  Battery,
  Lightbulb,
} from 'lucide-react';
import { SimulationTelemetry } from '../types/simulation';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: SimulationTelemetry;
  degradedTilesCount: number;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  source?: string;
  timestamp: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  telemetry,
  degradedTilesCount,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your **StepGrid Smart-City Energy Copilot**.\n\nI continuously monitor the district's pedestrian kinetic harvesting telemetry, battery buffer levels, and infrastructure loads.\n\nAsk me any question about energy optimization, zone yield analysis, or maintenance schedules!`,
      source: 'gemini-3.8-flash',
      timestamp: 'Just now',
    },
  ]);

  if (!isOpen) return null;

  const quickPrompts = [
    {
      title: 'Highest production zone?',
      query: 'Where is the highest pedestrian energy production right now?',
      icon: TrendingUp,
    },
    {
      title: 'Recommend new tile locations',
      query: 'Which zone should receive more energy-harvesting tiles to optimize yield?',
      icon: Zap,
    },
    {
      title: 'Which tiles need maintenance?',
      query: 'Which tiles need maintenance and what are their fatigue cycles?',
      icon: Wrench,
    },
    {
      title: 'Why is battery level decreasing?',
      query: 'Why is the battery level decreasing and how can we stabilize it?',
      icon: Battery,
    },
    {
      title: 'Reduce infrastructure consumption',
      query: 'How can we reduce infrastructure energy consumption without compromising safety?',
      icon: Lightbulb,
    },
  ];

  const handleSend = async (queryText?: string) => {
    const query = (queryText || inputQuery).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          simulationData: {
            pedestrianCount: telemetry.pedestrianCount,
            totalSteps: telemetry.totalSteps,
            energyGeneratedWh: telemetry.energyGeneratedWh,
            energyConsumedWh: telemetry.energyConsumedWh,
            batteryPercentage: telemetry.batteryPercentage,
            generationRateWatts: telemetry.generationRateWatts,
            consumptionRateWatts: telemetry.consumptionRateWatts,
            netWatts: telemetry.netWatts,
            scenario: telemetry.scenario,
            degradedTilesCount,
            activeTilesCount: telemetry.activeTilesCount,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          text: data.answer,
          source: data.source || 'gemini-3.8-flash',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to generate analysis');
      }
    } catch (err: any) {
      const errorMessage: Message = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        text: `### Telemetry Analysis Alert\n\nBased on current simulation data:\n- **Harvested:** ${telemetry.energyGeneratedWh.toFixed(1)} Wh\n- **Consumed:** ${telemetry.energyConsumedWh.toFixed(1)} Wh\n- **Battery Buffer:** ${telemetry.batteryPercentage.toFixed(1)}%\n\n*Note: Simulated analysis active.*`,
        source: 'simulated-engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  StepGrid AI Infrastructure Copilot
                </h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Grounds recommendations on live district footfall, storage buffer, and load telemetry.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-slate-400 font-medium shrink-0">Quick Queries:</span>
          {quickPrompts.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(item.query)}
                className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white shrink-0 flex items-center gap-1.5 transition-colors"
              >
                <Icon className="w-3 h-3 text-cyan-400" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs custom-scrollbar">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800/60 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] p-3.5 rounded-2xl ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-tr-sm shadow-md'
                      : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-sm'
                  }`}
                >
                  {!isUser && (
                    <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800/60 text-[10px] text-cyan-400">
                      <span className="font-semibold uppercase tracking-wider">
                        AI Simulation Recommendation
                      </span>
                      <span className="text-slate-400">{msg.timestamp}</span>
                    </div>
                  )}
                  <div className="prose prose-invert prose-xs max-w-none space-y-2 leading-relaxed">
                    {msg.text.split('\n\n').map((paragraph, pIdx) => {
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h4 key={pIdx} className="font-bold text-sm text-cyan-300 mt-2">
                            {paragraph.replace('### ', '')}
                          </h4>
                        );
                      }
                      if (paragraph.startsWith('- ')) {
                        return (
                          <ul key={pIdx} className="list-disc list-inside space-y-1 text-slate-300">
                            {paragraph.split('\n').map((line, lIdx) => (
                              <li key={lIdx}>{line.replace('- ', '')}</li>
                            ))}
                          </ul>
                        );
                      }
                      return <p key={pIdx}>{paragraph}</p>;
                    })}
                  </div>
                </div>
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
          {isLoading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs">
              <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800/60 text-cyan-400 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-400 flex items-center gap-2">
                <span>Analyzing real-time grid telemetry and physical kinetic loads...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask AI Copilot (e.g. 'Where should we add 100 tiles?')..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-all shadow-md shadow-cyan-950 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
