'use client';

import { useRouter } from 'next/navigation';
import { Location } from '@/data/mockData';

export interface RoutePreset {
  id: string;
  title: string;
  startLocation: Location;
  endLocation: Location;
  routeId?: string; // 추가된 수단(경로) 식별자
  routeTitle?: string; // 추가된 수단(경로) 요약 타이틀
  createdAt: number;
}

interface PresetSectionProps {
  presets: RoutePreset[];
  onDeletePreset: (id: string) => void;
}

export default function PresetSection({ presets, onDeletePreset }: PresetSectionProps) {
  const router = useRouter();

  const handleSelectPreset = (preset: RoutePreset) => {
    let url = `/route-detail?start=${preset.startLocation.id}&end=${preset.endLocation.id}&from=preset`;
    if (preset.routeId) {
      url += `&routeId=${preset.routeId}`;
    }
    router.push(url);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2">
          <svg className="w-4.5 h-4.5 text-accent-primary animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          자주 이용하는 경로 프리셋
        </h2>
        <span className="text-[10px] text-slate-400 font-bold">
          총 {presets.length}개 저장됨
        </span>
      </div>

      {presets.length === 0 ? (
        <div className="w-full glass-panel p-8 text-center border-dashed border-slate-200/60 flex flex-col items-center justify-center gap-2.5">
          <div className="p-3 bg-slate-100/80 rounded-full border border-slate-200/40">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">등록된 자주 가는 경로가 없습니다.</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal max-w-[260px] mx-auto">
              경로 탐색 후 우측 상단의 <strong>별 아이콘(즐겨찾기)</strong>을 눌러 자주 타는 경로를 메인에 등록해 보세요!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
          {presets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className="w-full glass-panel p-5 relative border-l-4 border-l-accent-primary hover:bg-slate-500/5 active:scale-98 transition-all cursor-pointer flex flex-col justify-between h-28 shadow-[0_8px_30px_rgb(148,163,184,0.04)] border border-slate-200/30"
            >
              {/* 타이틀 및 삭제 버튼 */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-wrap items-center gap-1.5 max-w-[80%]">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-accent-primary border border-indigo-100/50 truncate">
                    {preset.title}
                  </span>
                  {preset.routeTitle && (
                    <span className="text-[9px] text-slate-500 font-bold bg-slate-100/80 px-2 py-0.5 rounded-full border border-slate-200/50 truncate">
                      {preset.routeTitle}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('이 경로 프리셋을 삭제하시겠습니까?')) {
                      onDeletePreset(preset.id);
                    }
                  }}
                  className="p-1 rounded-full hover:bg-slate-500/10 text-slate-400 hover:text-slate-700 transition-colors"
                  title="프리셋 삭제"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 경로 정보 */}
              <div className="flex items-center gap-1.5 text-slate-700 text-xs mt-3 font-bold">
                <span className="text-emerald-600 truncate max-w-[90px]">{preset.startLocation.name}</span>
                <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span className="text-red-500 truncate max-w-[90px]">{preset.endLocation.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
