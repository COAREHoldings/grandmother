import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, GfProject } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  ChevronLeft, Loader2, Search, Target, BarChart3, 
  ExternalLink, Sparkles, CheckCircle, Info, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StudySectionResult {
  abbreviation: string;
  name: string;
  count: number;
  percentage: number;
}

interface AIRecommendation {
  abbreviation: string;
  name: string;
  confidence: number;
  rationale: string;
  isPrimary: boolean;
}

interface AnalysisResult {
  historicalData: StudySectionResult[];
  aiRecommendations: AIRecommendation[];
  similarGrants: { title: string; studySection: string; pi: string }[];
}

const STUDY_SECTION_INFO: Record<string, string> = {
  'BCMB': 'Biochemistry and Biophysics of Membranes',
  'GGG': 'Genetics of Health and Disease',
  'ZRG1': 'Center for Scientific Review Special Emphasis Panel',
  'MEDI': 'Medicinal Chemistry',
  'BMBI': 'Biomedical Imaging Technology',
  'NANO': 'Nanotechnology',
  'ACTS': 'AIDS Clinical Studies and Epidemiology',
  'BDCN': 'Brain Disorders and Clinical Neuroscience',
  'BGES': 'Behavioral Genetics and Epidemiology',
  'BINP': 'Bioinformatics and Computational Biology',
  'BMIT': 'Biomedical Imaging Technology',
  'BPNS': 'Biophysics of Neural Systems',
  'CAMP': 'Cancer Molecular Pathobiology',
  'CBSS': 'Community-Level Health Promotion',
  'CDIN': 'Cancer Drug Development and Therapeutics',
  'CDMB': 'Cellular Signaling and Regulatory Systems',
  'CHEM': 'Chemistry and Biochemistry',
  'CMAD': 'Cell and Molecular Biology',
  'CONC': 'Oncological Sciences',
  'DDK': 'Diabetes and Digestive and Kidney Diseases',
  'GCAT': 'Genomics, Computational Biology and Technology',
  'HIBP': 'Health Informatics',
  'IMST': 'Immunity and Inflammation',
  'MABS': 'Molecular and Cellular Biology',
  'MENT': 'Mental Health',
  'MFSR': 'Musculoskeletal Biology and Sports Medicine',
  'NACS': 'Neuroscience and Cognitive Sciences',
  'NCAL': 'Neurology Clinical',
  'NOIT': 'Not Identified',
  'SBIB': 'Structural Biology',
};

export default function StudySectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<GfProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [inputMode, setInputMode] = useState<'title' | 'aims' | 'full'>('title');
  const [customQuery, setCustomQuery] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);

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
      navigate('/dashboard');
      return;
    }

    setProject(data);
    setLoading(false);
  };

  const getSearchContent = (): string => {
    if (!project) return customQuery;
    
    switch (inputMode) {
      case 'title':
        return project.title || customQuery;
      case 'aims':
        const aims = project.specific_aims as Record<string, string> || {};
        return [aims.aim1_objective, aims.aim2_objective, aims.aim3_objective]
          .filter(Boolean).join('. ') || customQuery;
      case 'full':
        const concept = project.concept as Record<string, string> || {};
        const hypothesis = project.hypothesis as Record<string, string> || {};
        const approach = project.approach as Record<string, string> || {};
        return [
          project.title,
          concept.problem_statement,
          hypothesis.central_hypothesis,
          approach.overall_strategy
        ].filter(Boolean).join('. ');
      default:
        return customQuery;
    }
  };

  const analyzeStudySection = async () => {
    const searchContent = getSearchContent();
    if (!searchContent.trim()) {
      toast.error('No content to analyze. Add project details or enter custom text.');
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      // Step 1: Search NIH Reporter for similar grants
      const nihResponse = await fetch('https://api.reporter.nih.gov/v2/projects/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          criteria: {
            advanced_text_search: {
              operator: 'and',
              search_field: 'all',
              search_text: searchContent.slice(0, 500)
            },
            fiscal_years: [2023, 2024, 2025],
            limit: 50,
            offset: 0
          },
          include_fields: ['ProjectTitle', 'PiNames', 'Organization', 'StudySection']
        })
      });

      const nihData = await nihResponse.json();
      const grants = nihData.results || [];

      // Extract study sections and count frequency
      const sectionCounts: Record<string, { name: string; count: number }> = {};
      const similarGrants: { title: string; studySection: string; pi: string }[] = [];

      for (const grant of grants) {
        const section = grant.study_section;
        if (section?.srg_code) {
          const code = section.srg_code;
          const name = section.srg_name || STUDY_SECTION_INFO[code] || 'Unknown';
          
          if (!sectionCounts[code]) {
            sectionCounts[code] = { name, count: 0 };
          }
          sectionCounts[code].count++;

          if (similarGrants.length < 5) {
            similarGrants.push({
              title: grant.project_title || '',
              studySection: `${code} - ${name}`,
              pi: grant.pi_names?.[0]?.full_name || ''
            });
          }
        }
      }

      // Calculate percentages
      const total = Object.values(sectionCounts).reduce((sum, s) => sum + s.count, 0);
      const historicalData: StudySectionResult[] = Object.entries(sectionCounts)
        .map(([abbr, data]) => ({
          abbreviation: abbr,
          name: data.name,
          count: data.count,
          percentage: total > 0 ? Math.round((data.count / total) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Step 2: Get AI recommendations
      const aiRecommendations = await getAIRecommendations(searchContent, historicalData);

      setResult({
        historicalData,
        aiRecommendations,
        similarGrants
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Analysis failed. Please try again.');
    }

    setAnalyzing(false);
  };

  const getAIRecommendations = async (content: string, historicalData: StudySectionResult[]): Promise<AIRecommendation[]> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`https://dvuhtfzsvcacyrlfettz.supabase.co/functions/v1/grant-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          module: 'study_section',
          action: 'recommend',
          data: { 
            content,
            historicalSections: historicalData.map(h => h.abbreviation)
          },
          projectContext: {
            title: project?.title,
            agency: project?.target_agency,
            mechanism: project?.project_type
          }
        })
      });

      const result = await response.json();
      
      if (result.data?.recommendations) {
        return result.data.recommendations;
      }

      // Fallback recommendations based on historical data
      return historicalData.slice(0, 3).map((h, idx) => ({
        abbreviation: h.abbreviation,
        name: h.name,
        confidence: Math.max(90 - idx * 15, 50),
        rationale: `Based on ${h.count} similar funded grants (${h.percentage}% of matches)`,
        isPrimary: idx === 0
      }));

    } catch (error) {
      // Return fallback based on historical data
      return historicalData.slice(0, 3).map((h, idx) => ({
        abbreviation: h.abbreviation,
        name: h.name,
        confidence: Math.max(85 - idx * 20, 45),
        rationale: `Historical analysis: ${h.percentage}% of similar grants reviewed here`,
        isPrimary: idx === 0
      }));
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
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/projects/${id}`)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-7 h-7 text-indigo-600" />
              Study Section Finder
            </h1>
            <p className="text-slate-600">{project?.title}</p>
          </div>
        </div>

        {/* Input Options */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">Analysis Input</h3>
          
          <div className="flex gap-2 mb-4">
            {[
              { value: 'title', label: 'Project Title' },
              { value: 'aims', label: 'Specific Aims' },
              { value: 'full', label: 'Full Content' }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setInputMode(opt.value as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  inputMode === opt.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Content to analyze:
            </label>
            <textarea
              value={customQuery || getSearchContent()}
              onChange={(e) => setCustomQuery(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="Your project content will appear here, or enter custom text..."
            />
          </div>

          <button
            onClick={analyzeStudySection}
            disabled={analyzing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Find Best Study Section
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* AI Recommendations */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                AI Recommendations
              </h3>
              
              <div className="space-y-4">
                {result.aiRecommendations.map((rec, idx) => (
                  <div 
                    key={rec.abbreviation}
                    className={`p-4 rounded-xl ${
                      rec.isPrimary 
                        ? 'bg-white border-2 border-indigo-400 shadow-md' 
                        : 'bg-white/70 border border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {rec.isPrimary && (
                          <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-medium rounded-full">
                            PRIMARY
                          </span>
                        )}
                        <span className="font-bold text-lg text-slate-900">{rec.abbreviation}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <TrendingUp className={`w-4 h-4 ${rec.confidence >= 70 ? 'text-emerald-500' : 'text-amber-500'}`} />
                        <span className={`font-semibold ${rec.confidence >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {rec.confidence}% confidence
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-700 font-medium mb-2">{rec.name}</p>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{rec.rationale}</p>
                    <a
                      href={`https://public.csr.nih.gov/StudySections/IntegratedReviewGroups`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mt-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on CSR Website
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical Data */}
            {result.historicalData.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-slate-600" />
                  Historical Distribution
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Based on {result.historicalData.reduce((sum, h) => sum + h.count, 0)} similar funded grants from NIH Reporter
                </p>
                
                <div className="space-y-3">
                  {result.historicalData.map((section) => (
                    <div key={section.abbreviation} className="flex items-center gap-3">
                      <div className="w-16 text-sm font-mono font-semibold text-slate-700">
                        {section.abbreviation}
                      </div>
                      <div className="flex-1">
                        <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${section.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-sm font-semibold text-slate-700">{section.percentage}%</span>
                        <span className="text-xs text-slate-500 ml-1">({section.count})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Grants */}
            {result.similarGrants.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Similar Funded Grants
                </h3>
                
                <div className="space-y-3">
                  {result.similarGrants.map((grant, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm font-medium text-slate-800 line-clamp-2">{grant.title}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                        <span className="font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                          {grant.studySection.split(' - ')[0]}
                        </span>
                        <span>PI: {grant.pi}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Tips for Study Section Selection
              </h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• The primary recommendation is based on both historical data and AI analysis</li>
                <li>• Consider contacting the Scientific Review Officer (SRO) to discuss assignment</li>
                <li>• You can request a specific study section in your cover letter</li>
                <li>• Alternative sections may be appropriate if your research spans multiple areas</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
