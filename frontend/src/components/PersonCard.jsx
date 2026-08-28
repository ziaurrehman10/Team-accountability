import { useNavigate } from 'react-router-dom';
import { Card, ProgressBar, progressColor, ActivityBadge } from './ui';

export default function PersonCard({ person }) {
  const navigate = useNavigate();

  return (
    <Card
      className="p-5 cursor-pointer hover:shadow-md hover:border-brand-200 transition-all"
      onClickCapture={() => navigate(`/person/${person.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{person.display_name}</div>
        </div>
        <ActivityBadge status={person.activity_status} />
      </div>

      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-800">{person.overall_progress}%</span>
        <span className="text-xs text-slate-400">overall progress</span>
      </div>
      <ProgressBar value={person.overall_progress} colorClass={progressColor(person.overall_progress)} />

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-emerald-600 font-bold">{person.completed}</div>
          <div className="text-[11px] text-slate-400">✓ Completed</div>
        </div>
        <div>
          <div className="text-amber-600 font-bold">{person.in_progress}</div>
          <div className="text-[11px] text-slate-400">● Working</div>
        </div>
        <div>
          <div className="text-slate-500 font-bold">{person.not_started}</div>
          <div className="text-[11px] text-slate-400">○ Remaining</div>
        </div>
      </div>

      {person.current_task && (
        <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 truncate">
          Currently: <span className="text-slate-700 font-medium">{person.current_task}</span>
        </div>
      )}
    </Card>
  );
}
