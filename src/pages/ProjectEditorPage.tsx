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
  { id: 'budget', label: 'Budget', icon: DollarSign, description: 'Budget and justification' },
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
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              <strong>NIH Salary Cap:</strong> ${NIH_SALARY_CAP.toLocaleString()} (Executive Level II)
            </p>
            {project?.target_agency === 'STTR' && (
              <p className="text-sm text-blue-800 mt-1">
                <strong>STTR Rules:</strong> Small business must perform at least 40% of R&D; research institution at least 30%
              </p>
            )}
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {renderInput('personnel_costs', 'Personnel Costs ($)', '0', 'number')}
            {renderInput('equipment', 'Equipment ($)', '0', 'number')}
            {renderInput('supplies', 'Supplies ($)', '0', 'number')}
            {renderInput('travel', 'Travel ($)', '0', 'number')}
            {renderInput('other_direct', 'Other Direct Costs ($)', '0', 'number')}
            {renderInput('indirect_rate', 'Indirect Cost Rate (%)', 'e.g., 55', 'number')}
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-slate-900 mb-2">Budget Summary</h4>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600">Direct Costs: </span>
                <span className="font-medium">
                  ${(
                    Number(data.personnel_costs || 0) +
                    Number(data.equipment || 0) +
                    Number(data.supplies || 0) +
                    Number(data.travel || 0) +
                    Number(data.other_direct || 0)
                  ).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-600">Indirect Costs: </span>
                <span className="font-medium">
                  ${Math.round(
                    (Number(data.personnel_costs || 0) +
                    Number(data.supplies || 0) +
                    Number(data.other_direct || 0)) *
                    (Number(data.indirect_rate || 0) / 100)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {renderTextArea('budget_justification', 'Budget Justification', 'Justify each major budget category...')}
        </div>
      );

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
