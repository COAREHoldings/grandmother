import { useState, useEffect } from 'react';
import { supabase, AGENCIES } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  Search, 
  Calendar, 
  DollarSign, 
  Target,
  ExternalLink,
  Filter,
  Loader2
} from 'lucide-react';

interface FundingOpportunity {
  id: string;
  agency: string;
  mechanism: string;
  foa_number: string;
  title: string;
  description: string;
  keywords: string[];
  award_ceiling: number;
  deadline: string;
  success_rate: number;
  requirements: Record<string, unknown>;
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('');

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    const { data, error } = await supabase
      .from('funding_opportunities')
      .select('*')
      .order('deadline', { ascending: true });

    if (!error && data) {
      setOpportunities(data);
    }
    setLoading(false);
  };

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = !search || 
      opp.title.toLowerCase().includes(search.toLowerCase()) ||
      opp.description?.toLowerCase().includes(search.toLowerCase()) ||
      opp.foa_number?.toLowerCase().includes(search.toLowerCase());
    const matchesAgency = !agencyFilter || opp.agency === agencyFilter;
    return matchesSearch && matchesAgency;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Funding Opportunities</h1>
          <p className="text-slate-600 mt-1">Browse and search available funding opportunities</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, FOA number, or keywords..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={agencyFilter}
                onChange={(e) => setAgencyFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Agencies</option>
                {AGENCIES.map((a) => (
                  <option key={a.value} value={a.value}>{a.value}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No opportunities found</h3>
            <p className="text-slate-600">
              {opportunities.length === 0 
                ? 'Funding opportunities database is empty.'
                : 'Try adjusting your search or filters.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOpportunities.map((opp) => {
              const daysLeft = getDaysUntilDeadline(opp.deadline);
              const isUrgent = daysLeft <= 30 && daysLeft > 0;
              const isPast = daysLeft <= 0;

              return (
                <div
                  key={opp.id}
                  className={`bg-white rounded-xl border p-6 transition-all hover:shadow-md ${
                    isPast ? 'border-slate-200 opacity-60' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm font-medium">
                          {opp.agency}
                        </span>
                        {opp.mechanism && (
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-sm">
                            {opp.mechanism}
                          </span>
                        )}
                        {isUrgent && (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-medium">
                            {daysLeft} days left
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {opp.title}
                      </h3>
                      {opp.foa_number && (
                        <p className="text-sm text-slate-500 mb-2">FOA: {opp.foa_number}</p>
                      )}
                      {opp.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">{opp.description}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 lg:min-w-[200px]">
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        {opp.award_ceiling && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span>Up to ${opp.award_ceiling.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      {opp.deadline && (
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>Deadline: {formatDate(opp.deadline)}</span>
                        </div>
                      )}
                      {opp.success_rate && (
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Target className="w-4 h-4" />
                          <span>Success rate: {opp.success_rate}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {opp.keywords && opp.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                      {opp.keywords.slice(0, 5).map((keyword, i) => (
                        <span 
                          key={i} 
                          className="bg-slate-50 text-slate-600 px-2 py-1 rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
