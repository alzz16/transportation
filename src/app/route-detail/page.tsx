'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRoutes, getIncidentsForRoute, mockLocations, TransitRoute } from '@/data/mockData';
import SkeletonLoader from '@/components/SkeletonLoader';
import IncidentWidget from '@/components/IncidentWidget';
import Timeline from '@/components/Timeline';
import PresetModal from '@/components/PresetModal';
import VirtualMap from '@/components/VirtualMap';

// 각 경로에 대한 시간표 및 요약 정보를 계산하는 헬퍼 함수
function getCalculatedRouteSummary(route: TransitRoute, baseTime: Date) {
  const startHour = baseTime.getHours();
  const startMin = baseTime.getMinutes();
  const startMinTotal = startHour * 60 + startMin;

  const timesMap: { [segmentId: string]: string[] } = {};
  let currentMinTotal = startMinTotal;

  route.segments.forEach((seg) => {
    if (seg.type === 'walk') {
      currentMinTotal += seg.durationMinutes;
    } else {
      const arrivalMinTotal = currentMinTotal;
      let interval = 7;
      if (seg.lineName?.includes('경의중앙선')) interval = 8;
      else if (seg.lineName?.includes('7727')) interval = 10;
      else if (seg.type === 'bus') interval = 9;

      const recommendedDepMinTotal = Math.ceil(arrivalMinTotal / interval) * interval;
      
      const times: string[] = [];
      for (let i = 0; i < 3; i++) {
        const depTotal = recommendedDepMinTotal + i * interval;
        const h = String(Math.floor((depTotal / 60) % 24)).padStart(2, '0');
        const m = String(depTotal % 60).padStart(2, '0');
        times.push(`${h}:${m}`);
      }

      timesMap[seg.id] = times;
      currentMinTotal = recommendedDepMinTotal + seg.durationMinutes;
    }
  });

  const totalTimeDiff = currentMinTotal - startMinTotal;
  const finalStartHour = Math.floor((startMinTotal / 60) % 24);
  const finalStartMin = startMinTotal % 60;
  const finalEndHour = Math.floor((currentMinTotal / 60) % 24);
  const finalEndMin = currentMinTotal % 60;

  return {
    timesMap,
    startTimeStr: `${String(finalStartHour).padStart(2, '0')}:${String(finalStartMin).padStart(2, '0')}`,
    endTimeStr: `${String(finalEndHour).padStart(2, '0')}:${String(finalEndMin).padStart(2, '0')}`,
    totalDuration: totalTimeDiff,
    delayMinutes: totalTimeDiff - route.totalDuration
  };
}

function RouteDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const startId = searchParams.get('start');
  const endId = searchParams.get('end');
  const initialRouteId = searchParams.get('routeId');

  const [isLoading, setIsLoading] = useState(true);
  const [isMapSyncing, setIsMapSyncing] = useState(false);
  const [allRoutes, setAllRoutes] = useState<TransitRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [baseTime, setBaseTime] = useState<Date | null>(null);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. 초기 쿼리 검사 및 로딩 시뮬레이션
  useEffect(() => {
    if (!startId || !endId) {
      router.push('/');
      return;
    }

    const foundRoutes = getRoutes(startId, endId);
    if (foundRoutes.length === 0) {
      alert('해당 경로의 운행 정보가 없습니다.');
      router.push('/search');
      return;
    }

    setAllRoutes(foundRoutes);
    setBaseTime(new Date());

    // 초기 활성화 경로 설정 (프리셋 유무 등)
    if (initialRouteId) {
      const exists = foundRoutes.some(r => r.id === initialRouteId);
      if (exists) {
        setSelectedRouteId(initialRouteId);
      }
    }

    // 1.2초간 스켈레톤 로딩 연출
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [startId, endId, router, initialRouteId]);

  if (allRoutes.length === 0 || !baseTime) return null;

  // 현재 선택된 경로 객체 구하기
  const selectedRoute = allRoutes.find(r => r.id === selectedRouteId) || null;

  // 선택된 경로의 정보 계산
  const selectedInfo = selectedRoute ? getCalculatedRouteSummary(selectedRoute, baseTime) : null;
  const selectedIncidents = selectedRoute ? getIncidentsForRoute(selectedRoute) : [];

  // 출발/도착역 정보
  const startLoc = mockLocations.find(l => l.id === startId);
  const endLoc = mockLocations.find(l => l.id === endId);

  // 경로 클릭 토글 및 맵 로딩 연출
  const handleSelectRoute = (routeId: string) => {
    setIsMapSyncing(true);
    setSelectedRouteId(routeId);
    setTimeout(() => {
      setIsMapSyncing(false);
    }, 600);
  };

  // 프리셋으로 저장 액션
  const handleSavePreset = (title: string) => {
    if (!startLoc || !endLoc || !selectedRoute) return;

    const saved = localStorage.getItem('transit-presets');
    let presets = [];
    if (saved) {
      try {
        presets = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    const newPreset = {
      id: `preset-${Date.now()}`,
      title,
      startLocation: startLoc,
      endLocation: endLoc,
      routeId: selectedRoute.id,
      routeTitle: selectedRoute.title,
      createdAt: Date.now()
    };

    const filtered = presets.filter(
      (p: any) => !(p.startLocation.id === startLoc.id && p.endLocation.id === endLoc.id && p.routeId === selectedRoute.id)
    );

    localStorage.setItem('transit-presets', JSON.stringify([newPreset, ...filtered]));
    setIsModalOpen(false);
    router.push('/');
  };

  return (
    <main className="min-height-100vh overflow-y-scroll flex flex-col items-center justify-start px-4 py-8 max-w-md mx-auto w-full">
      {/* 헤더 */}
      <div className="w-full flex items-center justify-between mb-6">
        <button
          onClick={() => router.push(searchParams.get('from') === 'preset' ? '/' : '/search')}
          className="p-2 glass-panel hover:bg-slate-500/10 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {selectedRoute ? '선택된 경로 상세' : '추천 경로 선택'}
        </h1>
        <button
          disabled={!selectedRoute}
          onClick={() => setIsModalOpen(true)}
          className="p-2 glass-panel hover:bg-slate-500/10 hover:text-amber-600 active:scale-95 transition-all disabled:opacity-40 disabled:hover:text-slate-400 disabled:cursor-not-allowed"
          title="이 경로 프리셋으로 저장"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <div className="w-full flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* 가상 실시간 노선 지도 (경로 선택시에만 고정 노출) */}
          {selectedRoute && (
            <div className="w-full animate-in fade-in zoom-in-95 duration-300">
              <VirtualMap segments={selectedRoute.segments} isLoading={isMapSyncing} />
            </div>
          )}

          {/* 1. 경로 리스트 또는 단일 선택 상태 요약 카드 */}
          <div className="w-full flex flex-col gap-4">
            
            {/* 단일 선택 상태 (나머지 카드 숨김) */}
            {selectedRoute ? (
              <div className="w-full flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    {startLoc?.name} ➡️ {endLoc?.name}
                  </span>
                  
                  {/* 다른 경로 보기(목록으로 가기) 버튼 */}
                  <button
                    onClick={() => setSelectedRouteId(null)}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-500 bg-blue-50 hover:bg-blue-100/80 px-2 py-1 rounded-md transition-all flex items-center gap-0.5 border border-blue-100 shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    다른 경로 목록 보기
                  </button>
                </div>

                {/* 선택된 요약 카드 단 하나 렌더링 (보더 두께 차이를 1px로 통일) */}
                {(() => {
                  const summary = selectedInfo!;
                  const routeIncidents = getIncidentsForRoute(selectedRoute);
                  const hasEmergency = routeIncidents.some(inc => inc.level === 'emergency');

                  return (
                    <div className="w-full glass-panel p-5 flex flex-col gap-3.5 relative overflow-hidden border border-blue-500 bg-blue-50/10 shadow-md">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-blue-50 text-blue-600 border-blue-100">
                            {selectedRoute.title}
                          </span>
                          {hasEmergency ? (
                            <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded animate-pulse">
                              긴급 지연/우회권장
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                              정상 소통
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium">
                          요금: {selectedRoute.totalFare.toLocaleString()}원
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-slate-900">{summary.totalDuration}</span>
                        <span className="text-sm font-semibold text-slate-700 font-sans">분 소요</span>
                        {summary.delayMinutes > 0 && (
                          <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 ml-2">
                            대기 {summary.delayMinutes}분 포함
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-semibold text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <span>{summary.startTimeStr} 출발</span>
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <span className="text-slate-900 font-bold">{summary.endTimeStr} 도착</span>
                      </div>

                      {/* 타임라인 바 표시 */}
                      <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden mt-3 p-[2px]">
                        {selectedRoute.segments.map((seg, sIdx) => {
                          const percentage = (seg.durationMinutes / selectedRoute.totalDuration) * 100;
                          let colorClass = 'bg-slate-400';
                          if (seg.type === 'subway') {
                            if (seg.lineName?.includes('3호선')) colorClass = 'bg-orange-500';
                            else if (seg.lineName?.includes('경의중앙선')) colorClass = 'bg-emerald-500';
                            else if (seg.lineName?.includes('신분당선')) colorClass = 'bg-red-600';
                            else colorClass = 'bg-blue-600';
                          } else if (seg.type === 'bus') {
                            colorClass = 'bg-blue-500';
                          }

                          return (
                            <div
                              key={sIdx}
                              className={`h-full ${colorClass} first:rounded-l-full last:rounded-r-full`}
                              style={{ width: `${percentage}%` }}
                              title={`${seg.lineName || '도보'} - ${seg.durationMinutes}분`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 font-semibold px-0.5">
                        <span>출발</span>
                        <span>환승</span>
                        <span>도착</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              // 목록 전체 노출 상태 (선택된 카드가 없을 때)
              <div className="w-full flex flex-col gap-4">
                <div className="text-xs font-semibold text-slate-500 px-1">
                  {startLoc?.name} 에서 {endLoc?.name} 까지의 추천 대중교통 경로 목록
                </div>

                {allRoutes.map((routeItem) => {
                  const summary = getCalculatedRouteSummary(routeItem, baseTime);
                  const routeIncidents = getIncidentsForRoute(routeItem);
                  const hasEmergency = routeIncidents.some(inc => inc.level === 'emergency');

                  return (
                    <div
                      key={routeItem.id}
                      onClick={() => handleSelectRoute(routeItem.id)}
                      className="w-full glass-panel p-5 flex flex-col gap-3.5 relative overflow-hidden transition-all duration-300 cursor-pointer active:scale-[0.99] border border-slate-200 bg-white/40 hover:bg-slate-500/5 hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-200">
                            {routeItem.title}
                          </span>
                          {hasEmergency ? (
                            <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded animate-pulse">
                              긴급 지연/우회권장
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                              정상 소통
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium">
                          요금: {routeItem.totalFare.toLocaleString()}원
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-slate-900">{summary.totalDuration}</span>
                        <span className="text-sm font-semibold text-slate-700 font-sans">분 소요</span>
                        {summary.delayMinutes > 0 && (
                          <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 ml-2">
                            대기 {summary.delayMinutes}분 포함
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-semibold text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <span>{summary.startTimeStr} 출발</span>
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <span className="text-slate-900 font-bold">{summary.endTimeStr} 도착</span>
                      </div>

                      {/* 타임라인 바 표시 */}
                      <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden mt-3 p-[2px]">
                        {routeItem.segments.map((seg, sIdx) => {
                          const percentage = (seg.durationMinutes / routeItem.totalDuration) * 100;
                          let colorClass = 'bg-slate-400';
                          if (seg.type === 'subway') {
                            if (seg.lineName?.includes('3호선')) colorClass = 'bg-orange-500';
                            else if (seg.lineName?.includes('경의중앙선')) colorClass = 'bg-emerald-500';
                            else if (seg.lineName?.includes('신분당선')) colorClass = 'bg-red-600';
                            else colorClass = 'bg-blue-600';
                          } else if (seg.type === 'bus') {
                            colorClass = 'bg-blue-500';
                          }

                          return (
                            <div
                              key={sIdx}
                              className={`h-full ${colorClass} first:rounded-l-full last:rounded-r-full`}
                              style={{ width: `${percentage}%` }}
                              title={`${seg.lineName || '도보'} - ${seg.durationMinutes}분`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 font-semibold px-0.5">
                        <span>출발</span>
                        <span>환승</span>
                        <span>도착</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 선택된 경로의 상세 정보 영역 */}
          {selectedRoute && selectedInfo ? (
            <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="w-full h-[1px] bg-slate-200 my-2"></div>
              
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider px-1">
                [경로 상세 정보 및 돌발 현황]
              </div>

              {/* 2. 실시간 특이사항 정보 */}
              <IncidentWidget incidents={selectedIncidents} />

              {/* 3. 상세 타임라인 노선도 */}
              <Timeline segments={selectedRoute.segments} matchedTimes={selectedInfo.timesMap} />
            </div>
          ) : (
            <div className="w-full glass-panel p-8 text-center text-slate-500 text-xs font-bold flex flex-col items-center gap-3 border border-slate-200">
              <svg className="w-8 h-8 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              위의 추천 경로 카드 중 하나를 선택하시면<br />상세 매칭 시간표 및 실시간 특이사항 정보를 볼 수 있습니다.
            </div>
          )}

          {/* 메인으로 가기 및 안내종료 버튼 */}
          <button
            onClick={() => router.push('/')}
            className="w-full py-4 rounded-xl glass-panel hover:bg-slate-500/10 text-slate-700 font-semibold active:scale-98 transition-all border border-slate-200 mt-2 mb-8 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            메인 화면으로 돌아가기
          </button>
        </div>
      )}

      {/* 프리셋 저장 모달 */}
      {selectedRoute && (
        <PresetModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSavePreset}
          defaultTitle={startLoc && endLoc ? startLoc.name + ' -> ' + endLoc.name : ''}
        />
      )}
    </main>
  );
}

export default function RouteDetailPage() {
  return (
    <Suspense fallback={
      <main className="min-height-100vh flex flex-col items-center justify-start px-4 py-8 max-w-md mx-auto">
        <div className="text-slate-500 text-sm">경로 데이터 불러오는 중...</div>
      </main>
    }>
      <RouteDetailContent />
    </Suspense>
  );
}
