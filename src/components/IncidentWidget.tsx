import { IncidentInfo } from '@/data/mockData';

interface IncidentWidgetProps {
  incidents: IncidentInfo[];
}

export default function IncidentWidget({ incidents }: IncidentWidgetProps) {
  if (incidents.length === 0) return null;

  return (
    <div className="w-full glass-panel p-5 flex flex-col gap-4 border-l-4 border-l-amber-500">
      <h2 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        실시간 대중교통 돌발 및 운행 정보
      </h2>

      <div className="flex flex-col gap-3.5">
        {incidents.map((inc) => {
          // 중요도 레벨에 따른 스타일 매핑
          const isNormal = inc.level === 'normal';
          const isWarning = inc.level === 'warning';
          const isEmergency = inc.level === 'emergency';

          let borderClass = 'border-emerald-100 bg-emerald-50/20';
          let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          let dotColor = 'bg-emerald-500';
          let titleColor = 'text-slate-800';

          if (isWarning) {
            borderClass = 'border-amber-200 bg-amber-50/40';
            badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
            dotColor = 'bg-amber-500';
            titleColor = 'text-amber-900';
          } else if (isEmergency) {
            borderClass = 'border-red-200 bg-red-50/40';
            badgeClass = 'bg-red-50 text-red-700 border-red-200';
            dotColor = 'bg-red-500 animate-ping';
            titleColor = 'text-red-900';
          }

          return (
            <div
              key={inc.id}
              className={`p-3.5 rounded-xl border flex flex-col gap-2 ${borderClass} transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* 깜빡이는 도트 */}
                  <span className="relative flex h-2 w-2">
                    {isEmergency && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
                  </span>
                  <span className={`text-xs font-semibold ${badgeClass} border px-2 py-0.5 rounded-full`}>
                    {inc.transitName}
                  </span>
                  <h3 className={`text-sm font-bold ${titleColor}`}>{inc.title}</h3>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">{inc.updatedAt}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-4">{inc.description}</p>
              {inc.sourceName && inc.sourceUrl && (
                <div className="pl-4 mt-1 flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-medium">출처:</span>
                  <a
                    href={inc.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-600 hover:text-blue-500 hover:underline inline-flex items-center gap-0.5"
                  >
                    {inc.sourceName}
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
