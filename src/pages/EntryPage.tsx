import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, AGENCIES, MECHANISMS } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  FileText, 
  Upload, 
  RefreshCw, 
  BookOpen,
  ArrowRight,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const entryOptions = [
  {
    id: 'scratch',
    icon: FileText,
    title: 'Start from Scratch',
    description: 'Begin a new grant application with AI-guided modules'
  },
  {
    id: 'continue',
    icon: RefreshCw,
    title: 'Continue Draft',
    description: 'Resume work on an existing partial draft'
  },
  {
    id: 'review',
    icon: Upload,
    title: 'Upload for Review',
    description: 'Upload a complete draft for AI review simulation'
  },
  {
    id: 'convert',
    icon: BookOpen,
    title: 'Manuscript to Grant',
    description: 'Convert an existing manuscript into a grant proposal'
  }
];

export default function EntryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [agency, setAgency] = useState('NIH');
  const [mechanism, setMechanism] = useState('R01');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateProject = async () => {
    if (!selectedEntry) {
      toast.error('Please select an entry point');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user?.id,
        entry_state: selectedEntry,
        target_agency: agency,
        project_type: mechanism,
        title: title || 'Untitled Project',
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
      toast.error('Failed to create project - no data returned');
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
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            How Would You Like to Start?
          </h1>
          <p className="text-lg text-slate-600">
            Choose your entry point to begin your grant writing journey
          </p>
        </div>

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
              <option.icon className={`w-8 h-8 mb-4 ${
                selectedEntry === option.id ? 'text-indigo-600' : 'text-slate-400'
              }`} />
              <h3 className="font-semibold text-slate-900 mb-1">{option.title}</h3>
              <p className="text-sm text-slate-600">{option.description}</p>
            </button>
          ))}
        </div>

        {selectedEntry && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">
              Project Details
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Novel Biomarkers for Early Cancer Detection"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Funding Agency
                  </label>
                  <select
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {AGENCIES.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Grant Mechanism
                  </label>
                  <select
                    value={mechanism}
                    onChange={(e) => setMechanism(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {MECHANISMS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreateProject}
                disabled={loading}
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
