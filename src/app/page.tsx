'use client';

import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import PresetSection, { RoutePreset } from '@/components/PresetSection';
import { getOrCreateDeviceId } from '@/utils/user';
import ChatWidget from '@/components/ChatWidget';

export default function HomePage() {
  const [presets, setPresets] = useState<RoutePreset[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 데이터베이스(API) 및 LocalStorage 교차 프리셋 목록 읽어오기
  useEffect(() => {
    async function loadPresets() {
      try {
        const deviceId = getOrCreateDeviceId();
        const res = await fetch(`/api/presets?userId=${deviceId}`);
        if (res.ok) {
          const data = await res.json();
          setPresets(data);
          // 로컬스토리지에도 최신 상태 업데이트 백업
          localStorage.setItem('transit-presets', JSON.stringify(data));
          return;
        }
      } catch (err) {
        console.error('API 프리셋 조회 실패, LocalStorage 폴백 사용:', err);
      }

      // 오프라인/에러 시 로컬스토리지 폴백 로드
      const saved = localStorage.getItem('transit-presets');
      if (saved) {
        try {
          setPresets(JSON.parse(saved));
        } catch (e) {
          console.error('프리셋 로컬스토리지 로드 에러:', e);
        }
      }
    }

    loadPresets();
  }, []);

  // 프리셋 개별 삭제 (API 호출 및 로컬스토리지 동시 갱신)
  const handleDeletePreset = async (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('transit-presets', JSON.stringify(updated));

    try {
      await fetch(`/api/presets?id=${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('API 프리셋 삭제 동기화 실패:', e);
    }
  };

  return (
    <main className="min-height-100vh flex flex-col items-center justify-start px-4 py-12 max-w-md mx-auto">
      {/* 서비스 로고 및 헤더 */}
      <div className="w-full flex flex-col items-center gap-2 mb-10 text-center">
        {/* 아이콘 */}
        <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg border border-indigo-400/20 mb-1 animate-in fade-in duration-300">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-slate-800 bg-clip-text text-transparent">
          TransitFlow
        </h1>
        <p className="text-xs font-bold text-slate-400 tracking-wide">
          대중교통 시간표 환승 및 실시간 알림 서비스
        </p>
      </div>

      {/* 퀵 검색바 */}
      <SearchBar />

      {/* 자주 이용하는 경로 프리셋 */}
      <PresetSection presets={presets} onDeletePreset={handleDeletePreset} />

      {/* 실시간 DB 데이터 참조 GROQ AI 챗봇 가이드 */}
      <div className="w-full max-w-[360px] mx-auto mt-10 transition-all duration-300">
        {isChatOpen ? (
          <div className="animate-in slide-in-from-bottom-5 duration-300">
            <ChatWidget onClose={() => setIsChatOpen(false)} />
          </div>
        ) : (
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-3.5 px-6 rounded-[20px] flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-violet-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer"
          >
            <svg className="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            AI 환승 비서와 대화하기
          </button>
        )}
      </div>
    </main>
  );
}
