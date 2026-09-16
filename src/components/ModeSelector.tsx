import { LauncherMode } from '../types.ts';
import { RotateCw, RotateCcw, Minus } from 'lucide-react';

interface ModeSelectorProps {
  activeMode: LauncherMode;
  onSelectMode: (mode: LauncherMode) => void;
  disabled?: boolean;
}

export function ModeSelector({ activeMode, onSelectMode, disabled = false }: ModeSelectorProps) {
  const items: {
    id: LauncherMode;
    label: string;
    icon: typeof RotateCw;
  }[] = [
    {
      id: 'topspin',
      label: 'Topspin',
      icon: RotateCw,
    },
    {
      id: 'backspin',
      label: 'Backspin',
      icon: RotateCcw,
    },
    {
      id: 'counter',
      label: 'Flat (No Spin)',
      icon: Minus,
    },
  ];

  return (
    <div className="bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800/80 flex gap-1">
      {items.map((item) => {
        const selected = activeMode === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            id={`mode-btn-${item.id}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelectMode(item.id)}
            className={`flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all select-none cursor-pointer ${
              selected
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Icon className={`w-4 h-4 ${selected ? 'text-orange-400' : 'text-zinc-500'}`} />
            <span className="whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
