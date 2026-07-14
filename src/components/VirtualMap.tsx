'use client';

import { useEffect, useState } from 'react';
import { RouteSegment } from '@/data/mockData';

interface VirtualMapProps {
  segments: RouteSegment[];
  isLoading?: boolean;
}

export default function VirtualMap({ segments, isLoading = false }: VirtualMapProps) {
  const [drawAnim, setDrawAnim] = useState(false);

  useEffect(() => {
    // 마운트 혹은 세그먼트 변경 시 300ms 딜레이 후 드로잉 애니메이션 재실행
    setDrawAnim(false);
    const timer = setTimeout(() => {
      setDrawAnim(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [segments]);

  // 대중교통 노선 수단별 색상 매핑
  const getSegmentColor = (lineName?: string) => {
    if (!lineName) return '#94a3b8'; // 도보
    if (lineName.includes('3호선')) return '#f97316'; // 주황
    if (lineName.includes('경의중앙선')) return '#10b981'; // 초록
    if (lineName.includes('신분당선')) return '#dc2626'; // 빨강
    if (lineName.includes('7727') || lineName.includes('버스')) return '#3b82f6'; // 파랑
    return '#6366f1';
  };

  // 실시간으로 렌더링할 맵의 노드들 정의
  const mapNodes: { name: string; type: string; color: string; x: number; y: number }[] = [];
  
  // 가상의 노선 드로잉 포인트들 생성 (2D 평면 그리드 상에 노선 배치)
  let currentX = 50;
  const stepX = 85;

  segments.forEach((seg, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === segments.length - 1;
    const color = getSegmentColor(seg.lineName);

    if (isFirst) {
      mapNodes.push({
        name: seg.startName,
        type: 'start',
        color: '#10b981', // 초록 핀
        x: currentX,
        y: 80
      });
    }

    currentX += stepX;

    mapNodes.push({
      name: seg.endName,
      type: isLast ? 'end' : 'transfer',
      color: isLast ? '#ef4444' : color,
      x: currentX,
      y: seg.type === 'walk' ? 80 : 100 // 수단 변화에 맞춰 약간의 굴곡을 주어 실제 지도 같은 유기적 느낌 부여
    });
  });

  return (
    <div className="w-full h-52 rounded-2xl bg-slate-50 border border-slate-200 relative overflow-hidden shadow-inner bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
      {/* 맵 격자 및 상태 오버레이 */}
      <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm border border-slate-200/60 px-2.5 py-1 rounded-md text-[9px] font-bold text-slate-500 shadow-sm z-10 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        가상 실시간 GPS 노선 지도
      </div>

      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center bg-slate-100/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] text-slate-500 font-bold">지도 동기화 중...</span>
          </div>
        </div>
      ) : (
        <div className="w-full h-full relative">
          <svg className="w-full h-full" viewBox="0 0 390 180">
            {/* 1. 노선도 경로 라인 (뒷배경 점선) */}
            <path
              d={mapNodes.reduce((acc, node, idx) => {
                return acc + `${idx === 0 ? 'M' : 'L'} ${node.x} ${node.y} `;
              }, '')}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 2. 실시간 동적 매칭 라인 (컬러 드로잉 애니메이션 효과) */}
            <path
              d={mapNodes.reduce((acc, node, idx) => {
                return acc + `${idx === 0 ? 'M' : 'L'} ${node.x} ${node.y} `;
              }, '')}
              fill="none"
              stroke="url(#route-gradient)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-all duration-1000 ${
                drawAnim ? 'animate-dash' : 'opacity-0'
              }`}
              style={{
                strokeDasharray: '400',
                strokeDashoffset: drawAnim ? '0' : '400',
              }}
            />

            {/* SVG 그라데이션 정의 */}
            <defs>
              <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>

            {/* 3. 각 구간 경로 설명 텍스트 (수단 이름) */}
            {segments.map((seg, idx) => {
              const fromNode = mapNodes[idx];
              const toNode = mapNodes[idx + 1];
              if (!fromNode || !toNode) return null;

              const midX = (fromNode.x + toNode.x) / 2;
              const midY = (fromNode.y + toNode.y) / 2 - 10;
              const isWalk = seg.type === 'walk';

              return (
                <g key={seg.id}>
                  {/* 설명 배지 배경 */}
                  <rect
                    x={midX - 25}
                    y={midY - 9}
                    width="50"
                    height="13"
                    rx="3"
                    fill={isWalk ? '#f1f5f9' : getSegmentColor(seg.lineName)}
                    className="opacity-95 shadow-sm"
                  />
                  {/* 설명 텍스트 */}
                  <text
                    x={midX}
                    y={midY}
                    fill={isWalk ? '#64748b' : '#ffffff'}
                    fontSize="7"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {isWalk ? '도보' : seg.lineName?.split(' ')[0]}
                  </text>
                </g>
              );
            })}

            {/* 4. 경로 노드 핀 및 텍스트 렌더링 */}
            {mapNodes.map((node, idx) => {
              const isStart = node.type === 'start';
              const isEnd = node.type === 'end';
              
              return (
                <g key={idx} className="cursor-pointer">
                  {/* 외부 펄스 링 (출발/도착역 애니메이션 효과) */}
                  {(isStart || isEnd) && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="10"
                      fill={node.color}
                      className="opacity-30 animate-ping"
                      style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                    />
                  )}

                  {/* 외부 보더 원 */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="6"
                    fill="#ffffff"
                    stroke={node.color}
                    strokeWidth="3"
                  />

                  {/* 중앙 내부 점 */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="2.5"
                    fill={node.color}
                  />

                  {/* 역/정류장 이름 라벨 */}
                  <text
                    x={node.x}
                    y={node.y + 18}
                    fill="#334155"
                    fontSize="7.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="bg-white px-0.5"
                  >
                    {node.name.length > 5 ? node.name.substring(0, 5) + '..' : node.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* 하단 범례 오버레이 */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-full flex gap-3 text-[8px] font-bold text-slate-500 shadow-md">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              출발지
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              환승역
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              도착지
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
