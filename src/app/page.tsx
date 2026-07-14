'use client';

import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import PresetSection, { RoutePreset } from '@/components/PresetSection';

export default function HomePage() {
  const [presets, setPresets] = useState<RoutePreset[]>([]);

  // LocalStorage로부터 프리셋 목록 읽어오기
  useEffect(() => {
    const saved = localStorage.getItem('transit-presets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error('프리셋 로드 중 에러:', e);
      }
    }
  }, []);

  // 프리셋 개별 삭제
  const handleDeletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('transit-presets', JSON.stringify(updated));
  };

  return (
    <main className="min-height-100vh flex flex-col items-center justify-start px-4 py-12 max-w-md mx-auto">
      {/* 서비스 로고 및 헤더 */}
      <div className="w-full flex flex-col items-center gap-2 mb-10 text-center">
        {/* 아이콘 */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg border border-blue-400/20 mb-1 animate-in fade-in duration-300">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-800 bg-clip-text text-transparent">
          TransitFlow
        </h1>
        <p className="text-xs font-semibold text-slate-500 tracking-wide">
          대중교통 시간표 환승 및 실시간 알림 서비스
        </p>
      </div>

      {/* 퀵 검색바 */}
      <SearchBar />

      {/* 자주 이용하는 경로 프리셋 */}
      <PresetSection presets={presets} onDeletePreset={handleDeletePreset} />

      {/* 안내 가이드 팁 */}
      <div className="w-full glass-panel p-5 mt-10 border-l-4 border-l-blue-600 flex gap-3.5 items-start bg-blue-50/20">
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-slate-700">사용 안내 팁</span>
          <span className="text-[11px] text-slate-500 leading-relaxed font-medium">
            원당역 ➡️ 한국항공대역 같은 자주 타는 노선을 미리 검색한 후 상세 화면에서 저장하면 메인 프리셋에 등록되어, 매번 검색할 필요 없이 한 번에 최적 매칭된 실시간 대기 정보를 조회할 수 있습니다.
          </span>
        </div>
      </div>
    </main>
  );
}
