export default function SkeletonLoader() {
  return (
    <div className="w-full flex flex-col gap-6 animate-pulse">
      {/* 요약 카드 스켈레톤 */}
      <div className="w-full glass-panel p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="h-7 w-24 bg-slate-800 rounded"></div>
          <div className="h-6 w-20 bg-slate-800 rounded-full"></div>
        </div>
        <div className="h-5 w-40 bg-slate-800 rounded"></div>
        <div className="w-full h-4 bg-slate-800 rounded mt-2"></div>
      </div>

      {/* 실시간 특이사항 스켈레톤 */}
      <div className="w-full glass-panel p-5 flex flex-col gap-3">
        <div className="h-4 w-36 bg-slate-800 rounded"></div>
        <div className="flex gap-3 items-center mt-1">
          <div className="w-4 h-4 rounded-full bg-slate-800"></div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 w-3/4 bg-slate-800 rounded"></div>
            <div className="h-3 w-1/2 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>

      {/* 타임라인 노선도 스켈레톤 */}
      <div className="w-full glass-panel p-6 flex flex-col gap-8">
        <div className="h-4 w-28 bg-slate-800 rounded"></div>
        
        {/* 단계별 스켈레톤 */}
        <div className="flex gap-4 items-start relative">
          <div className="w-4 h-4 rounded-full bg-slate-800 mt-1"></div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 w-32 bg-slate-800 rounded"></div>
            <div className="h-3 w-20 bg-slate-800 rounded"></div>
          </div>
        </div>

        <div className="flex gap-4 items-start relative">
          <div className="w-4 h-4 rounded-full bg-slate-800 mt-1"></div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 w-48 bg-slate-800 rounded"></div>
            <div className="h-3 w-40 bg-slate-800 rounded"></div>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="w-4 h-4 rounded-full bg-slate-800 mt-1"></div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 w-28 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
