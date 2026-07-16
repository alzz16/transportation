'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mockLocations, Location } from '@/data/mockData';

interface RecentSearch {
  id: string;
  start: Location;
  end: Location;
  timestamp: number;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 출발지 / 도착지 상태
  const [startInput, setStartInput] = useState('');
  const [selectedStart, setSelectedStart] = useState<Location | null>(null);
  const [endInput, setEndInput] = useState('');
  const [selectedEnd, setSelectedEnd] = useState<Location | null>(null);

  // 드롭다운 포커스 상태
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);

  // 최근 검색 기록
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // ref 포커스 해제용
  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // 1. 쿼리 스트링 파싱 및 초기값 세팅 (메인에서 바로 검색하거나 프리셋 편집 시 대응)
  useEffect(() => {
    const startId = searchParams.get('start');
    const endId = searchParams.get('end');

    if (startId) {
      const loc = mockLocations.find(l => l.id === startId);
      if (loc) {
        setSelectedStart(loc);
        setStartInput(loc.name);
      }
    }
    if (endId) {
      const loc = mockLocations.find(l => l.id === endId);
      if (loc) {
        setSelectedEnd(loc);
        setEndInput(loc.name);
      }
    }

    // 최근 검색 기록 로드
    const saved = localStorage.getItem('transit-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [searchParams]);

  // 2. 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (startRef.current && !startRef.current.contains(event.target as Node)) {
        setShowStartSuggestions(false);
      }
      if (endRef.current && !endRef.current.contains(event.target as Node)) {
        setShowEndSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. 자동완성 후보 필터링
  const getSuggestions = (input: string, excludeLoc: Location | null) => {
    if (!input.trim()) return [];
    return mockLocations.filter(
      loc =>
        loc.name.toLowerCase().includes(input.toLowerCase()) &&
        loc.id !== excludeLoc?.id
    );
  };

  const startSuggestions = getSuggestions(startInput, selectedEnd);
  const endSuggestions = getSuggestions(endInput, selectedStart);

  // 4. 출발지/도착지 스왑
  const handleSwap = () => {
    const tempLoc = selectedStart;
    const tempInput = startInput;

    setSelectedStart(selectedEnd);
    setStartInput(endInput);

    setSelectedEnd(tempLoc);
    setEndInput(tempInput);
  };

  // 5. 검색 실행 (상세 페이지로 이동 및 최근 검색 기록 저장)
  const handleSearch = () => {
    // 입력한 텍스트를 기반으로 매칭되는 역/정류장을 찾는 헬퍼
    const resolveLocation = (input: string, currentSelected: Location | null): Location | null => {
      if (currentSelected) return currentSelected;
      const trimmed = input.trim();
      if (!trimmed) return null;
      
      // 1. 정확히 매칭되는 지명 검색
      const exact = mockLocations.find(l => l.name === trimmed);
      if (exact) return exact;
      
      // 2. 부분 매칭되는 첫 번째 지명 검색
      const partial = mockLocations.find(l => l.name.toLowerCase().includes(trimmed.toLowerCase()));
      if (partial) return partial;
      
      return null;
    };

    const start = resolveLocation(startInput, selectedStart);
    const end = resolveLocation(endInput, selectedEnd);

    if (!start) {
      alert(`출발지 '${startInput}'에 매칭되는 역사/정류장을 찾을 수 없습니다. 정확한 지명을 입력하거나 목록에서 선택해 주세요.`);
      return;
    }
    if (!end) {
      alert(`도착지 '${endInput}'에 매칭되는 역사/정류장을 찾을 수 없습니다. 정확한 지명을 입력하거나 목록에서 선택해 주세요.`);
      return;
    }

    // 최근 검색 기록 추가
    const newSearch: RecentSearch = {
      id: `${start.id}-${end.id}-${Date.now()}`,
      start: start,
      end: end,
      timestamp: Date.now()
    };

    // 중복 제거 후 최신 검색어 맨 앞으로
    const filtered = recentSearches.filter(
      item => !(item.start.id === start.id && item.end.id === end.id)
    );
    const updated = [newSearch, ...filtered].slice(0, 5); // 최대 5개 저장

    setRecentSearches(updated);
    localStorage.setItem('transit-recent-searches', JSON.stringify(updated));

    // 경로 상세 화면으로 이동
    router.push(`/route-detail?start=${start.id}&end=${end.id}`);
  };

  // 6. 최근 검색 기록 선택
  const handleSelectRecent = (search: RecentSearch) => {
    setSelectedStart(search.start);
    setStartInput(search.start.name);
    setSelectedEnd(search.end);
    setEndInput(search.end.name);
  };

  // 7. 최근 검색 기록 개별 삭제
  const handleDeleteRecent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(item => item.id !== id);
    setRecentSearches(updated);
    localStorage.setItem('transit-recent-searches', JSON.stringify(updated));
  };

  return (
    <main className="min-height-100vh flex flex-col items-center justify-start px-4 py-8 max-w-md mx-auto">
      {/* 헤더 */}
      <div className="w-full flex items-center justify-between mb-8">
        <button
          onClick={() => router.push('/')}
          className="p-2 glass-panel hover:bg-slate-500/10 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          경로 검색
        </h1>
        <div className="w-9"></div> {/* 좌우 균형 맞춤 */}
      </div>

      {/* 출발/도착 검색 카드 */}
      <div className="w-full glass-panel p-5 mb-6 flex flex-col gap-4 relative">
        {/* 스왑 버튼 */}
        <button
          onClick={handleSwap}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-accent-primary border border-indigo-400/20 rounded-full hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all text-white shadow-lg shadow-indigo-500/20"
          title="출발지/도착지 전환"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>

        {/* 출발지 입력 */}
        <div className="flex flex-col gap-1.5 w-[82%]" ref={startRef}>
          <label className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            출발지
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="출발 역 또는 정류장 검색"
              value={startInput}
              onChange={(e) => {
                setStartInput(e.target.value);
                setSelectedStart(null);
                setShowStartSuggestions(true);
              }}
              onFocus={() => setShowStartSuggestions(true)}
              className="w-full px-4 py-3 rounded-lg glass-input text-sm"
            />
            {showStartSuggestions && startSuggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 z-20 mt-1 glass-panel py-1 max-h-48 overflow-y-auto shadow-2xl border border-slate-200">
                {startSuggestions.map((loc) => (
                  <li key={loc.id}>
                    <button
                      onClick={() => {
                        setSelectedStart(loc);
                        setStartInput(loc.name);
                        setShowStartSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-600/10 transition-colors flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-700">{loc.name}</span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100/80 text-slate-500 border border-slate-200/50">
                        {loc.detail}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 구분선 */}
        <div className="w-[82%] h-[1px] bg-slate-200 my-1"></div>

        {/* 도착지 입력 */}
        <div className="flex flex-col gap-1.5 w-[82%]" ref={endRef}>
          <label className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            도착지
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="도착 역 또는 정류장 검색"
              value={endInput}
              onChange={(e) => {
                setEndInput(e.target.value);
                setSelectedEnd(null);
                setShowEndSuggestions(true);
              }}
              onFocus={() => setShowEndSuggestions(true)}
              className="w-full px-4 py-3 rounded-lg glass-input text-sm"
            />
            {showEndSuggestions && endSuggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 z-20 mt-1 glass-panel py-1 max-h-48 overflow-y-auto shadow-2xl border border-slate-200">
                {endSuggestions.map((loc) => (
                  <li key={loc.id}>
                    <button
                      onClick={() => {
                        setSelectedEnd(loc);
                        setEndInput(loc.name);
                        setShowEndSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-600/10 transition-colors flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-700">{loc.name}</span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100/80 text-slate-500 border border-slate-200/50">
                        {loc.detail}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 탐색 버튼 */}
      <button
        disabled={!startInput.trim() || !endInput.trim()}
        onClick={handleSearch}
        className="w-full py-4 rounded-[20px] bg-accent-primary font-bold text-white shadow-lg shadow-indigo-500/20 active:scale-98 transition-all hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 mb-8"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        경로 탐색 시작
      </button>

      {/* 최근 검색 기록 */}
      <div className="w-full flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          최근 검색 기록
        </h2>
        {recentSearches.length === 0 ? (
          <div className="glass-panel p-6 text-center text-sm text-slate-400">
            최근 검색 기록이 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recentSearches.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectRecent(item)}
                className="w-full glass-panel p-4 hover:bg-slate-500/5 cursor-pointer flex items-center justify-between border-l-4 border-l-accent-primary active:scale-99 transition-all border border-slate-200/30"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="font-bold text-emerald-600">{item.start.name}</span>
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="font-bold text-red-500">{item.end.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(item.timestamp).toLocaleString('ko-KR', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric'
                    })}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteRecent(item.id, e)}
                  className="p-1.5 rounded-full hover:bg-slate-500/10 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="min-height-100vh flex flex-col items-center justify-start px-4 py-8 max-w-md mx-auto">
        <div className="text-slate-500 text-sm">페이지 로딩 중...</div>
      </main>
    }>
      <SearchContent />
    </Suspense>
  );
}

