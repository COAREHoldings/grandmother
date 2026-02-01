import { useState, useEffect } from 'react';
import { History, ChevronRight, TrendingUp, TrendingDown, Minus, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ScoreHistory {
  id: number;
  version_number?: number;
  module_scores: Record<string, any>;
  weighted_score: number;
  nih_score: number;
  probability_band: string;
  structural_cap_applied: boolean;
  model_version: string;
  created_at: string;
}

interface Props {
  projectId: string;
}

export default function VersionHistory({ projectId }: Props) {
  const [history, setHistory] = useState<ScoreHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);

  useEffect(() => {
    fetchHistory();
  }, [projectId]);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('gf_score_history')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setHistory(data);
    }
    setLoading(false);
  };

  const getScoreChange = (current: number, previous: number | undefined): { direction: 'up' | 'down' | 'same'; value: number } => {
    if (previous === undefined) return { direction: 'same', value: 0 };
    const diff = previous - current; // Lower NIH score is better
    if (Math.abs(diff) < 0.1) return { direction: 'same', value: 0 };
    return {
      direction: diff > 0 ? 'up' : 'down',
      value: Math.abs(diff),
    };
  };

  const toggleVersionSelect = (id: number) => {
    if (selectedVersions.includes(id)) {
      setSelectedVersions(selectedVersions.filter(v => v !== id));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, id]);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const ScoreChangeIcon = ({ change }: { change: { direction: string; value: number } }) => {
    if (change.direction === 'up') {
      return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    } else if (change.direction === 'down') {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Loading history...</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-indigo-600" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Version History</h3>
              <p className="text-sm text-slate-600">Track score changes over time</p>
            </div>
          </div>
          {selectedVersions.length === 2 && (
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              <Eye className="w-4 h-4 inline mr-2" />
              Compare Selected
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="p-8 text-center text-slate-500">
          <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No scoring history yet</p>
          <p className="text-sm">Run a score analysis to create your first version</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {history.map((version, idx) => {
            const prevVersion = history[idx + 1];
            const scoreChange = getScoreChange(version.nih_score, prevVersion?.nih_score);
            const isSelected = selectedVersions.includes(version.id);

            return (
              <div
                key={version.id}
                className={`p-4 hover:bg-slate-50 cursor-pointer transition-all ${
                  isSelected ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                }`}
                onClick={() => toggleVersionSelect(version.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        version.nih_score <= 3 ? 'text-emerald-600' :
                        version.nih_score <= 5 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {version.nih_score}
                      </div>
                      <div className="text-xs text-slate-500">NIH Score</div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300" />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">
                          {formatDate(version.created_at)}
                        </span>
                        {idx === 0 && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                            Latest
                          </span>
                        )}
                        {version.structural_cap_applied && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                            Cap Applied
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">
                        {version.probability_band} funding probability • {version.model_version}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {prevVersion && (
                      <div className="flex items-center gap-1">
                        <ScoreChangeIcon change={scoreChange} />
                        {scoreChange.direction !== 'same' && (
                          <span className={`text-sm font-medium ${
                            scoreChange.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {scoreChange.value.toFixed(1)}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-700">
                        Weighted: {version.weighted_score?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Module scores preview */}
                {version.module_scores && (
                  <div className="mt-3 flex gap-2">
                    {Object.entries(version.module_scores).slice(0, 8).map(([key, val]: [string, any]) => (
                      <div
                        key={key}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          val.score >= 4 ? 'bg-emerald-100 text-emerald-700' :
                          val.score >= 2.5 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}
                      >
                        M{key}: {val.score?.toFixed(1) || '?'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}