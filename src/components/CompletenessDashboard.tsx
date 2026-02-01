import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, FileText, Users, DollarSign, Building, FlaskConical, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Section {
  id: string;
  name: string;
  icon: any;
  required: boolean;
  status: 'present' | 'incomplete' | 'missing';
  wordCount: number;
  pageEstimate: number;
  pageLimit?: number;
}

interface FundingRules {
  page_limit_total?: number;
  page_limit_research_strategy?: number;
  page_limit_specific_aims?: number;
  page_limit_biosketch?: number;
  font_requirements?: string;
  margin_requirements?: string;
}

interface Props {
  projectId: string;
  projectData: any;
  fundingProgram: string;
  onValidationComplete?: (isValid: boolean, issues: string[]) => void;
}

const WORDS_PER_PAGE = 300;

const DEFAULT_SECTIONS = [
  { id: 'title', name: 'Title', icon: FileText, required: true },
  { id: 'abstract', name: 'Abstract', icon: FileText, required: true },
  { id: 'specific_aims', name: 'Specific Aims', icon: FlaskConical, required: true },
  { id: 'significance', name: 'Significance', icon: BarChart3, required: true },
  { id: 'innovation', name: 'Innovation', icon: BarChart3, required: true },
  { id: 'approach', name: 'Research Strategy/Approach', icon: FlaskConical, required: true },
  { id: 'statistical_plan', name: 'Statistical Plan', icon: BarChart3, required: false },
  { id: 'team', name: 'Biosketches', icon: Users, required: true },
  { id: 'letters_support', name: 'Letters of Support', icon: FileText, required: false },
  { id: 'budget', name: 'Budget & Justification', icon: DollarSign, required: true },
  { id: 'facilities', name: 'Facilities & Equipment', icon: Building, required: true },
  { id: 'preliminary_data', name: 'Preliminary Data', icon: BarChart3, required: false },
];

export default function CompletenessDashboard({ projectId, projectData, fundingProgram, onValidationComplete }: Props) {
  const [sections, setSections] = useState<Section[]>([]);
  const [fundingRules, setFundingRules] = useState<FundingRules | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRulesAndAnalyze();
  }, [projectId, projectData, fundingProgram]);

  const fetchRulesAndAnalyze = async () => {
    // Fetch funding rules
    const { data: rules } = await supabase
      .from('gf_funding_rules')
      .select('*')
      .eq('funding_program', fundingProgram)
      .maybeSingle();
    
    setFundingRules(rules);

    // Analyze sections
    const analyzedSections = DEFAULT_SECTIONS.map(sec => {
      const content = projectData?.[sec.id];
      let wordCount = 0;
      let status: 'present' | 'incomplete' | 'missing' = 'missing';

      if (content) {
        if (typeof content === 'string') {
          wordCount = content.split(/\s+/).filter(Boolean).length;
        } else if (typeof content === 'object') {
          const text = Object.values(content).filter(v => typeof v === 'string').join(' ');
          wordCount = text.split(/\s+/).filter(Boolean).length;
        }

        if (wordCount > 50) status = 'present';
        else if (wordCount > 0) status = 'incomplete';
      }

      const pageEstimate = wordCount / WORDS_PER_PAGE;
      let pageLimit: number | undefined;

      if (sec.id === 'approach' || sec.id === 'significance' || sec.id === 'innovation') {
        pageLimit = rules?.page_limit_research_strategy;
      } else if (sec.id === 'specific_aims') {
        pageLimit = rules?.page_limit_specific_aims;
      } else if (sec.id === 'team') {
        pageLimit = rules?.page_limit_biosketch;
      }

      return { ...sec, status, wordCount, pageEstimate, pageLimit };
    });

    setSections(analyzedSections);
    setLoading(false);

    // Validation check
    const issues: string[] = [];
    analyzedSections.forEach(sec => {
      if (sec.required && sec.status === 'missing') {
        issues.push(`Missing required section: ${sec.name}`);
      }
      if (sec.pageLimit && sec.pageEstimate > sec.pageLimit) {
        issues.push(`${sec.name} exceeds page limit (${sec.pageEstimate.toFixed(1)}/${sec.pageLimit} pages)`);
      }
    });

    onValidationComplete?.(issues.length === 0, issues);
  };

  const completionPercent = Math.round(
    (sections.filter(s => s.status === 'present').length / sections.filter(s => s.required).length) * 100
  );

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'present') return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (status === 'incomplete') return <AlertCircle className="w-5 h-5 text-amber-500" />;
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  const getPageStatus = (estimate: number, limit?: number) => {
    if (!limit) return 'text-slate-600';
    const ratio = estimate / limit;
    if (ratio > 1) return 'text-red-600 font-semibold';
    if (ratio > 0.9) return 'text-amber-600 font-semibold';
    return 'text-emerald-600';
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Analyzing...</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Completeness Dashboard</h3>
        <div className="flex items-center gap-3">
          <div className="w-32 h-3 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${completionPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-slate-700">{completionPercent}%</span>
        </div>
      </div>

      {/* Formatting Requirements */}
      {fundingRules && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
          <h4 className="font-medium text-slate-800 mb-2">Formatting Requirements</h4>
          <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
            <div><span className="font-medium">Font:</span> {fundingRules.font_requirements || 'Not specified'}</div>
            <div><span className="font-medium">Margins:</span> {fundingRules.margin_requirements || 'Not specified'}</div>
            <div><span className="font-medium">Total Pages:</span> {fundingRules.page_limit_total || 'Not specified'}</div>
          </div>
        </div>
      )}

      {/* Section Checklist */}
      <div className="space-y-2">
        {sections.map((section) => (
          <div 
            key={section.id}
            className={`flex items-center gap-3 p-3 rounded-lg ${
              section.status === 'present' ? 'bg-emerald-50' : 
              section.status === 'incomplete' ? 'bg-amber-50' : 'bg-red-50'
            }`}
          >
            <StatusIcon status={section.status} />
            <section.icon className="w-4 h-4 text-slate-500" />
            <div className="flex-1">
              <span className="font-medium text-slate-800">{section.name}</span>
              {section.required && <span className="text-xs text-red-500 ml-2">*Required</span>}
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600">{section.wordCount.toLocaleString()} words</div>
              {section.pageLimit ? (
                <div className={`text-xs ${getPageStatus(section.pageEstimate, section.pageLimit)}`}>
                  {section.pageEstimate.toFixed(1)} / {section.pageLimit} pages
                  {section.pageEstimate <= section.pageLimit ? ' ✓' : ' ⚠'}
                </div>
              ) : (
                <div className="text-xs text-slate-500">~{section.pageEstimate.toFixed(1)} pages</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}