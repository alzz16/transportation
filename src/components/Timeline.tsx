'use client';

import { useState } from 'react';
import { RouteSegment } from '@/data/mockData';

interface TimelineProps {
  segments: RouteSegment[];
  matchedTimes: { [segmentId: string]: string[] }; // 각 세그먼트별 매칭된 탑승/환승 시간표 리스트
}

export default function Timeline({ segments, matchedTimes }: TimelineProps) {
  // 중간 이동 역 아코디언 상태 관리
  const [expandedSegments, setExpandedSegments] = useState<{ [key: string]: boolean }>({});

  const toggleExpand = (segmentId: string) => {
    setExpandedSegments(prev => ({
      ...prev,
      [segmentId]: !prev[segmentId]
    }));
  };

  // 지하철/버스 노선 컬러 매핑 헬퍼
  const getLineColor = (lineName?: string) => {
    if (!lineName) return 'bg-slate-500';
    if (lineName.includes('3호선')) return 'bg-orange-500';
    if (lineName.includes('경의중앙선')) return 'bg-emerald-500';
    if (lineName.includes('2호선')) return 'bg-green-600';
    if (lineName.includes('신분당선')) return 'bg-red-600';
    if (lineName.includes('7727')) return 'bg-blue-500';
    return 'bg-blue-600';
  };

  const getLineBorderColor = (lineName?: string) => {
    if (!lineName) return 'border-slate-500';
    if (lineName.includes('3호선')) return 'border-orange-500';
    if (lineName.includes('경의중앙선')) return 'border-emerald-500';
    if (lineName.includes('2호선')) return 'border-green-600';
    if (lineName.includes('신분당선')) return 'border-red-600';
    if (lineName.includes('7727')) return 'border-blue-500';
    return 'border-blue-600';
  };

  return (
    <div className="w-full glass-panel p-6 flex flex-col gap-6">
      <h2 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        상세 이동 경로 및 시간표 매칭
      </h2>

      <div className="flex flex-col relative pl-4">
        {segments.map((seg, idx) => {
          const isWalk = seg.type === 'walk';
          const isLast = idx === segments.length - 1;
          const lineColor = getLineColor(seg.lineName);
          const lineBorderColor = getLineBorderColor(seg.lineName);

          // 이 구간에 매칭된 가상 배차/환승 시간표 리스트
          const segmentTimes = matchedTimes[seg.id] || [];

          return (
            <div key={seg.id} className="relative flex flex-col pb-8">
              {/* 왼쪽 수직 연결 선 */}
              {!isLast && (
                <div
                  className={`absolute left-[-11px] top-4 bottom-[-24px] w-0.5 z-0 ${
                    isWalk ? 'border-l-2 border-dashed border-slate-300' : `w-1 ${lineColor}`
                  }`}
                />
              )}

              {/* 타임라인 노드 아이콘 */}
              <div className="absolute left-[-17px] top-1.5 z-10 flex items-center justify-center">
                {isWalk ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 bg-white" />
                ) : (
                  <div className={`w-[13px] h-[13px] rounded-full border-2 border-white ${lineColor}`} />
                )}
              </div>

              {/* 세그먼트 콘텐츠 */}
              <div className="flex flex-col gap-2 pl-4">
                {/* 1. 요약 타이틀 */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">
                      {isWalk ? (
                        <span>{seg.startName} ➡️ {seg.endName}</span>
                      ) : (
                        <span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md text-white mr-2 ${lineColor}`}>
                            {seg.lineName}
                          </span>
                          {seg.startName} 승차
                        </span>
                      )}
                    </span>
                    {isWalk && (
                      <span className="text-xs text-slate-500 font-medium mt-0.5">
                        도보 이동 • {seg.durationMinutes}분 소요
                      </span>
                    )}
                  </div>

                  {!isWalk && seg.direction && (
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {seg.direction}
                    </span>
                  )}
                </div>

                {/* 2. 대중교통 탑승 상세 정보 및 시간표 매칭 (지하철/버스 전용) */}
                {!isWalk && (
                  <div className="mt-1 flex flex-col gap-2 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>소요시간: <strong>{seg.durationMinutes}분</strong></span>
                      {seg.fastTransferSection && (
                        <span className="text-[11px] text-amber-600 font-semibold">
                          빠른환승: <strong>{seg.fastTransferSection}</strong>
                        </span>
                      )}
                    </div>

                    {/* 시간표 매칭 */}
                    {segmentTimes.length > 0 && (
                      <div className="flex flex-col gap-1.5 border-t border-slate-200 pt-2.5 mt-1.5">
                        <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">
                          🕒 추천 탑승 시간표 (환승 연동 완료)
                        </div>
                        <ul className="flex flex-col gap-1">
                          {segmentTimes.map((time, tIdx) => {
                            // 첫 번째 차편이 추천 탑승 차편
                            const isRecommended = tIdx === 0;
                            return (
                              <li
                                key={tIdx}
                                className={`flex items-center justify-between text-xs py-1 px-2 rounded-md ${
                                  isRecommended
                                    ? 'bg-blue-50 text-blue-800 border border-blue-100 font-bold'
                                    : 'text-slate-600 font-medium'
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  {isRecommended && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                  )}
                                  {time} 탑승
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {isRecommended ? '최적 차편 매칭' : '다음 배차'}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {/* 아코디언: 중간 경유 노선 */}
                    <div className="border-t border-slate-200 pt-2 mt-1">
                      <button
                        onClick={() => toggleExpand(seg.id)}
                        className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        <span className="font-semibold flex items-center gap-1">
                          📂 상세 정류장/역 보기
                        </span>
                        <svg
                          className={`w-3.5 h-3.5 transform transition-transform duration-200 ${
                            expandedSegments[seg.id] ? 'rotate-180' : 'rotate-0'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {expandedSegments[seg.id] && (
                        <div className="pl-3 mt-2 flex flex-col gap-2 border-l border-slate-200 text-[11px] text-slate-500 animate-in slide-in-from-top-1 duration-200">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            <span>{seg.startName} (출발역)</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                            <span>중간 정류장 통과 중... ({seg.durationMinutes}분 이동)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            <span>{seg.endName} (도착/하차역)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
