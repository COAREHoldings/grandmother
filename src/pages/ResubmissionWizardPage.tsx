import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, Project } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  ChevronLeft, 
  Upload, 
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Critique {
  id: string;
  severity: 'major' | 'minor';
  section: string;
  concern: string;
  quote: string;
}

interface ParsedData {
  score: number | null;
  critiques: Critique[];
  overallStrengths: string[];
  overallWeaknesses: string[];
}

interface Response {
  critiqueId: string;
  response: string;
  changes: string[];
  newText: string;
}

export default function ResubmissionWizardPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'upload' | 'review' | 'respond' | 'intro'>('upload');
  const [summaryStatement, setSummaryStatement] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [generatingResponses, setGeneratingResponses] = useState(false);
  const [introduction, setIntroduction] = useState('');
  const [generatingIntro, setGeneratingIntro] = useState(false);

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from('gf_projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      setProject(data);
    }
    setLoading(false);
  };

  const parseCritiques = async () => {
    if (!summaryStatement.trim()) {
      toast.error('Please paste your summary statement');
      return;
    }

    setParsing(true);

    try {
      const { data, error } = await supabase.functions.invoke('resubmission-wizard', {
        body: {
          action: 'parse_critiques',
          summaryStatement
        }
      });

      if (error) throw error;

      if (data?.data) {
        setParsedData(data.data);
        setStep('review');
        toast.success('Critiques parsed successfully!');
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to parse critiques');
    }

    setParsing(false);
  };

  const generateResponses = async () => {
    if (!parsedData) return;
    setGeneratingResponses(true);

    try {
      const { data, error } = await supabase.functions.invoke('resubmission-wizard', {
        body: {
          action: 'generate_responses',
          project,
          critiques: parsedData.critiques
        }
      });

      if (error) throw error;

      if (data?.data?.responses) {
        setResponses(data.data.responses);
        setStep('respond');
        toast.success('Responses generated!');
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to generate responses');
    }

    setGeneratingResponses(false);
  };

  const generateIntroduction = async () => {
    setGeneratingIntro(true);

    try {
      const { data, error } = await supabase.functions.invoke('resubmission-wizard', {
        body: {
          action: 'generate_introduction',
          project: {
            ...project,
            originalScore: parsedData?.score
          },
          critiques: responses.map((r, i) => ({
            ...parsedData?.critiques[i],
            response: r.response,
            changes: r.changes
          }))
        }
      });

      if (error) throw error;

      if (data?.data?.introduction) {
        setIntroduction(data.data.introduction);
        setStep('intro');
        toast.success('Introduction generated!');
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to generate introduction');
    }

    setGeneratingIntro(false);
  };

  const saveToDatabase = async () => {
    if (!project || !parsedData) return;

    const { error } = await supabase.from('resubmissions').insert({
      project_id: project.id,
      original_score: parsedData.score,
      summary_statement_text: summaryStatement,
      extracted_critiques: parsedData.critiques,
      suggested_responses: responses,
      introduction_draft: introduction
    });

    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success('Resubmission data saved!');
    }
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to={`/projects/${id}/edit`}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Project
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Resubmission Wizard</h1>
          <p className="text-slate-600">{project?.title || 'Untitled Project'}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {['upload', 'review', 'respond', 'intro'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                step === s 
                  ? 'bg-indigo-600 text-white' 
                  : ['upload', 'review', 'respond', 'intro'].indexOf(step) > i 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-500'
              }`}>
                {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
              {i < 3 && <ArrowRight className="w-4 h-4 text-slate-300 mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Paste Summary Statement
            </h2>
            <p className="text-slate-600 mb-4">
              Paste your NIH Summary Statement below. Our AI will extract all reviewer critiques.
            </p>
            <textarea
              value={summaryStatement}
              onChange={(e) => setSummaryStatement(e.target.value)}
              placeholder="Paste your summary statement here..."
              rows={12}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-4"
            />
            <button
              onClick={parseCritiques}
              disabled={parsing || !summaryStatement.trim()}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {parsing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              Parse Critiques
            </button>
          </div>
        )}

        {/* Step 2: Review Critiques */}
        {step === 'review' && parsedData && (
          <div>
            {parsedData.score && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="text-amber-800">
                  Original Score: <strong>{parsedData.score}</strong>
                </p>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Extracted Critiques ({parsedData.critiques.length})
              </h2>
              <div className="space-y-4">
                {parsedData.critiques.map((critique, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border ${
                      critique.severity === 'major' 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-amber-200 bg-amber-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        critique.severity === 'major' 
                          ? 'bg-red-200 text-red-800' 
                          : 'bg-amber-200 text-amber-800'
                      }`}>
                        {critique.severity.toUpperCase()}
                      </span>
                      <span className="text-sm text-slate-600">{critique.section}</span>
                    </div>
                    <p className="text-sm text-slate-800">{critique.concern}</p>
                    {critique.quote && (
                      <p className="text-xs text-slate-500 mt-2 italic">"{critique.quote}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={generateResponses}
              disabled={generatingResponses}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generatingResponses ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              Generate Responses
            </button>
          </div>
        )}

        {/* Step 3: Review & Edit Responses */}
        {step === 'respond' && (
          <div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Response Drafts
              </h2>
              <p className="text-slate-600 mb-6">
                Review and edit the AI-generated responses below.
              </p>
              <div className="space-y-6">
                {responses.map((response, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-2">
                      Critique {i + 1}: {parsedData?.critiques[i]?.concern.slice(0, 80)}...
                    </h4>
                    <textarea
                      value={response.response}
                      onChange={(e) => {
                        const newResponses = [...responses];
                        newResponses[i] = { ...newResponses[i], response: e.target.value };
                        setResponses(newResponses);
                      }}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mb-2"
                    />
                    {response.changes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Changes made:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600">
                          {response.changes.map((change, j) => (
                            <li key={j}>{change}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={generateIntroduction}
              disabled={generatingIntro}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generatingIntro ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
              Generate Introduction to Resubmission
            </button>
          </div>
        )}

        {/* Step 4: Introduction */}
        {step === 'intro' && (
          <div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Introduction to Resubmission
              </h2>
              <textarea
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                rows={16}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 mb-4"
              />
              <p className="text-sm text-slate-500">
                This section should be 1 page or less and summarize your responses to reviewer critiques.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={saveToDatabase}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Save Resubmission
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(introduction);
                  toast.success('Copied to clipboard!');
                }}
                className="flex-1 bg-slate-600 text-white py-3 rounded-xl font-semibold hover:bg-slate-700 transition-all"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
