import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { BarChart3, Users, DollarSign, TrendingUp, Building2, GraduationCap, AlertTriangle, Shield } from 'lucide-react';
import SentinelDashboard from '@/components/SentinelDashboard';

interface AnalyticsData {
  academicUsers: number;
  commercialUsers: number;
  totalProjects: number;
  sbirProjects: number;
  sttrProjects: number;
  nihProjects: number;
  academicMRR: number;
  commercialMRR: number;
  enterpriseARR: number;
  churnAcademic: number;
  churnCommercial: number;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'sentinel'>('analytics');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    // Fetch user counts by type
    const { data: users } = await supabase.from('gf_users').select('user_type, plan_tier');
    const { data: projects } = await supabase.from('gf_projects').select('funding_program');

    const academicUsers = users?.filter(u => u.user_type === 'academic').length || 0;
    const commercialUsers = users?.filter(u => u.user_type === 'commercial').length || 0;

    // Calculate MRR (simplified)
    const PRICES: Record<string, number> = {
      fellow: 0, pi: 49, department: 299, institution: 999,
      founder: 0, startup_pro: 99, growth_lab: 399, enterprise: 999
    };

    const academicMRR = users?.filter(u => u.user_type === 'academic')
      .reduce((sum, u) => sum + (PRICES[u.plan_tier] || 0), 0) || 0;
    const commercialMRR = users?.filter(u => u.user_type === 'commercial')
      .reduce((sum, u) => sum + (PRICES[u.plan_tier] || 0), 0) || 0;

    const sbirProjects = projects?.filter(p => p.funding_program === 'sbir').length || 0;
    const sttrProjects = projects?.filter(p => p.funding_program === 'sttr').length || 0;
    const nihProjects = projects?.filter(p => p.funding_program === 'nih_r').length || 0;

    setData({
      academicUsers,
      commercialUsers,
      totalProjects: projects?.length || 0,
      sbirProjects,
      sttrProjects,
      nihProjects,
      academicMRR,
      commercialMRR,
      enterpriseARR: (academicMRR + commercialMRR) * 12,
      churnAcademic: 2.1,
      churnCommercial: 4.3,
    });
    setLoading(false);
  };

  if (loading) {
    return <Layout><div className="p-8 text-center">Loading analytics...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-600">Platform management and monitoring</p>
          </div>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'analytics' ? 'bg-white text-slate-900 shadow' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <BarChart3 className="w-4 h-4 inline mr-2" />Analytics
            </button>
            <button onClick={() => setActiveTab('sentinel')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'sentinel' ? 'bg-white text-slate-900 shadow' : 'text-slate-600 hover:text-slate-900'
              }`}>
              <Shield className="w-4 h-4 inline mr-2" />Sentinel
            </button>
          </div>
        </div>

        {activeTab === 'sentinel' ? (
          <div className="bg-slate-900 rounded-2xl p-6">
            <SentinelDashboard />
          </div>
        ) : (
        <>
        {/* Revenue Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-5 h-5" />
              <span className="text-indigo-200 text-sm">Academic MRR</span>
            </div>
            <p className="text-3xl font-bold">${data?.academicMRR.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5" />
              <span className="text-emerald-200 text-sm">Commercial MRR</span>
            </div>
            <p className="text-3xl font-bold">${data?.commercialMRR.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-purple-200 text-sm">Enterprise ARR</span>
            </div>
            <p className="text-3xl font-bold">${data?.enterpriseARR.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-amber-200 text-sm">Total MRR</span>
            </div>
            <p className="text-3xl font-bold">${((data?.academicMRR || 0) + (data?.commercialMRR || 0)).toLocaleString()}</p>
          </div>
        </div>

        {/* User & Project Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Users by Vertical
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Academic</span>
                  <span className="font-medium">{data?.academicUsers}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full" 
                    style={{ width: `${(data?.academicUsers || 0) / ((data?.academicUsers || 0) + (data?.commercialUsers || 1)) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Commercial</span>
                  <span className="font-medium">{data?.commercialUsers}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ width: `${(data?.commercialUsers || 0) / ((data?.academicUsers || 1) + (data?.commercialUsers || 0)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Projects by Program
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{data?.sbirProjects}</p>
                <p className="text-sm text-slate-600">SBIR</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{data?.sttrProjects}</p>
                <p className="text-sm text-slate-600">STTR</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{data?.nihProjects}</p>
                <p className="text-sm text-slate-600">NIH R</p>
              </div>
            </div>
          </div>
        </div>

        {/* Churn Stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Churn by Vertical
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-indigo-500" />
                <div>
                  <p className="font-medium text-slate-900">Academic Churn</p>
                  <p className="text-sm text-slate-500">Monthly rate</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-indigo-600">{data?.churnAcademic}%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="font-medium text-slate-900">Commercial Churn</p>
                  <p className="text-sm text-slate-500">Monthly rate</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-emerald-600">{data?.churnCommercial}%</span>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </Layout>
  );
}
