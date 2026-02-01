import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, GfProject } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ChevronRight,
  Trash2,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<GfProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('gf_projects')
      .select('*')
      .eq('user_id', user?.id)
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Failed to load projects');
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    const { error } = await supabase.from('gf_projects').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete project');
    } else {
      toast.success('Project deleted');
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_review':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getCompletionPercentage = (project: GfProject) => {
    const modules = ['concept', 'hypothesis', 'specific_aims', 'team', 'approach', 'budget', 'preliminary_data', 'summary_figure'];
    const completed = modules.filter(m => {
      const data = project[m as keyof GfProject];
      return data && typeof data === 'object' && Object.keys(data as object).length > 0;
    }).length;
    return Math.round((completed / modules.length) * 100);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
            <p className="text-slate-600 mt-1">Manage your grant applications</p>
          </div>
          <Link
            to="/entry"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            New Project
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No projects yet</h3>
            <p className="text-slate-600 mb-6">Create your first grant project to get started</p>
            <Link
              to="/entry"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => {
              const completion = getCompletionPercentage(project);
              return (
                <div
                  key={project.id}
                  className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(project.status)}
                        <h3 className="text-lg font-semibold text-slate-900 truncate">
                          {project.title || 'Untitled Project'}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="bg-slate-100 px-2 py-1 rounded">{project.target_agency}</span>
                        <span className="bg-slate-100 px-2 py-1 rounded">{project.project_type}</span>
                        <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-600">Progress</span>
                          <span className="font-medium text-slate-900">{completion}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 rounded-full transition-all"
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <Link
                        to={`/projects/${project.id}/edit`}
                        className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-all"
                      >
                        Continue
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Cards */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-slate-600 text-sm">Total Projects</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{projects.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-slate-600 text-sm">In Progress</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {projects.filter(p => p.status === 'draft').length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-slate-600 text-sm">Completed</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {projects.filter(p => p.status === 'completed').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
