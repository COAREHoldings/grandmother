import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, Project } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  ChevronLeft, 
  Loader2,
  BookOpen,
  FileText,
  Sparkles,
  Copy,
  Download,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ManuscriptData {
  abstract?: string;
  introduction?: string;
  methods?: string;
  results?: string;
  discussion?: string;
  wordCounts?: Record<string, number>;
  totalWordCount?: number;
  suggestedJournals?: Array<{
    name: string;
    impactFactor: number;
    scope: string;
    fitScore: number;
    rationale: string;
  }>;
}

const sections = [
  { id: 'abstract', label: 'Abstract', maxWords: 300 },
  { id: 'introduction', label: 'Introduction', maxWords: 1500 },
  { id: 'methods', label: 'Methods', maxWords: 2500 },
  { id: 'results', label: 'Results', maxWords: 2000 },
  { id: 'discussion', label: 'Discussion', maxWords: 2000 },
];

export default function ManuscriptPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('abstract');
  const [manuscript, setManuscript] = useState<ManuscriptData>({});
  const [generating, setGenerating] = useState(false);
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [suggestingJournals, setSuggestingJournals] = useState(false);

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      setProject(data);
    }
    setLoading(false);
  };

  const generateFullManuscript = async () => {
    if (!project) return;
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('manuscript-convert', {
        body: {
          action: 'full_conversion',
          project
        }
      });

      if (error) throw error;

      if (data?.data) {
        setManuscript(data.data);
        toast.success('Manuscript generated!');
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to generate manuscript');
    }

    setGenerating(false);
  };

  const generateSection = async (section: string) => {
    if (!project) return;
    setGeneratingSection(section);

    try {
      const { data, error } = await supabase.functions.invoke('manuscript-convert', {
        body: {
          action: 'convert_section',
          project,
          section,
          targetJournals: manuscript.suggestedJournals?.map(j => j.name) || []
        }
      });

      if (error) throw error;

      if (data?.data?.content) {
        setManuscript(prev => ({
          ...prev,
          [section]: data.data.content,
          wordCounts: {
            ...prev.wordCounts,
            [section]: data.data.wordCount
          }
        }));
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} generated!`);
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to generate section');
    }

    setGeneratingSection(null);
  };

  const suggestJournals = async () => {
    if (!project) return;
    setSuggestingJournals(true);

    try {
      const { data, error } = await supabase.functions.invoke('manuscript-convert', {
        body: {
          action: 'suggest_journals',
          project
        }
      });

      if (error) throw error;

      if (data?.data?.suggestedJournals) {
        setManuscript(prev => ({
          ...prev,
          suggestedJournals: data.data.suggestedJournals
        }));
        toast.success('Journal suggestions ready!');
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to suggest journals');
    }

    setSuggestingJournals(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadManuscript = () => {
    const content = sections
      .map(s => `## ${s.label}\n\n${manuscript[s.id as keyof ManuscriptData] || '(Not generated)'}\n`)
      .join('\n');
    
    const blob = new Blob([`# ${project?.title || 'Manuscript'}\n\n${content}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.title?.replace(/\s+/g, '_') || 'manuscript'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded!');
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
        <Link
          to={`/projects/${id}/edit`}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Project
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Grant to Manuscript</h1>
            <p className="text-slate-600">{project?.title || 'Untitled Project'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={suggestJournals}
              disabled={suggestingJournals}
              className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              {suggestingJournals ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BookOpen className="w-4 h-4" />
              )}
              Suggest Journals
            </button>
            <button
              onClick={generateFullManuscript}
              disabled={generating}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate Full Manuscript
            </button>
          </div>
        </div>

        {/* Journal Suggestions */}
        {manuscript.suggestedJournals && manuscript.suggestedJournals.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h3 className="font-semibold text-slate-900 mb-4">Suggested Journals</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {manuscript.suggestedJournals.map((journal, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900">{journal.name}</h4>
                  <p className="text-sm text-slate-500">IF: {journal.impactFactor}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-slate-600">Fit Score:</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full">
                      <div 
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${journal.fitScore * 10}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{journal.fitScore}/10</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{journal.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Section Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-4">Sections</h3>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const hasContent = !!manuscript[section.id as keyof ManuscriptData];
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                        activeSection === section.id
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{section.label}</span>
                      {hasContent && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </button>
                  );
                })}
              </nav>

              {Object.keys(manuscript).length > 0 && (
                <button
                  onClick={downloadManuscript}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download All
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {sections.find(s => s.id === activeSection)?.label}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Max {sections.find(s => s.id === activeSection)?.maxWords} words
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => generateSection(activeSection)}
                    disabled={generatingSection === activeSection}
                    className="flex items-center gap-2 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-purple-700 transition-all disabled:opacity-50"
                  >
                    {generatingSection === activeSection ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Generate
                  </button>
                  {manuscript[activeSection as keyof ManuscriptData] && (
                    <button
                      onClick={() => copyToClipboard(manuscript[activeSection as keyof ManuscriptData] as string)}
                      className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-200 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={(manuscript[activeSection as keyof ManuscriptData] as string) || ''}
                onChange={(e) => setManuscript(prev => ({
                  ...prev,
                  [activeSection]: e.target.value
                }))}
                placeholder={`${sections.find(s => s.id === activeSection)?.label} content will appear here after generation...`}
                rows={16}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />

              {manuscript.wordCounts?.[activeSection] && (
                <p className="text-sm text-slate-500 mt-2">
                  Word count: {manuscript.wordCounts[activeSection]}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
