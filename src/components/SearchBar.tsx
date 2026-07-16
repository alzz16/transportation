'use client';

import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const router = useRouter();

  return (
    <div className="w-full mb-6">
      <button
        onClick={() => router.push('/search')}
        className="w-full flex items-center justify-between px-5 py-4 rounded-[20px] glass-panel text-slate-500 hover:text-slate-700 hover:bg-slate-500/5 active:scale-99 transition-all text-left shadow-[0_8px_30px_rgb(148,163,184,0.06)] border border-slate-200/40"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm font-semibold tracking-wide">
            어디로 이동하시나요? (출발/도착 검색)
          </span>
        </div>
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
