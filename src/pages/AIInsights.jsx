import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

const SUGGESTED_PROMPTS = [
  'How much passive income will I earn next year?',
  'Is my portfolio income diversified enough?',
  'Which holdings are at risk of a dividend cut?',
  'What is my current portfolio yield vs market average?',
  'Show me my top income-generating assets',
  'How would DRIP affect my income in 10 years?',
];

function MarkdownText({ text }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;

        const renderBold = (str) => {
          const parts = str.split(/\*\*(.*?)\*\*/g);
          return parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{p}</strong> : p);
        };

        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="text-white font-bold">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('- ')) {
          return <p key={i} className="text-gray-300 pl-3 flex gap-2"><span className="text-emerald-400 flex-shrink-0">•</span><span>{renderBold(line.slice(2))}</span></p>;
        }
        if (/^\d+\./.test(line)) {
          return <p key={i} className="text-gray-300 pl-3">{renderBold(line)}</p>;
        }
        if (line.startsWith('#')) {
          return <p key={i} className="text-white font-bold text-base">{line.replace(/^#+\s/, '')}</p>;
        }
        return <p key={i} className="text-gray-300">{renderBold(line)}</p>;
      })}
    </div>
  );
}

const insightCards = [
  {
    type: 'opportunity',
    icon: '💡',
    title: 'Income Opportunity',
    content: 'Ask AI to analyze your highest-yield positions and find opportunities to increase your passive income.',
    tag: 'Growth',
    tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    type: 'risk',
    icon: '⚠️',
    title: 'Risk Analysis',
    content: 'Ask AI to identify holdings at risk of dividend cuts or significant drawdowns based on your portfolio.',
    tag: 'Watch',
    tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    type: 'diversification',
    icon: '⚖️',
    title: 'Diversification Check',
    content: 'Ask AI to evaluate your income diversification and suggest improvements across sectors and geographies.',
    tag: 'Optimize',
    tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
];

export default function AIInsights() {
  const { authAxios } = useAuth();
  const { formatMoney } = useCurrency();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm your InvestIQ AI advisor powered by Claude. I can analyze your connected portfolios across all brokers and exchanges.\n\nWhat would you like to know about your investments?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data } = await authAxios.post('/api/ai/chat', {
        messages: chatHistory,
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to get AI response. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: `**Error:** ${errorMsg}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Insights</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your intelligent investment advisor powered by Claude</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chat interface */}
        <div className="xl:col-span-2 flex flex-col glass-card rounded-xl overflow-hidden" style={{ height: '600px' }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 bg-white/[0.02]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">InvestIQ AI</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online — portfolio context loaded
              </p>
            </div>
            <div className="ml-auto text-xs text-gray-600">claude-sonnet-4-6</div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-cyan-500 to-emerald-500 text-white'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                  }`}>
                  {msg.role === 'assistant' ? 'AI' : 'U'}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'assistant'
                  ? 'bg-[#1f2937] border border-white/5 rounded-tl-sm'
                  : 'bg-emerald-500/20 border border-emerald-500/20 rounded-tr-sm'
                  }`}>
                  <MarkdownText text={msg.content} />
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full flex-shrink-0 bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-xs font-bold text-white">AI</div>
                <div className="bg-[#1f2937] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts */}
          {messages.length < 3 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] text-gray-600 mb-1.5 uppercase tracking-wider">Suggested questions</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_PROMPTS.slice(0, 3).map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 transition-colors text-left"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-white/5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your portfolio..."
              className="flex-1 px-4 py-2.5 bg-[#1f2937] border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Insight cards */}
          {insightCards.map((card, i) => (
            <div key={i} className="glass-card rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{card.icon}</span>
                  <span className="text-xs font-semibold text-white">{card.title}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${card.tagColor}`}>{card.tag}</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{card.content}</p>
              <button
                onClick={() => sendMessage(card.title)}
                className="mt-2 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Ask AI about this →
              </button>
            </div>
          ))}

          {/* All suggested prompts */}
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Quick Questions</p>
            <div className="space-y-1.5">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="w-full text-left text-[11px] px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
                >
                  → {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
