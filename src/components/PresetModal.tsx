import { useState } from 'react';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
  defaultTitle: string;
}

export default function PresetModal({ isOpen, onClose, onSave, defaultTitle }: PresetModalProps) {
  const [title, setTitle] = useState(defaultTitle);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
      <div className="w-full max-w-sm glass-panel p-6 shadow-2xl border border-slate-700/60 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
        <div>
          <h3 className="text-base font-bold text-slate-100 mb-1">자주 이용하는 경로 저장</h3>
          <p className="text-xs text-slate-400">
            이 경로를 메인 화면에서 원클릭으로 조회할 수 있도록 프리셋 별칭을 지정하세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold">프리셋 이름</label>
            <input
              type="text"
              placeholder="예: 출퇴근길, 통학로"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg glass-input text-sm"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-2.5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg glass-panel hover:bg-white/10 active:scale-97 text-slate-300 text-sm font-semibold transition-all border border-slate-700/60"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-97 text-white text-sm font-semibold transition-all shadow-md disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              저장 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
