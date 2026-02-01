import { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface ModuleStatus {
  module_number: number;
  module_name: string;
  status: 'present' | 'missing' | 'incomplete';
  sources: { section: string; status: string }[];
}

interface ParseResult {
  sections: Record<string, { status: string; content: string }>;
  moduleStatus: ModuleStatus[];
  completionPercent: number;
  wordCount: number;
}

interface ScoreResult {
  nihScores: {
    significance: number;
    innovation: number;
    approach: number;
    investigator: number;
    environment: number;
  };
  impactScore: number;
  fundingProbability: string;
  moduleStrength: Record<number, { presence: number; clarity: number; sufficiency: number; strength: number; deficient: boolean }>;
  deficientModules: number[];
  recommendations: string[];
}

interface Props {
  projectId: string;
  onParseComplete?: (result: ParseResult) => void;
  onScoreComplete?: (result: ScoreResult) => void;
}

export default function ModuleDashboard({ projectId, onParseComplete, onScoreComplete }: Props) {
  const [parsing, setParsing] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      toast.error('Please upload PDF, DOCX, or TXT files');
      return;
    }

    setParsing(true);
    try {
      const text = await file.text();
      
      const { data, error } = await supabase.functions.invoke('gf-parse-document', {
        body: { content: text, filename: file.name }
      });

      if (error) throw error;
      
      setParseResult(data);
      onParseComplete?.(data);
      toast.success('Document parsed successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse document');
    } finally {
      setParsing(false);
    }
  };

  const handleScore = async () => {
    if (!parseResult) {
      toast.error('Please upload a document first');
      return;
    }

    setScoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('gf-score-grant', {
        body: { sections: parseResult.sections, moduleStatus: parseResult.moduleStatus }
      });

      if (error) throw error;
      
      setScoreResult(data);
      onScoreComplete?.(data);
      toast.success('Scoring complete');
    } catch (err: any) {
      toast.error(err.message || 'Failed to score document');
    } finally {
      setScoring(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'present') return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (status === 'incomplete') return <AlertCircle className="w-5 h-5 text-amber-500" />;
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  const getScoreColor = (score: number) => {
    if (score <= 3) return 'text-emerald-600 bg-emerald-50';
    if (score <= 5) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getProbabilityColor = (prob: string) => {
    if (prob === 'High') return 'bg-emerald-100 text-emerald-700';
    if (prob === 'Moderate') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-white'
        }`}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <p className="text-slate-600 mb-2">Drag & drop your grant document</p>
        <p className="text-sm text-slate-500 mb-4">Supports PDF, DOCX, TXT</p>
        <label className="inline-block">
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />
          <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700">
            {parsing ? <Loader2 className="w-5 h-5 animate-spin inline" /> : 'Browse Files'}
          </span>
        </label>
      </div>

      {/* Completeness Dashboard */}
      {parseResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Eight Module Framework</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">{parseResult.wordCount.toLocaleString()} words</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${parseResult.completionPercent}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-700">{parseResult.completionPercent}%</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {parseResult.moduleStatus.map((mod) => (
              <div key={mod.module_number} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <StatusIcon status={mod.status} />
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{mod.module_number}. {mod.module_name}</p>
                  <p className="text-xs text-slate-500 capitalize">{mod.status}</p>
                </div>
                {scoreResult?.moduleStrength[mod.module_number] && (
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    scoreResult.moduleStrength[mod.module_number].deficient 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {scoreResult.moduleStrength[mod.module_number].strength}/5
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleScore}
            disabled={scoring}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {scoring ? <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> : null}
            {scoring ? 'Scoring...' : 'Run NIH Scoring Analysis'}
          </button>
        </div>
      )}

      {/* Scoring Results */}
      {scoreResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">NIH Scoring Results</h3>
          
          {/* Impact Score */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-6">
            <div>
              <p className="text-sm text-slate-600">Estimated Impact Score</p>
              <p className="text-3xl font-bold text-slate-900">{scoreResult.impactScore}</p>
            </div>
            <span className={`px-4 py-2 rounded-full font-semibold ${getProbabilityColor(scoreResult.fundingProbability)}`}>
              {scoreResult.fundingProbability} Probability
            </span>
          </div>

          {/* Criterion Scores */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            {Object.entries(scoreResult.nihScores).map(([key, value]) => (
              <div key={key} className={`p-3 rounded-lg text-center ${getScoreColor(value)}`}>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs capitalize">{key}</p>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {scoreResult.recommendations.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <h4 className="font-medium text-slate-800 mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {scoreResult.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}