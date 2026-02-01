import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import RISExplanation from './RISExplanation';

interface ClaimDetail {
  id: string;
  claim_text: string;
  support_status: 'supported' | 'weak' | 'missing';
  best_reference?: { title: string; year: number };
  alignment_score: number;
  validation_flags: {
    peer_reviewed: boolean;
    retracted: boolean;
    preprint: boolean;
  };
}

interface SectionRIS {
  section_name: string;
  score: number;
  claims: ClaimDetail[];
}

interface RIEScore {
  project_id: string;
  overall_score: number;
  claims_total: number;
  claims_verified: number;
  claims_unverified: number;
  last_updated: string | null;
  section_breakdown: Record<string, {
    total: number;
    verified: number;
    unverified: number;
    partial: number;
    pending: number;
    avgScore: number;
  }>;
  section_ris: SectionRIS[];
  integrity_grade: { grade: string; label: string; color: string };
}

interface RIEDashboardProps {
  projectId: string;
  content?: Record<string, string>;
  strictMode?: boolean;
}

export const RIEDashboard: React.FC<RIEDashboardProps> = ({ projectId, content, strictMode = false }) => {
  const [score, setScore] = useState<RIEScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  const fetchScore = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('rie-get-score', {
        body: { project_id: projectId, include_claims: true }
      });
      if (error) throw error;
      setScore(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeContent = async () => {
    if (!content) return;
    setAnalyzing(true);
    setError(null);
    
    try {
      for (const [section, text] of Object.entries(content)) {
        if (text && text.length > 50) {
          await supabase.functions.invoke('rie-claim-extraction', {
            body: { project_id: projectId, section_type: section, content: text }
          });
        }
      }
      await supabase.functions.invoke('rie-verify-claims', { body: { project_id: projectId } });
      await fetchScore();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchScore();
  }, [projectId]);

  const isExportBlocked = strictMode && score && (score.overall_score * 100) < 50;

  if (loading && !score) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Reference Integrity Engine</h2>
        <div className="flex items-center gap-3">
          {score && score.claims_total > 0 && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('summary')}
                className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'summary' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
              >
                Summary
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'detailed' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
              >
                Detailed
              </button>
            </div>
          )}
          <button
            onClick={analyzeContent}
            disabled={analyzing || !content}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </>
            ) : (
              'Analyze Claims'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {score && score.claims_total > 0 ? (
        viewMode === 'detailed' ? (
          <RISExplanation
            overall_ris={Math.round(score.overall_score * 100)}
            section_ris={score.section_ris || []}
            strict_mode={strictMode}
            blocked_reason={isExportBlocked ? 'Low integrity score' : undefined}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-4xl font-bold mb-1" style={{ color: score.integrity_grade.color }}>
                  {score.integrity_grade.grade}
                </div>
                <div className="text-sm text-gray-600">{score.integrity_grade.label}</div>
                <div className="text-xs text-gray-400 mt-1">Score: {(score.overall_score * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{score.claims_verified}</div>
                <div className="text-sm text-gray-600">Verified</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-600">{score.claims_unverified}</div>
                <div className="text-sm text-gray-600">Unverified</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{score.claims_total}</div>
                <div className="text-sm text-gray-600">Total Claims</div>
              </div>
            </div>

            {Object.keys(score.section_breakdown).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Section Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(score.section_breakdown).map(([section, data]) => (
                    <div key={section} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium capitalize">{section.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-gray-500">{data.verified}/{data.total} verified</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${(data.avgScore || 0) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {score.last_updated && (
              <div className="mt-4 text-xs text-gray-400 text-right">
                Last updated: {new Date(score.last_updated).toLocaleString()}
              </div>
            )}
          </>
        )
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No claims analyzed yet.</p>
          <p className="text-sm mt-2">Click "Analyze Claims" to scan your grant for verifiable statements.</p>
        </div>
      )}
    </div>
  );
};

export default RIEDashboard;
