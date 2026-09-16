import { Play, Pause, AlertOctagon } from 'lucide-react';

interface BigActionButtonsProps {
  isRunning: boolean;
  onToggleRun: () => void;
  onEmergencyStop: () => void;
  ballsLaunched: number;
}

export function BigActionButtons({
  isRunning,
  onToggleRun,
  onEmergencyStop,
  ballsLaunched,
}: BigActionButtonsProps) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        id="btn-main-run"
        onClick={onToggleRun}
        className={`flex-1 h-13 rounded-xl font-bold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer ${
          isRunning
            ? 'bg-amber-600 hover:bg-amber-500 text-zinc-950'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }`}
      >
        {isRunning ? (
          <>
            <Pause className="w-5 h-5 fill-current" />
            <span>Pause</span>
            {ballsLaunched > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-black/20 text-zinc-950 font-mono">
                {ballsLaunched} balls
              </span>
            )}
          </>
        ) : (
          <>
            <Play className="w-5 h-5 fill-current" />
            <span>Start Launcher</span>
          </>
        )}
      </button>

      <button
        type="button"
        id="btn-emergency-stop"
        onClick={onEmergencyStop}
        title="Immediate Emergency Stop"
        className="h-13 px-4 rounded-xl bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
      >
        <AlertOctagon className="w-5 h-5" />
        <span className="text-sm">E-Stop</span>
      </button>
    </div>
  );
}
