import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, Activity, TrendingUp, TrendingDown, Shield, RefreshCw, CheckCircle } from 'lucide-react';

interface AnomalyEvent {
  id: string;
  metric_name: string;
  anomaly_type: string;
  z_score: number | null;
  drift_value: number | null;
  severity: string;
  resolved: boolean;
  timestamp: string;
}

interface IntegrityLog {
  id: string;
  asi_score: number;
  cost_score: number;
  drift_score: number;
  error_score: number;
  latency_score: number;
  distribution_score: number;
  timestamp: string;
}

export default function SentinelDashboard() {
  const [asiScore, setAsiScore] = useState<number | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [history, setHistory] = useState<IntegrityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSentinelData();
  }, []);

  const fetchSentinelData = async () => {
    setLoading(true);
    try {
      // Get latest ASI
      const { data: asiData } = await supabase
        .from('integrity_index_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);
      
      if (asiData?.[0]) {
        setAsiScore(asiData[0].asi_score);
      }

      // Get ASI history (last 24 entries)
      const { data: historyData } = await supabase
        .from('integrity_index_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(24);
      
      setHistory(historyData || []);

      // Get active anomalies
      const { data: anomalyData } = await supabase
        .from('anomaly_events')
        .select('*')
        .eq('resolved', false)
        .order('timestamp', { ascending: false })
        .limit(20);
      
      setAnomalies(anomalyData || []);
    } catch (error) {
      console.error('Error fetching sentinel data:', error);
    }
    setLoading(false);
  };

  const resolveAnomaly = async (id: string) => {
    await supabase.from('anomaly_events').update({ resolved: true }).eq('id', id);
    fetchSentinelData();
  };

  const getASIColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      normal: 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[severity as keyof typeof colors] || colors.normal;
  };

  const ScoreBar = ({ label, score, color }: { label: string; score: number; color: string }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className={color}>{score?.toFixed(1) || '0'}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color.replace('text-', 'bg-')} rounded-full transition-all`}
          style={{ width: `${score || 0}%` }} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Sentinel Dashboard</h2>
            <p className="text-slate-400">System Integrity Monitoring</p>
          </div>
        </div>
        <button onClick={fetchSentinelData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ASI Score Card */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-sm">Composite Integrity Index</span>
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <div className={`text-5xl font-bold ${getASIColor(asiScore || 0)}`}>
            {asiScore?.toFixed(1) || '--'}
          </div>
          <p className="text-slate-500 text-sm mt-2">
            {(asiScore || 0) >= 80 ? 'System Healthy' : (asiScore || 0) >= 60 ? 'Attention Needed' : 'Critical Issues'}
          </p>
        </div>

        {/* Active Anomalies Card */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-sm">Active Anomalies</span>
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-5xl font-bold text-white">{anomalies.length}</div>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-red-400">{anomalies.filter(a => a.severity === 'critical').length} Critical</span>
            <span className="text-yellow-400">{anomalies.filter(a => a.severity === 'warning').length} Warning</span>
          </div>
        </div>

        {/* Trend Card */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-sm">24h Trend</span>
            {history.length >= 2 && history[0].asi_score >= history[history.length - 1].asi_score
              ? <TrendingUp className="w-5 h-5 text-green-400" />
              : <TrendingDown className="w-5 h-5 text-red-400" />}
          </div>
          <div className="flex items-end gap-1 h-16">
            {history.slice(0, 12).reverse().map((h, i) => (
              <div key={h.id} className={`flex-1 rounded-t ${getASIColor(h.asi_score).replace('text-', 'bg-')}`}
                style={{ height: `${h.asi_score}%`, opacity: 0.5 + (i * 0.04) }} />
            ))}
          </div>
        </div>
      </div>

      {/* Component Scores */}
      {history[0] && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Component Scores</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <ScoreBar label="Cost" score={history[0].cost_score} color={history[0].cost_score >= 70 ? 'text-green-400' : 'text-yellow-400'} />
            <ScoreBar label="Drift" score={history[0].drift_score} color={history[0].drift_score >= 70 ? 'text-green-400' : 'text-yellow-400'} />
            <ScoreBar label="Error" score={history[0].error_score} color={history[0].error_score >= 70 ? 'text-green-400' : 'text-yellow-400'} />
            <ScoreBar label="Latency" score={history[0].latency_score} color={history[0].latency_score >= 70 ? 'text-green-400' : 'text-yellow-400'} />
            <ScoreBar label="Distribution" score={history[0].distribution_score} color={history[0].distribution_score >= 70 ? 'text-green-400' : 'text-yellow-400'} />
          </div>
        </div>
      )}

      {/* Anomalies List */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Active Anomalies</h3>
        {anomalies.length === 0 ? (
          <div className="flex items-center gap-2 text-green-400 py-4">
            <CheckCircle className="w-5 h-5" /> No active anomalies
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map(anomaly => (
              <div key={anomaly.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <AlertTriangle className={anomaly.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'} />
                  <div>
                    <div className="font-medium text-white">{anomaly.metric_name}</div>
                    <div className="text-sm text-slate-400">
                      {anomaly.anomaly_type} • {anomaly.z_score ? `Z: ${anomaly.z_score.toFixed(2)}` : ''}
                      {anomaly.drift_value ? `Value: ${anomaly.drift_value.toFixed(4)}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded border ${getSeverityBadge(anomaly.severity)}`}>
                    {anomaly.severity}
                  </span>
                  <button onClick={() => resolveAnomaly(anomaly.id)}
                    className="text-sm text-indigo-400 hover:text-indigo-300">
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
