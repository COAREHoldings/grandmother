import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  FileText, 
  Upload, 
  RefreshCw, 
  BookOpen,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const FUNDING_PROGRAMS = [
  { value: 'sbir', label: 'SBIR - Small Business Innovation Research' },
  { value: 'sttr', label: 'STTR - Small Business Technology Transfer' },
  { value: 'nih_r', label: 'NIH R-Series (R01, R21, R03)' },
  { value: 'nsf', label: 'NSF - National Science Foundation' },
  { value: 'dod', label: 'DoD CDMRP' },
  { value: 'cprit', label: 'CPRIT - Cancer Prevention Research Institute of Texas' },
  { value: 'other', label: 'Other / Foundation' },
];

const AWARD_TYPES = [
  { value: 'grant', label: 'Grant' },
  { value: 'contract', label: 'Contract' },
  { value: 'cooperative_agreement', label: 'Cooperative Agreement' },
];

const PHASE_TYPES = [
  { value: 'phase1', label: 'Phase I - Feasibility' },
  { value: 'phase2', label: 'Phase II - Full R&D' },
  { value: 'phase2b', label: 'Phase IIB - Commercialization' },
  { value: 'fasttrack', label: 'Fast Track - Combined I/II' },
];

const entryOptions = [
  { id: 'scratch', icon: FileText, title: 'Start from Scratch', description: 'Begin a new grant application with AI-guided modules' },
  { id: 'continue', icon: RefreshCw, title: 'Continue Draft', description: 'Resume work on an existing partial draft' },
  { id: 'review', icon: Upload, title: 'Upload for Review', description: 'Upload a complete draft for AI review simulation' },
  { id: 'convert', icon: BookOpen, title: 'Manuscript to Grant', description: 'Convert an existing manuscript into a grant proposal' }
];

export default function EntryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [fundingProgram, setFundingProgram] = useState('nih_r');
  const [awardType, setAwardType] = useState('grant');
  const [phaseType, setPhaseType] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [academicPartner, setAcademicPartner] = useState(false);
  const [academicAllocation, setAcademicAllocation] = useState(30);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('gf_users').select('*').eq('id', user.id).maybeSingle();
    setUserProfile(data);
  };

  const isSBIRSTTR = fundingProgram === 'sbir' || fundingProgram === 'sttr';
  const isSTTR = fundingProgram === 'sttr';
  const isContract = awardType === 'contract';

  const handleCreateProject = async () => {
    if (!selectedEntry) {
      toast.error('Please select an entry point');
      return;
    }

    if (isSTTR && !academicPartner) {
      toast.error('STTR requires an academic research partner');
      return;
    }

    if (isSTTR && academicAllocation < 30) {
      toast.error('STTR requires at least 30% academic allocation');
      return;
    }

    setLoading(true);

    // Create in gf_projects table
    const { data, error } = await supabase
      .from('gf_projects')
      .insert({
        user_id: user?.id,
        title: title || 'Untitled Project',
        funding_program: fundingProgram,
        award_type: awardType,
        phase_type: isSBIRSTTR ? phaseType : null,
        academic_partner_required: isSTTR,
        academic_allocation_percent: isSTTR ? academicAllocation : null,
        data: { entry_state: selectedEntry },
        status: 'draft'
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Project creation error:', error);
      toast.error(error.message || 'Failed to create project');
      setLoading(false);
      return;
    }

    if (!data) {
      toast.error('Failed to create project');
      setLoading(false);
      return;
    }

    toast.success('Project created!');
    navigate(`/projects/${data.id}/edit`);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Create New Project</h1>
          <p className="text-lg text-slate-600">Choose your entry point and configure your funding program</p>
        </div>

        {/* Entry Options */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {entryOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedEntry(option.id)}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                selectedEntry === option.id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <option.icon className={`w-8 h-8 mb-4 ${selectedEntry === option.id ? 'text-indigo-600' : 'text-slate-400'}`} />
              <h3 className="font-semibold text-slate-900 mb-1">{option.title}</h3>
              <p className="text-sm text-slate-600">{option.description}</p>
            </button>
          ))}
        </div>

        {selectedEntry && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Project Configuration</h2>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Project Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Novel Biomarkers for Early Cancer Detection"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Funding Program & Award Type */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Funding Program</label>
                  <select
                    value={fundingProgram}
                    onChange={(e) => setFundingProgram(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    {FUNDING_PROGRAMS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Award Type</label>
                  <select
                    value={awardType}
                    onChange={(e) => setAwardType(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    {AWARD_TYPES.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SBIR/STTR Phase Selection */}
              {isSBIRSTTR && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phase Type</label>
                  <select
                    value={phaseType || ''}
                    onChange={(e) => setPhaseType(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Phase</option>
                    {PHASE_TYPES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* STTR Academic Partner */}
              {isSTTR && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-800 mb-3">STTR Requirements</p>
                      <label className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          checked={academicPartner}
                          onChange={(e) => setAcademicPartner(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span className="text-sm text-amber-800">I have an academic research partner</span>
                      </label>
                      <div>
                        <label className="block text-sm text-amber-800 mb-1">
                          Academic Allocation: {academicAllocation}% (min 30%)
                        </label>
                        <input
                          type="range"
                          min={30}
                          max={60}
                          value={academicAllocation}
                          onChange={(e) => setAcademicAllocation(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contract Mode Notice */}
              {isContract && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-800">
                    <strong>Contract Mode:</strong> Milestone budget structure, deliverables schedule, and SOW builder will be enabled.
                  </p>
                </div>
              )}

              <button
                onClick={handleCreateProject}
                disabled={loading || (isSBIRSTTR && !phaseType)}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Continue to Project
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
