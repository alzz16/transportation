'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWidgetProps {
  onClose?: () => void;
}

export default function ChatWidget({ onClose }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '안녕하세요! TransitFlow AI 환승 안내 도우미입니다. 지하철 지연 우려나 경로별 요금, 소요시간 등 궁금하신 점이 있으시면 편하게 물어보세요! 😊',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤 하단 고정
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 빠른 추천 질문 태그 리스트
  const quickQuestions = [
    '화전역 지연 상황 알려줘 🚨',
    '3호선 지연 있어? 🚇',
    '원당역에서 항공대역 가는 지하철 요금은? 💳',
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage = textToSend.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // 대화 이력 맵핑 (최근 10개만 전달하여 컨텍스트 초과 방어)
      const history = messages
        .slice(-10)
        .map(msg => ({ role: msg.role, content: msg.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history }),
      });

      if (!res.ok) throw new Error('API 응답 이상');

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ 죄송합니다. 대답을 생성하는 중 일시적인 연결 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl pt-8 pb-4 px-5 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
      {/* 장식용 배경 광원 */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* 헤더 */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5 relative z-10">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
          </span>
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-tight">TransitFlow AI 가이드</h3>
            <p className="text-[10px] text-slate-400 font-medium">실시간 DB 기반 답변 처리</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100/50">
            GROQ AI
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center"
              title="챗봇 닫기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 메시지 바디 */}
      <div className="h-[280px] overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-200 relative z-10">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-md font-medium'
                    : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200/30'
                }`}
                style={{ whiteSpace: 'pre-line' }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {/* 답변 대기 중 로딩 바 */}
        {isLoading && (
          <div className="flex w-full justify-start animate-pulse">
            <div className="bg-slate-100 text-slate-500 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 추천 질문 태그 */}
      <div className="flex flex-wrap gap-1.5 mt-3 mb-2 relative z-10">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200/50 px-2.5 py-1 rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {q}
          </button>
        ))}
      </div>

      {/* 입력부 */}
      <div className="flex items-center gap-2 mt-1.5 pt-2 border-t border-slate-100 relative z-10">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSend(input);
          }}
          disabled={isLoading}
          placeholder="교통 정보나 지연 현황을 물어보세요..."
          className="flex-1 bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-2.5 text-xs text-slate-700 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 disabled:opacity-50"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={!input.trim() || isLoading}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl text-xs font-bold hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none disabled:scale-100 cursor-pointer flex items-center gap-1 shadow-md shadow-blue-500/25"
        >
          전송
        </button>
      </div>
    </div>
  );
}
