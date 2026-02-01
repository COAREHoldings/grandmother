import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Project, NIH_SALARY_CAP } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  Lightbulb, 
  Target, 
  FlaskConical,
  Users,
  Route,
  DollarSign,
  Database,
  Image,
  Play,
  Loader2,
  Save,
  Sparkles,
  ChevronLeft,
  AlertCircle,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

const modules = [
  { id: 'concept', label: 'Concept', icon: Lightbulb, description: 'Research concept and significance' },
  { id: 'hypothesis', label: 'Hypothesis', icon: Target, description: 'Central hypothesis development' },
  { id: 'specific_aims', label: 'Specific Aims', icon: FlaskConical, description: 'Aims and objectives' },
  { id: 'team', label: 'Team', icon: Users, description: 'Key personnel and expertise' },
  { id: 'approach', label: 'Approach', icon: Route, description: 'Research strategy and methods' },
  { id: 'budget', label: 'Budget Director', icon: DollarSign, description: 'Multi-year budget planning' },
  { id: 'preliminary_data', label: 'Preliminary Data', icon: Database, description: 'Supporting data' },
  { id: 'summary_figure', label: 'Summary Figure', icon: Image, description: 'Visual summary' },
];

export default function ProjectEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [activeModule, setActiveModule] = useState('concept');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [moduleData, setModuleData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      toast.error('Project not found');
      navigate('/dashboard');
      return;
    }

    setProject(data);
    setModuleData(data[activeModule as keyof Project] as Record<string, unknown> || {});
    setLoading(false);
  };

  useEffect(() => {
    if (project) {
      setModuleData(project[activeModule as keyof Project] as Record<string, unknown> || {});
    }
  }, [activeModule, project]);

  const saveModule = async () => {
    if (!project) return;
    setSaving(true);

    const { error } = await supabase
      .from('projects')
      .update({
        [activeModule]: moduleData,
        updated_at: new Date().toISOString()
      })
      .eq('id', project.id);

    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success('Saved successfully');
      setProject({ ...project, [activeModule]: moduleData });
    }
    setSaving(false);
  };

  const generateWithAI = async () => {
    if (!project) return;
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('grant-ai', {
        body: {
          module: activeModule,
          action: 'generate',
          data: moduleData,
          projectContext: {
            title: project.title,
            agency: project.target_agency,
            mechanism: project.project_type,
            foa: project.target_foa
          }
        }
      });

      if (error) throw error;

      if (data?.data) {
        setModuleData(prev => ({
          ...prev,
          content: data.data.content,
          suggestions: data.data.suggestions,
          aiGenerated: true
        }));
        toast.success('AI content generated!');
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'AI generation failed');
    }

    setGenerating(false);
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
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-3"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h2 className="font-semibold text-slate-900 truncate">{project?.title || 'Untitled'}</h2>
            <p className="text-sm text-slate-500">{project?.target_agency} {project?.project_type}</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-2">
            {modules.map((module) => {
              const hasContent = project?.[module.id as keyof Project] && 
                Object.keys(project[module.id as keyof Project] as object || {}).length > 0;
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all mb-1 ${
                    activeModule === module.id
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <module.icon className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{module.label}</p>
                  </div>
                  {hasContent && (
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 space-y-2">
            <button
              onClick={() => navigate(`/projects/${id}/review`)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-all"
            >
              <Play className="w-5 h-5" />
              Run Review Simulation
            </button>
            <button
              onClick={() => navigate(`/resubmission/${id}`)}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              Resubmission Wizard
            </button>
            <button
              onClick={() => navigate(`/manuscript/${id}`)}
              className="w-full flex items-center justify-center gap-2 bg-slate-600 text-white py-3 rounded-lg hover:bg-slate-700 transition-all"
            >
              <BookOpen className="w-5 h-5" />
              Convert to Manuscript
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {modules.find(m => m.id === activeModule)?.label}
                </h1>
                <p className="text-slate-600">
                  {modules.find(m => m.id === activeModule)?.description}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={generateWithAI}
                  disabled={generating}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Generate with AI
                </button>
                <button
                  onClick={saveModule}
                  disabled={saving}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>
              </div>
            </div>

            <ModuleEditor
              module={activeModule}
              data={moduleData}
              onChange={setModuleData}
              project={project}
            />
          </div>
        </main>
      </div>
    </Layout>
  );
}

interface ModuleEditorProps {
  module: string;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  project: Project | null;
}

function ModuleEditor({ module, data, onChange, project }: ModuleEditorProps) {
  const updateField = (field: string, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  const renderTextArea = (field: string, label: string, placeholder: string, rows = 4) => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <textarea
        value={(data[field] as string) || ''}
        onChange={(e) => updateField(field, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
      />
    </div>
  );

  const renderInput = (field: string, label: string, placeholder: string, type = 'text') => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <input
        type={type}
        value={(data[field] as string) || ''}
        onChange={(e) => updateField(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );

  switch (module) {
    case 'concept':
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {renderTextArea('gap_statement', 'Knowledge Gap Statement', 'Describe the gap in current knowledge your research addresses...')}
          {renderTextArea('clinical_burden', 'Clinical/Scientific Burden', 'Describe the clinical burden or scientific importance...')}
          {renderTextArea('innovation', 'Innovation', 'What makes your approach innovative?')}
          {renderTextArea('long_term_goal', 'Long-term Goal', 'What is the long-term goal of this research program?')}
          {renderTextArea('content', 'AI Generated Content', 'AI-generated content will appear here...', 8)}
        </div>
      );

    case 'hypothesis':
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {renderTextArea('central_hypothesis', 'Central Hypothesis', 'State your central hypothesis...')}
          {renderTextArea('rationale', 'Scientific Rationale', 'Provide the rationale supporting your hypothesis...')}
          {renderTextArea('alternative_hypotheses', 'Alternative Hypotheses', 'What alternative hypotheses have you considered?')}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-slate-900 mb-2">Hypothesis Checklist</h4>
            <label className="flex items-center gap-2 mb-2">
              <input 
                type="checkbox" 
                checked={data.is_testable as boolean || false}
                onChange={(e) => updateField('is_testable', e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span className="text-sm text-slate-600">Testable within scope of project</span>
            </label>
            <label className="flex items-center gap-2 mb-2">
              <input 
                type="checkbox" 
                checked={data.is_falsifiable as boolean || false}
                onChange={(e) => updateField('is_falsifiable', e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span className="text-sm text-slate-600">Falsifiable with proposed methods</span>
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={data.has_prelim_support as boolean || false}
                onChange={(e) => updateField('has_prelim_support', e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span className="text-sm text-slate-600">Supported by preliminary data</span>
            </label>
          </div>
        </div>
      );

    case 'specific_aims':
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {renderTextArea('aim1', 'Specific Aim 1', 'Define Aim 1 with objectives and sub-aims...')}
          {renderTextArea('aim1_rationale', 'Aim 1 Rationale', 'Scientific rationale for Aim 1...')}
          {renderTextArea('aim2', 'Specific Aim 2', 'Define Aim 2 with objectives and sub-aims...')}
          {renderTextArea('aim2_rationale', 'Aim 2 Rationale', 'Scientific rationale for Aim 2...')}
          {renderTextArea('aim3', 'Specific Aim 3 (Optional)', 'Define Aim 3 if applicable...')}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Dependency Risk Analysis</p>
              <p>Ensure aims are independent enough that failure of one does not prevent completion of others.</p>
            </div>
          </div>
        </div>
      );

    case 'team':
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {renderInput('pi_name', 'Principal Investigator', 'Name of PI')}
          {renderTextArea('pi_expertise', 'PI Expertise', 'Key expertise and qualifications...')}
          {renderInput('pi_effort', 'PI Effort (%)', 'e.g., 25', 'number')}
          <div className="border-t border-slate-200 my-6 pt-6">
            <h4 className="font-medium text-slate-900 mb-4">Co-Investigators / Key Personnel</h4>
            {renderTextArea('coinvestigators', 'Co-Investigators', 'List co-investigators with their roles and expertise...')}
            {renderTextArea('consultants', 'Consultants/Collaborators', 'List any consultants or collaborators...')}
          </div>
        </div>
      );

    case 'approach':
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {renderTextArea('overall_strategy', 'Overall Strategy', 'Describe the overall research strategy...')}
          {renderTextArea('methodology', 'Methodology', 'Describe key methods and experimental design...')}
          {renderTextArea('timeline', 'Timeline', 'Describe the project timeline with milestones...')}
          {renderTextArea('expected_outcomes', 'Expected Outcomes', 'What outcomes do you expect?')}
          {renderTextArea('alternative_approaches', 'Alternative Approaches', 'What alternatives exist if primary approach fails?')}
          {renderTextArea('rigor', 'Scientific Rigor', 'How will you ensure scientific rigor?')}
        </div>
      );

    case 'budget':
      return <BudgetDirector data={data} onChange={onChange} project={project} />;

    case 'preliminary_data':
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {renderTextArea('data_summary', 'Data Summary', 'Summarize your preliminary/supporting data...')}
          {renderTextArea('key_findings', 'Key Findings', 'What are the key findings that support feasibility?')}
          {renderTextArea('publications', 'Relevant Publications', 'List relevant publications from your group...')}
          {renderTextArea('figure_descriptions', 'Figure Descriptions', 'Describe preliminary data figures to include...')}
        </div>
      );

    case 'summary_figure':
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {renderTextArea('figure_concept', 'Figure Concept', 'Describe the concept for your summary figure...')}
          {renderTextArea('key_elements', 'Key Visual Elements', 'List the key elements to include in the figure...')}
          {renderTextArea('narrative_flow', 'Narrative Flow', 'How should the figure guide the reader through your research?')}
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              Tip: An effective summary figure should communicate your research concept, 
              approach, and expected outcomes in a single, compelling visual that reviewers 
              can understand at a glance.
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
}

// Budget Director Component
interface BudgetDirectorProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  project: Project | null;
}

interface PersonnelItem {
  id: string;
  role: string;
  name: string;
  baseSalary: number;
  effort: number;
  fringeBenefits: number;
}

interface LineItem {
  id: string;
  description: string;
  amount: number;
}

interface YearBudget {
  personnel: PersonnelItem[];
  equipment: LineItem[];
  supplies: LineItem[];
  travel: LineItem[];
  consultants: LineItem[];
  other: LineItem[];
  consortium: { directCosts: number; indirectCosts: number };
}

const EMPTY_YEAR: YearBudget = {
  personnel: [],
  equipment: [],
  supplies: [],
  travel: [],
  consultants: [],
  other: [],
  consortium: { directCosts: 0, indirectCosts: 0 }
};

function BudgetDirector({ data, onChange, project }: BudgetDirectorProps) {
  const [activeYear, setActiveYear] = useState(1);
  const [budgetMode, setBudgetMode] = useState<'modular' | 'detailed'>(
    data.budgetMode === 'modular' ? 'modular' : 'detailed'
  );
  const [modularAmount, setModularAmount] = useState<number>((data.modularAmount as number) || 250000);
  
  const years = [1, 2, 3, 4, 5];
  const indirectRate = (data.indirectRate as number) || 55;
  
  const getYearData = (year: number): YearBudget => {
    const yearKey = `year${year}`;
    return (data[yearKey] as YearBudget) || { ...EMPTY_YEAR };
  };

  const updateYearData = (year: number, yearData: YearBudget) => {
    onChange({ ...data, [`year${year}`]: yearData, budgetMode, modularAmount, indirectRate });
  };

  const updateIndirectRate = (rate: number) => {
    onChange({ ...data, indirectRate: rate });
  };

  const currentYear = getYearData(activeYear);

  const addPersonnel = () => {
    const newPersonnel: PersonnelItem = {
      id: Date.now().toString(),
      role: '',
      name: '',
      baseSalary: 0,
      effort: 0,
      fringeBenefits: 30
    };
    updateYearData(activeYear, { ...currentYear, personnel: [...currentYear.personnel, newPersonnel] });
  };

  const updatePersonnel = (id: string, field: keyof PersonnelItem, value: string | number) => {
    const updated = currentYear.personnel.map(p => p.id === id ? { ...p, [field]: value } : p);
    updateYearData(activeYear, { ...currentYear, personnel: updated });
  };

  const removePersonnel = (id: string) => {
    updateYearData(activeYear, { ...currentYear, personnel: currentYear.personnel.filter(p => p.id !== id) });
  };

  const addLineItem = (category: keyof Omit<YearBudget, 'personnel' | 'consortium'>) => {
    const newItem: LineItem = { id: Date.now().toString(), description: '', amount: 0 };
    updateYearData(activeYear, { ...currentYear, [category]: [...(currentYear[category] as LineItem[]), newItem] });
  };

  const updateLineItem = (category: keyof Omit<YearBudget, 'personnel' | 'consortium'>, id: string, field: keyof LineItem, value: string | number) => {
    const items = currentYear[category] as LineItem[];
    const updated = items.map(item => item.id === id ? { ...item, [field]: value } : item);
    updateYearData(activeYear, { ...currentYear, [category]: updated });
  };

  const removeLineItem = (category: keyof Omit<YearBudget, 'personnel' | 'consortium'>, id: string) => {
    const items = currentYear[category] as LineItem[];
    updateYearData(activeYear, { ...currentYear, [category]: items.filter(item => item.id !== id) });
  };

  const updateConsortium = (field: 'directCosts' | 'indirectCosts', value: number) => {
    updateYearData(activeYear, { ...currentYear, consortium: { ...currentYear.consortium, [field]: value } });
  };

  // Calculations
  const calcPersonnelCost = (p: PersonnelItem) => {
    const cappedSalary = Math.min(p.baseSalary, NIH_SALARY_CAP);
    const salaryRequested = cappedSalary * (p.effort / 100);
    const fringe = salaryRequested * (p.fringeBenefits / 100);
    return salaryRequested + fringe;
  };

  const totalPersonnel = currentYear.personnel.reduce((sum, p) => sum + calcPersonnelCost(p), 0);
  const totalEquipment = (currentYear.equipment as LineItem[]).reduce((sum, i) => sum + i.amount, 0);
  const totalSupplies = (currentYear.supplies as LineItem[]).reduce((sum, i) => sum + i.amount, 0);
  const totalTravel = (currentYear.travel as LineItem[]).reduce((sum, i) => sum + i.amount, 0);
  const totalConsultants = (currentYear.consultants as LineItem[]).reduce((sum, i) => sum + i.amount, 0);
  const totalOther = (currentYear.other as LineItem[]).reduce((sum, i) => sum + i.amount, 0);
  const consortiumDirect = currentYear.consortium.directCosts;
  const consortiumIndirect = currentYear.consortium.indirectCosts;

  // MTDC = Total Direct - Equipment - Consortium costs > $25k
  const mtdc = totalPersonnel + totalSupplies + totalTravel + totalConsultants + totalOther;
  const indirectCosts = Math.round(mtdc * (indirectRate / 100));
  const directCosts = totalPersonnel + totalEquipment + totalSupplies + totalTravel + totalConsultants + totalOther + consortiumDirect;
  const totalCosts = directCosts + indirectCosts + consortiumIndirect;

  // Total project calculations
  const projectTotals = years.reduce((acc, y) => {
    const yd = getYearData(y);
    const persTotal = yd.personnel.reduce((s, p) => s + calcPersonnelCost(p), 0);
    const equipTotal = (yd.equipment as LineItem[]).reduce((s, i) => s + i.amount, 0);
    const suppTotal = (yd.supplies as LineItem[]).reduce((s, i) => s + i.amount, 0);
    const travTotal = (yd.travel as LineItem[]).reduce((s, i) => s + i.amount, 0);
    const consTotal = (yd.consultants as LineItem[]).reduce((s, i) => s + i.amount, 0);
    const othTotal = (yd.other as LineItem[]).reduce((s, i) => s + i.amount, 0);
    const mtdcY = persTotal + suppTotal + travTotal + consTotal + othTotal;
    const indY = Math.round(mtdcY * (indirectRate / 100));
    const dirY = persTotal + equipTotal + suppTotal + travTotal + consTotal + othTotal + yd.consortium.directCosts;
    acc.direct += dirY;
    acc.indirect += indY + yd.consortium.indirectCosts;
    return acc;
  }, { direct: 0, indirect: 0 });

  // Modular budget calculation ($25K modules)
  const modularModules = Math.ceil(modularAmount / 25000);

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>NIH Salary Cap:</strong> ${NIH_SALARY_CAP.toLocaleString()} (Executive Level II)
        </p>
        {(project?.target_agency === 'SBIR' || project?.target_agency === 'STTR') && (
          <p className="text-sm text-blue-800 mt-1">
            <strong>{project.target_agency} Rules:</strong> {project.target_agency === 'STTR' 
              ? 'Small business ≥40% R&D; research institution ≥30%' 
              : 'Small business ≥2/3 of R&D'}
          </p>
        )}
      </div>

      {/* Budget Mode Toggle */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Budget Type</h3>
            <p className="text-sm text-slate-500">NIH modular budgets use $25K modules (up to $250K/year direct costs)</p>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => { setBudgetMode('modular'); onChange({ ...data, budgetMode: 'modular' }); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                budgetMode === 'modular' ? 'bg-white shadow text-indigo-600' : 'text-slate-600'
              }`}
            >
              Modular
            </button>
            <button
              onClick={() => { setBudgetMode('detailed'); onChange({ ...data, budgetMode: 'detailed' }); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                budgetMode === 'detailed' ? 'bg-white shadow text-indigo-600' : 'text-slate-600'
              }`}
            >
              Detailed
            </button>
          </div>
        </div>

        {budgetMode === 'modular' && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Direct Costs Per Year (max $250,000)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={25000}
                max={250000}
                step={25000}
                value={modularAmount}
                onChange={(e) => { setModularAmount(Number(e.target.value)); onChange({ ...data, modularAmount: Number(e.target.value) }); }}
                className="flex-1"
              />
              <span className="font-semibold text-indigo-700">${modularAmount.toLocaleString()}</span>
              <span className="text-sm text-slate-500">({modularModules} modules)</span>
            </div>
          </div>
        )}
      </div>

      {budgetMode === 'detailed' && (
        <>
          {/* Year Tabs */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex border-b border-slate-200">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => setActiveYear(year)}
                  className={`flex-1 py-3 text-sm font-medium transition-all ${
                    activeYear === year
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Year {year}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-6">
              {/* Personnel Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900">Personnel</h4>
                  <button onClick={addPersonnel} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    + Add Person
                  </button>
                </div>
                {currentYear.personnel.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No personnel added</p>
                ) : (
                  <div className="space-y-3">
                    {currentYear.personnel.map(person => (
                      <div key={person.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-slate-50 rounded-lg">
                        <input
                          placeholder="Role"
                          value={person.role}
                          onChange={(e) => updatePersonnel(person.id, 'role', e.target.value)}
                          className="col-span-2 px-2 py-1.5 text-sm border border-slate-300 rounded"
                        />
                        <input
                          placeholder="Name"
                          value={person.name}
                          onChange={(e) => updatePersonnel(person.id, 'name', e.target.value)}
                          className="col-span-2 px-2 py-1.5 text-sm border border-slate-300 rounded"
                        />
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Base Salary"
                            value={person.baseSalary || ''}
                            onChange={(e) => updatePersonnel(person.id, 'baseSalary', Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded"
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="number"
                            placeholder="%"
                            value={person.effort || ''}
                            onChange={(e) => updatePersonnel(person.id, 'effort', Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded"
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="number"
                            placeholder="Fringe %"
                            value={person.fringeBenefits || ''}
                            onChange={(e) => updatePersonnel(person.id, 'fringeBenefits', Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded"
                          />
                        </div>
                        <div className="col-span-3 flex items-center justify-between">
                          <span className="text-sm font-medium">${calcPersonnelCost(person).toLocaleString()}</span>
                          <button onClick={() => removePersonnel(person.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                        </div>
                      </div>
                    ))}
                    <div className="text-right text-sm font-medium text-slate-700">
                      Personnel Total: ${totalPersonnel.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Other Categories */}
              {(['equipment', 'supplies', 'travel', 'consultants', 'other'] as const).map(category => (
                <div key={category}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900 capitalize">{category}</h4>
                    <button onClick={() => addLineItem(category)} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                      + Add Item
                    </button>
                  </div>
                  {(currentYear[category] as LineItem[]).length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No items added</p>
                  ) : (
                    <div className="space-y-2">
                      {(currentYear[category] as LineItem[]).map(item => (
                        <div key={item.id} className="flex gap-3 items-center">
                          <input
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateLineItem(category, item.id, 'description', e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded"
                          />
                          <input
                            type="number"
                            placeholder="Amount"
                            value={item.amount || ''}
                            onChange={(e) => updateLineItem(category, item.id, 'amount', Number(e.target.value))}
                            className="w-32 px-3 py-2 text-sm border border-slate-300 rounded"
                          />
                          <button onClick={() => removeLineItem(category, item.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Consortium/Subcontract */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Consortium/Subcontract</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Direct Costs</label>
                    <input
                      type="number"
                      value={currentYear.consortium.directCosts || ''}
                      onChange={(e) => updateConsortium('directCosts', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Indirect Costs</label>
                    <input
                      type="number"
                      value={currentYear.consortium.indirectCosts || ''}
                      onChange={(e) => updateConsortium('indirectCosts', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* F&A Rate */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  F&A (Indirect) Rate (%)
                </label>
                <input
                  type="number"
                  value={indirectRate}
                  onChange={(e) => updateIndirectRate(Number(e.target.value))}
                  className="w-32 px-3 py-2 border border-slate-300 rounded"
                />
                <p className="text-xs text-slate-500 mt-1">Applied to MTDC (excludes equipment & consortium)</p>
              </div>
            </div>
          </div>

          {/* Year Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Year {activeYear} Budget Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-500">Personnel</p>
                <p className="font-semibold">${totalPersonnel.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-500">Equipment</p>
                <p className="font-semibold">${totalEquipment.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-500">Supplies</p>
                <p className="font-semibold">${totalSupplies.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-500">Travel</p>
                <p className="font-semibold">${totalTravel.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-500">Consultants</p>
                <p className="font-semibold">${totalConsultants.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-500">Other</p>
                <p className="font-semibold">${totalOther.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-500">Consortium</p>
                <p className="font-semibold">${(consortiumDirect + consortiumIndirect).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-500">F&A ({indirectRate}%)</p>
                <p className="font-semibold">${indirectCosts.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="text-indigo-600 text-sm">Direct Costs</p>
                <p className="font-bold text-indigo-700">${directCosts.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="text-indigo-600 text-sm">Indirect Costs</p>
                <p className="font-bold text-indigo-700">${(indirectCosts + consortiumIndirect).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <p className="text-indigo-600 text-sm">Total Costs</p>
                <p className="font-bold text-indigo-700">${totalCosts.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Total Project Summary */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <h4 className="font-semibold mb-4">Total Project Period Summary</h4>
        {budgetMode === 'modular' ? (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-indigo-200 text-sm">Per Year (Modular)</p>
              <p className="text-2xl font-bold">${modularAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-sm">5-Year Total Direct</p>
              <p className="text-2xl font-bold">${(modularAmount * 5).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-sm">Modules/Year</p>
              <p className="text-2xl font-bold">{modularModules}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-indigo-200 text-sm">Total Direct Costs</p>
              <p className="text-2xl font-bold">${projectTotals.direct.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-sm">Total Indirect Costs</p>
              <p className="text-2xl font-bold">${projectTotals.indirect.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-sm">Grand Total</p>
              <p className="text-2xl font-bold">${(projectTotals.direct + projectTotals.indirect).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Budget Justification */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h4 className="font-semibold text-slate-900 mb-3">Budget Justification</h4>
        <textarea
          value={(data.justification as string) || ''}
          onChange={(e) => onChange({ ...data, justification: e.target.value })}
          placeholder="Provide detailed justification for each budget category..."
          rows={8}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
        />
      </div>
    </div>
  );
}
