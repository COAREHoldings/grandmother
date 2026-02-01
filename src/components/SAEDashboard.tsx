import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Target, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp, Edit3, Check, X, FileText } from 'lucide-react';

interface Aim {
  id: string;
  aim_index: number;
  aim_text: string;
  question_type: string;
}

interface StatsInput {
  id: string;
  aim_id: string;
  endpoint_type: string;
  primary_endpoint_text: string;
  experimental_unit: string;
  alpha: number;
  power: number;
  variance_source: string;
}

interface RigorCheck {
  check_key: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

interface SAEDashboardProps {
  projectId: string;
}

const ENDPOINT_TYPES = [
  { value: 'continuous', label: 'Continuous (means)' },
  { value: 'binary', label: 'Binary (proportions)' },
  { value: 'count', label: 'Count data' },
  { value: 'tte', label: 'Time-to-event' },
  { value: 'repeated', label: 'Repeated measures' },
  { value: 'clustered', label: 'Clustered data' },
  { value: 'diagnostic', label: 'Diagnostic/classifier' },
  { value: 'omics', label: 'High-dimensional/omics' },
];

const SCORE_BANDS = {
  strong: { min: 85, color: '#22c55e', label: 'Strong' },
  adequate: { min: 70, color: '#84cc16', label: 'Adequate' },
  weak: { min: 50, color: '#eab308', label: 'Needs Work' },
  critical: { min: 0, color: '#ef4444', label: 'Critical' }
};

export const SAEDashboard: React.FC<SAEDashboardProps> = ({ projectId }) => {
  const [aims, setAims] = useState<Aim[]>([]);
  const [selectedAim, setSelectedAim] = useState<Aim | null>(null);
  const [statsInput, setStatsInput] = useState<Partial<StatsInput>>({});
  const [rigorChecks, setRigorChecks] = useState<RigorCheck[]>([]);
  const [score, setScore] = useState<{ score: number; explanation: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [parseText, setParseText] = useState('');
  const [showParser, setShowParser] = useState(true);

  useEffect(() => {
    fetchAims();
  }, [projectId]);

  const fetchAims = async () => {
    const { data } = await supabase
      .from('sae_aims')
      .select('*')
      .eq('project_id', projectId)
      .order('aim_index');
    if (data) {
      setAims(data);
      setShowParser(data.length === 0);
    }
  };

  const parseAims = async () => {
    if (!parseText.trim()) return;
    setLoading(true);
    try {
      await supabase.functions.invoke('sae-parse-aims', {
        body: { project_id: projectId, aims_text: parseText }
      });
      await fetchAims();
      setParseText('');
      setShowParser(false);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const selectAim = async (aim: Aim) => {
    setSelectedAim(aim);
    // Fetch stats input
    const { data: stats } = await supabase
      .from('sae_aim_stats_inputs')
      .select('*')
      .eq('aim_id', aim.id)
      .single();
    setStatsInput(stats || {});
    
    // Fetch rigor checks
    const { data: checks } = await supabase
      .from('sae_aim_rigor_checks')
      .select('*')
      .eq('aim_id', aim.id);
    setRigorChecks(checks || []);
    
    // Fetch score
    const { data: scoreData } = await supabase
      .from('sae_aim_scores')
      .select('*')
      .eq('aim_id', aim.id)
      .single();
    if (scoreData) {
      setScore({ score: scoreData.adequacy_score, explanation: scoreData.explanation_plain });
    } else {
      setScore(null);
    }
  };

  const saveStatsInput = async () => {
    if (!selectedAim || !statsInput.id) return;
    setLoading(true);
    await supabase
      .from('sae_aim_stats_inputs')
      .update(statsInput)
      .eq('id', statsInput.id);
    
    // Run validation
    await supabase.functions.invoke('sae-validate-rigor', {
      body: { aim_id: selectedAim.id }
    });
    
    // Compute score
    const { data } = await supabase.functions.invoke('sae-compute-score', {
      body: { aim_id: selectedAim.id }
    });
    
    if (data) setScore({ score: data.score, explanation: data.explanation });
    
    // Refresh checks
    const { data: checks } = await supabase
      .from('sae_aim_rigor_checks')
      .select('*')
      .eq('aim_id', selectedAim.id);
    setRigorChecks(checks || []);
    
    setLoading(false);
  };

  const getScoreBand = (s: number) => {
    if (s >= 85) return SCORE_BANDS.strong;
    if (s >= 70) return SCORE_BANDS.adequate;
    if (s >= 50) return SCORE_BANDS.weak;
    return SCORE_BANDS.critical;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Target className="w-6 h-6 text-indigo-600" />
          Statistical Analysis Engine
        </h2>
        {aims.length > 0 && (
          <button
            onClick={() => setShowParser(!showParser)}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            {showParser ? 'Hide Parser' : 'Add More Aims'}
          </button>
        )}
      </div>

      {/* Aim Parser */}
      {showParser && (
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <label className="block text-sm font-medium text-indigo-700 mb-2">
            Paste your Specific Aims text
          </label>
          <textarea
            value={parseText}
            onChange={(e) => setParseText(e.target.value)}
            placeholder="Paste your specific aims section here. The system will extract individual aims..."
            rows={6}
            className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={parseAims}
            disabled={loading || !parseText.trim()}
            className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Parsing...' : 'Parse Aims'}
          </button>
        </div>
      )}

      {/* Aims List */}
      {aims.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aims.map((aim) => (
            <button
              key={aim.id}
              onClick={() => selectAim(aim)}
              className={`p-4 rounded-lg border text-left transition-all ${
                selectedAim?.id === aim.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <div className="font-semibold text-gray-800">Aim {aim.aim_index}</div>
              <div className="text-sm text-gray-600 mt-1 line-clamp-2">{aim.aim_text}</div>
              <div className="text-xs text-indigo-600 mt-2 capitalize">{aim.question_type?.replace(/_/g, ' ')}</div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Aim Details */}
      {selectedAim && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <h3 className="font-bold text-lg text-gray-800">Aim {selectedAim.aim_index} - Stats Intake</h3>
            <p className="text-sm text-gray-600 mt-1">{selectedAim.aim_text}</p>
          </div>

          {/* Score Display */}
          {score && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: getScoreBand(score.score).color + '15' }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium" style={{ color: getScoreBand(score.score).color }}>
                    {getScoreBand(score.score).label}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">{score.explanation}</p>
                </div>
                <div className="text-3xl font-bold" style={{ color: getScoreBand(score.score).color }}>
                  {score.score}
                </div>
              </div>
            </div>
          )}

          {/* Stats Input Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint Type</label>
              <select
                value={statsInput.endpoint_type || 'continuous'}
                onChange={(e) => setStatsInput({ ...statsInput, endpoint_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {ENDPOINT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experimental Unit *</label>
              <input
                type="text"
                value={statsInput.experimental_unit || ''}
                onChange={(e) => setStatsInput({ ...statsInput, experimental_unit: e.target.value })}
                placeholder="e.g., subject, mouse, cell culture"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Endpoint *</label>
              <input
                type="text"
                value={statsInput.primary_endpoint_text || ''}
                onChange={(e) => setStatsInput({ ...statsInput, primary_endpoint_text: e.target.value })}
                placeholder="e.g., Change in tumor volume at 8 weeks"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alpha</label>
              <input
                type="number"
                step="0.01"
                value={statsInput.alpha || 0.05}
                onChange={(e) => setStatsInput({ ...statsInput, alpha: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Power</label>
              <input
                type="number"
                step="0.05"
                value={statsInput.power || 0.80}
                onChange={(e) => setStatsInput({ ...statsInput, power: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Variance Source</label>
              <select
                value={statsInput.variance_source || 'unknown'}
                onChange={(e) => setStatsInput({ ...statsInput, variance_source: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="unknown">Unknown</option>
                <option value="pilot">Pilot Data</option>
                <option value="literature">Literature</option>
              </select>
            </div>
          </div>

          <button
            onClick={saveStatsInput}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving & Validating...' : 'Save & Validate'}
          </button>

          {/* Rigor Checks */}
          {rigorChecks.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-800 mb-3">Rigor Validation</h4>
              <div className="space-y-2">
                {rigorChecks.map((check, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    {check.status === 'pass' && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />}
                    {check.status === 'warn' && <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />}
                    {check.status === 'fail' && <XCircle className="w-4 h-4 text-red-500 mt-0.5" />}
                    <span className={check.status === 'fail' ? 'text-red-700' : check.status === 'warn' ? 'text-yellow-700' : 'text-green-700'}>
                      {check.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {aims.length === 0 && !showParser && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No aims parsed yet. Paste your Specific Aims to get started.</p>
        </div>
      )}
    </div>
  );
};

export default SAEDashboard;
