import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, GfProject } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  Play, 
  ChevronLeft, 
  Loader2,
  User,
  Star,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Review {
  reviewer: string;
  role: string;
  overall_score: number;
  criterion_scores: {
    significance: number;
    investigator: number;
    innovation: number;
    approach: number;
    environment: number;
  };
  strengths: string[];
  weaknesses: string[];
  detailed_critique: string;
  recommendations: string[];
  funding_recommendation: string;
}

interface ReviewResult {
  reviews: Review[];
  consensus: {
    score: number;
    percentile: number;
    fundingProbability: number;
    recommendation: string;
  };
  summary: {
    commonStrengths: string[];
    commonWeaknesses: string[];
    priorityRecommendations: string[];
  };
}

export default function ReviewSimulationPage() {
  const { id } = useParams();
  const [project, setProject] = useState<GfProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from('gf_projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      toast.error('Project not found');
      return;
    }

    setProject(data);
    if (data.review_simulation && Object.keys(data.review_simulation).length > 0) {
      setResult(data.review_simulation as ReviewResult);
    }
    setLoading(false);
  };

  const runSimulation = async () => {
    if (!project) return;
    setSimulating(true);

    try {
      const { data, error } = await supabase.functions.invoke('review-simulation', {
        body: { project }
      });

      if (error) throw error;

      if (data?.data) {
        setResult(data.data);
        
        await supabase
          .from('gf_projects')
          .update({ review_simulation: data.data })
          .eq('id', project.id);
        
        toast.success('Review simulation complete!');
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Simulation failed');
    }

    setSimulating(false);
  };

  const getScoreColor = (score: number) => {
    if (score <= 2) return 'text-green-600 bg-green-50';
    if (score <= 4) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score: number) => {
    if (score <= 1) return 'Exceptional';
    if (score <= 2) return 'Outstanding';
    if (score <= 3) return 'Excellent';
    if (score <= 4) return 'Very Good';
    if (score <= 5) return 'Good';
    if (score <= 6) return 'Satisfactory';
    if (score <= 7) return 'Fair';
    if (score <= 8) return 'Marginal';
    return 'Poor';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to={`/projects/${id}/edit`}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Editor
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Review Simulation</h1>
            <p className="text-slate-600">{project?.title || 'Untitled Project'}</p>
          </div>
          <button
            onClick={runSimulation}
            disabled={simulating}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {simulating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            {result ? 'Run Again' : 'Start Simulation'}
          </button>
        </div>

        {!result && !simulating && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to Simulate</h3>
            <p className="text-slate-600 max-w-md mx-auto mb-6">
              Three AI reviewers will evaluate your grant using NIH criteria: 
              The Methodologist, The Champion, and The Cynic.
            </p>
          </div>
        )}

        {simulating && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Loader2 className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Simulating Review</h3>
            <p className="text-slate-600">Our AI reviewers are evaluating your grant...</p>
          </div>
        )}

        {result && !simulating && (
          <>
            {/* Consensus Score Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-8 text-white mb-8">
              <div className="grid sm:grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-indigo-200 text-sm mb-1">Consensus Score</p>
                  <p className="text-5xl font-bold">{result.consensus.score}</p>
                  <p className="text-indigo-200 mt-1">{getScoreLabel(result.consensus.score)}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-sm mb-1">Percentile</p>
                  <p className="text-5xl font-bold">{result.consensus.percentile}%</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-sm mb-1">Funding Probability</p>
                  <p className="text-5xl font-bold">{result.consensus.fundingProbability}%</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-sm mb-1">Recommendation</p>
                  <p className="text-lg font-semibold mt-2">{result.consensus.recommendation}</p>
                </div>
              </div>
            </div>

            {/* Summary Section */}
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-slate-900">Common Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {result.summary.commonStrengths.map((s, i) => (
                    <li key={i} className="text-sm text-slate-600 pl-4 border-l-2 border-green-200">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-slate-900">Common Weaknesses</h3>
                </div>
                <ul className="space-y-2">
                  {result.summary.commonWeaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-slate-600 pl-4 border-l-2 border-amber-200">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Individual Reviews */}
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Individual Reviews</h3>
            <div className="space-y-6">
              {result.reviews.map((review, index) => (
                <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{review.reviewer}</h4>
                      <p className="text-sm text-slate-500">{review.role}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg ${getScoreColor(review.overall_score)}`}>
                      <span className="text-2xl font-bold">{review.overall_score}</span>
                      <span className="text-sm ml-1">/ 9</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-5 gap-4 mb-6">
                      {Object.entries(review.criterion_scores).map(([key, score]) => (
                        <div key={key} className="text-center">
                          <p className="text-xs text-slate-500 capitalize mb-1">{key}</p>
                          <p className={`text-lg font-semibold ${
                            score <= 3 ? 'text-green-600' : score <= 5 ? 'text-amber-600' : 'text-red-600'
                          }`}>{score}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h5 className="text-sm font-medium text-slate-900 mb-2">Strengths</h5>
                        <ul className="space-y-1">
                          {review.strengths.slice(0, 3).map((s, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-green-500 mt-1">+</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-slate-900 mb-2">Weaknesses</h5>
                        <ul className="space-y-1">
                          {review.weaknesses.slice(0, 3).map((w, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-red-500 mt-1">-</span> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <h5 className="text-sm font-medium text-slate-900 mb-2">Detailed Critique</h5>
                      <p className="text-sm text-slate-600">{review.detailed_critique}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Priority Recommendations */}
            <div className="mt-8 bg-indigo-50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-900">Priority Recommendations</h3>
              </div>
              <ol className="list-decimal list-inside space-y-2">
                {result.summary.priorityRecommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-slate-700">{rec}</li>
                ))}
              </ol>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
