import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Project } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  Search, BookOpen, DollarSign, ChevronLeft, Loader2, 
  ExternalLink, Save, CheckCircle, X, FileText, Building2, User, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  abstract: string;
}

interface NIHGrant {
  projectNumber: string;
  title: string;
  abstract: string;
  piName: string;
  organization: string;
  totalCost: number;
  fiscalYear: number;
  foa: string;
}

interface SavedReference {
  id: string;
  type: 'paper' | 'grant';
  title: string;
  details: string;
  source: string;
  savedAt: string;
}

export default function ResearchPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'papers' | 'grants'>('papers');
  const [loading, setLoading] = useState(true);
  
  // PubMed state
  const [pubmedQuery, setPubmedQuery] = useState('');
  const [pubmedResults, setPubmedResults] = useState<PubMedArticle[]>([]);
  const [searchingPubmed, setSearchingPubmed] = useState(false);
  
  // NIH Reporter state
  const [nihQuery, setNihQuery] = useState('');
  const [nihPiName, setNihPiName] = useState('');
  const [nihOrg, setNihOrg] = useState('');
  const [nihResults, setNihResults] = useState<NIHGrant[]>([]);
  const [searchingNih, setSearchingNih] = useState(false);
  
  // Saved references
  const [savedRefs, setSavedRefs] = useState<SavedReference[]>([]);

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
    setSavedRefs((data.saved_references as SavedReference[]) || []);
    setLoading(false);
  };

  // PubMed Search
  const searchPubmed = async () => {
    if (!pubmedQuery.trim()) return;
    setSearchingPubmed(true);
    setPubmedResults([]);

    try {
      // Search for PMIDs
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(pubmedQuery)}&retmax=20&retmode=json`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      const pmids = searchData.esearchresult?.idlist || [];

      if (pmids.length === 0) {
        toast.error('No results found');
        setSearchingPubmed(false);
        return;
      }

      // Use ESummary for cleaner JSON
      const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
      const summaryRes = await fetch(summaryUrl);
      const summaryData = await summaryRes.json();
      
      const results: PubMedArticle[] = [];
      for (const pmid of pmids) {
        const doc = summaryData.result?.[pmid];
        if (!doc) continue;
        
        const authorList = doc.authors || [];
        const authorsStr = authorList.slice(0, 3).map((a: any) => a.name).join(', ') + (authorList.length > 3 ? ' et al.' : '');
        
        results.push({
          pmid,
          title: doc.title || '',
          authors: authorsStr,
          journal: doc.source || doc.fulljournalname || '',
          year: doc.pubdate?.split(' ')[0] || '',
          abstract: '' // ESummary doesn't include abstracts; can fetch separately if needed
        });
      }

      setPubmedResults(results);
    } catch (error) {
      toast.error('Search failed. Please try again.');
    }
    setSearchingPubmed(false);
  };

  // NIH Reporter Search
  const searchNihReporter = async () => {
    if (!nihQuery.trim() && !nihPiName.trim() && !nihOrg.trim()) {
      toast.error('Enter at least one search term');
      return;
    }
    setSearchingNih(true);
    setNihResults([]);

    try {
      const criteria: any = { limit: 20, offset: 0 };
      
      if (nihQuery.trim()) {
        criteria.advanced_text_search = {
          operator: 'and',
          search_field: 'all',
          search_text: nihQuery
        };
      }
      if (nihPiName.trim()) {
        criteria.pi_names = [{ any_name: nihPiName }];
      }
      if (nihOrg.trim()) {
        criteria.org_names = [nihOrg];
      }

      const response = await fetch('https://api.reporter.nih.gov/v2/projects/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria, include_fields: [
          'ProjectTitle', 'AbstractText', 'PiNames', 'Organization',
          'AwardAmount', 'FiscalYear', 'ProjectNum', 'FoaNumber'
        ]})
      });

      const data = await response.json();
      const results: NIHGrant[] = (data.results || []).map((r: any) => ({
        projectNumber: r.project_num || '',
        title: r.project_title || '',
        abstract: (r.abstract_text || '').slice(0, 500) + ((r.abstract_text || '').length > 500 ? '...' : ''),
        piName: r.pi_names?.map((p: any) => p.full_name).join(', ') || '',
        organization: r.organization?.org_name || '',
        totalCost: r.award_amount || 0,
        fiscalYear: r.fiscal_year || 0,
        foa: r.foa_number || ''
      }));

      setNihResults(results);
      if (results.length === 0) toast.error('No grants found');
    } catch (error) {
      toast.error('Search failed. Please try again.');
    }
    setSearchingNih(false);
  };

  // Save reference to project
  const saveReference = async (type: 'paper' | 'grant', item: PubMedArticle | NIHGrant) => {
    const newRef: SavedReference = {
      id: Date.now().toString(),
      type,
      title: 'title' in item ? item.title : '',
      details: type === 'paper' 
        ? `${(item as PubMedArticle).authors} (${(item as PubMedArticle).year}). ${(item as PubMedArticle).journal}`
        : `${(item as NIHGrant).piName}, ${(item as NIHGrant).organization}. FY${(item as NIHGrant).fiscalYear}`,
      source: type === 'paper' ? `PMID: ${(item as PubMedArticle).pmid}` : (item as NIHGrant).projectNumber,
      savedAt: new Date().toISOString()
    };

    const updatedRefs = [...savedRefs, newRef];
    setSavedRefs(updatedRefs);

    await supabase
      .from('gf_projects')
      .update({ saved_references: updatedRefs, updated_at: new Date().toISOString() })
      .eq('id', project?.id);

    toast.success('Reference saved!');
  };

  const removeReference = async (refId: string) => {
    const updatedRefs = savedRefs.filter(r => r.id !== refId);
    setSavedRefs(updatedRefs);

    await supabase
      .from('gf_projects')
      .update({ saved_references: updatedRefs, updated_at: new Date().toISOString() })
      .eq('id', project?.id);

    toast.success('Reference removed');
  };

  const isRefSaved = (type: 'paper' | 'grant', identifier: string) => {
    return savedRefs.some(r => r.source.includes(identifier));
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
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/projects/${id}`)}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Research Tools</h1>
              <p className="text-slate-600">{project?.title}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('papers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'papers'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Papers (PubMed)
          </button>
          <button
            onClick={() => setActiveTab('grants')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'grants'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            Funded Grants (NIH Reporter)
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Search Panel */}
          <div className="col-span-2 space-y-6">
            {activeTab === 'papers' ? (
              <>
                {/* PubMed Search */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Search PubMed</h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={pubmedQuery}
                      onChange={(e) => setPubmedQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchPubmed()}
                      placeholder="Enter keywords, author names, or MeSH terms..."
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={searchPubmed}
                      disabled={searchingPubmed}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {searchingPubmed ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Search
                    </button>
                  </div>
                </div>

                {/* PubMed Results */}
                {pubmedResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900">{pubmedResults.length} Results</h3>
                    {pubmedResults.map((article) => (
                      <div key={article.pmid} className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 mb-2">{article.title}</h4>
                            <p className="text-sm text-slate-600 mb-2">{article.authors}</p>
                            <p className="text-sm text-slate-500 mb-3">
                              {article.journal} ({article.year}) • PMID: {article.pmid}
                            </p>
                            {article.abstract && (
                              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{article.abstract}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <a
                              href={`https://pubmed.ncbi.nlm.nih.gov/${article.pmid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </a>
                            {isRefSaved('paper', article.pmid) ? (
                              <div className="p-2 text-emerald-600">
                                <CheckCircle className="w-5 h-5" />
                              </div>
                            ) : (
                              <button
                                onClick={() => saveReference('paper', article)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              >
                                <Save className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* NIH Reporter Search */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Search NIH Reporter</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={nihQuery}
                      onChange={(e) => setNihQuery(e.target.value)}
                      placeholder="Keywords (project title, abstract)..."
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={nihPiName}
                        onChange={(e) => setNihPiName(e.target.value)}
                        placeholder="PI Name (optional)"
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        value={nihOrg}
                        onChange={(e) => setNihOrg(e.target.value)}
                        placeholder="Institution (optional)"
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      onClick={searchNihReporter}
                      disabled={searchingNih}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {searchingNih ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Search NIH Funded Grants
                    </button>
                  </div>
                </div>

                {/* NIH Results */}
                {nihResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900">{nihResults.length} Results</h3>
                    {nihResults.map((grant) => (
                      <div key={grant.projectNumber} className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 mb-2">{grant.title}</h4>
                            <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-3">
                              <span className="flex items-center gap-1"><User className="w-4 h-4" />{grant.piName}</span>
                              <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{grant.organization}</span>
                              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />FY{grant.fiscalYear}</span>
                              <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />${grant.totalCost.toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-2">{grant.projectNumber} {grant.foa && `• ${grant.foa}`}</p>
                            {grant.abstract && (
                              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{grant.abstract}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <a
                              href={`https://reporter.nih.gov/project-details/${grant.projectNumber.replace(/\s/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </a>
                            {isRefSaved('grant', grant.projectNumber) ? (
                              <div className="p-2 text-emerald-600">
                                <CheckCircle className="w-5 h-5" />
                              </div>
                            ) : (
                              <button
                                onClick={() => saveReference('grant', grant)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              >
                                <Save className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Saved References Sidebar */}
          <div className="col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Saved References ({savedRefs.length})
              </h3>
              
              {savedRefs.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  No saved references yet. Search and save papers or grants to reference in your application.
                </p>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {savedRefs.map((ref) => (
                    <div key={ref.id} className="p-3 bg-slate-50 rounded-lg relative group">
                      <button
                        onClick={() => removeReference(ref.id)}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2 mb-1">
                        {ref.type === 'paper' ? (
                          <BookOpen className="w-4 h-4 text-indigo-500" />
                        ) : (
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                        )}
                        <span className="text-xs font-medium text-slate-500 uppercase">{ref.type}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 line-clamp-2">{ref.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{ref.details}</p>
                      <p className="text-xs text-slate-400 mt-1">{ref.source}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
