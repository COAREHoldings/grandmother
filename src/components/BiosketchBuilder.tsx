import { useState } from 'react';
import { User, Plus, Trash2, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

interface Position {
  position: string;
  institution: string;
  startDate: string;
  endDate: string;
}

interface Contribution {
  title: string;
  description: string;
  citations: string[];
}

interface Grant {
  title: string;
  role: string;
  funder: string;
  period: string;
  amount: string;
  status: 'active' | 'completed';
}

interface BiosSketchData {
  name: string;
  orcid: string;
  eraCommons: string;
  personalStatement: string;
  positions: Position[];
  contributions: Contribution[];
  grants: Grant[];
}

interface Props {
  initialData?: Partial<BiosSketchData>;
  fundingProgram?: string;
  onSave?: (data: BiosSketchData) => void;
}

const EMPTY_POSITION: Position = { position: '', institution: '', startDate: '', endDate: '' };
const EMPTY_CONTRIBUTION: Contribution = { title: '', description: '', citations: [''] };
const EMPTY_GRANT: Grant = { title: '', role: '', funder: '', period: '', amount: '', status: 'active' };

export default function BiosketchBuilder({ initialData, fundingProgram = 'nih', onSave }: Props) {
  const [data, setData] = useState<BiosSketchData>({
    name: initialData?.name || '',
    orcid: initialData?.orcid || '',
    eraCommons: initialData?.eraCommons || '',
    personalStatement: initialData?.personalStatement || '',
    positions: initialData?.positions || [EMPTY_POSITION],
    contributions: initialData?.contributions || [EMPTY_CONTRIBUTION],
    grants: initialData?.grants || [],
  });
  const [activeTab, setActiveTab] = useState<'personal' | 'positions' | 'contributions' | 'grants'>('personal');
  const [exporting, setExporting] = useState(false);

  const validateOrcid = (orcid: string): boolean => {
    return /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(orcid);
  };

  const updateField = <K extends keyof BiosSketchData>(field: K, value: BiosSketchData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const addPosition = () => {
    setData(prev => ({ ...prev, positions: [...prev.positions, { ...EMPTY_POSITION }] }));
  };

  const updatePosition = (index: number, field: keyof Position, value: string) => {
    const newPositions = [...data.positions];
    newPositions[index] = { ...newPositions[index], [field]: value };
    setData(prev => ({ ...prev, positions: newPositions }));
  };

  const removePosition = (index: number) => {
    setData(prev => ({ ...prev, positions: prev.positions.filter((_, i) => i !== index) }));
  };

  const addContribution = () => {
    if (data.contributions.length < 5) {
      setData(prev => ({ ...prev, contributions: [...prev.contributions, { ...EMPTY_CONTRIBUTION }] }));
    }
  };

  const updateContribution = (index: number, field: keyof Contribution, value: any) => {
    const newContributions = [...data.contributions];
    newContributions[index] = { ...newContributions[index], [field]: value };
    setData(prev => ({ ...prev, contributions: newContributions }));
  };

  const addGrant = () => {
    setData(prev => ({ ...prev, grants: [...prev.grants, { ...EMPTY_GRANT }] }));
  };

  const updateGrant = (index: number, field: keyof Grant, value: string) => {
    const newGrants = [...data.grants];
    newGrants[index] = { ...newGrants[index], [field]: value };
    setData(prev => ({ ...prev, grants: newGrants }));
  };

  const exportPDF = async (format: 'nih' | 'nsf') => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - margin * 2;
      let y = margin;

      // Header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(format === 'nih' ? 'NIH BIOSKETCH' : 'NSF BIOGRAPHICAL SKETCH', margin, y);
      y += 10;

      // Name & IDs
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(data.name || 'Name', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      if (data.orcid) doc.text(`ORCID: ${data.orcid}`, margin, y);
      if (data.eraCommons) doc.text(`eRA Commons: ${data.eraCommons}`, margin + 60, y);
      y += 10;

      // Section A: Personal Statement
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('A. Personal Statement', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const psLines = doc.splitTextToSize(data.personalStatement || 'No personal statement provided.', maxWidth);
      doc.text(psLines, margin, y);
      y += psLines.length * 4 + 8;

      // Section B: Positions
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('B. Positions, Scientific Appointments, and Honors', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      data.positions.forEach(pos => {
        if (pos.position) {
          doc.text(`${pos.startDate}-${pos.endDate || 'Present'}  ${pos.position}, ${pos.institution}`, margin, y);
          y += 5;
        }
      });
      y += 5;

      // Section C: Contributions
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('C. Contributions to Science', margin, y);
      y += 6;
      data.contributions.forEach((contrib, i) => {
        if (contrib.title) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text(`${i + 1}. ${contrib.title}`, margin, y);
          y += 5;
          doc.setFont('helvetica', 'normal');
          const descLines = doc.splitTextToSize(contrib.description, maxWidth);
          doc.text(descLines, margin, y);
          y += descLines.length * 4 + 3;
        }
      });

      // Section D: Research Support (NIH only)
      if (format === 'nih' && data.grants.length > 0) {
        y += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('D. Research Support', margin, y);
        y += 6;
        
        const activeGrants = data.grants.filter(g => g.status === 'active');
        const completedGrants = data.grants.filter(g => g.status === 'completed');

        if (activeGrants.length > 0) {
          doc.setFontSize(9);
          doc.text('Ongoing Research Support', margin, y);
          y += 5;
          doc.setFont('helvetica', 'normal');
          activeGrants.forEach(grant => {
            doc.text(`${grant.funder} - ${grant.title} (${grant.role}) ${grant.period}`, margin, y);
            y += 5;
          });
        }

        if (completedGrants.length > 0) {
          y += 3;
          doc.setFont('helvetica', 'bold');
          doc.text('Completed Research Support', margin, y);
          y += 5;
          doc.setFont('helvetica', 'normal');
          completedGrants.forEach(grant => {
            doc.text(`${grant.funder} - ${grant.title} (${grant.role}) ${grant.period}`, margin, y);
            y += 5;
          });
        }
      }

      doc.save(`biosketch_${format}_${data.name.replace(/\s+/g, '_') || 'export'}.pdf`);
      toast.success(`${format.toUpperCase()} Biosketch exported`);
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Statement' },
    { id: 'positions', label: 'Positions & Honors' },
    { id: 'contributions', label: 'Contributions' },
    { id: 'grants', label: 'Research Support' },
  ] as const;

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Biosketch Builder</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Dr. Jane Smith"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ORCID
              {data.orcid && (
                validateOrcid(data.orcid) 
                  ? <CheckCircle className="w-4 h-4 text-emerald-500 inline ml-2" />
                  : <AlertCircle className="w-4 h-4 text-red-500 inline ml-2" />
              )}
            </label>
            <input
              type="text"
              value={data.orcid}
              onChange={(e) => updateField('orcid', e.target.value)}
              placeholder="0000-0000-0000-0000"
              className={`w-full px-3 py-2 border rounded-lg ${
                data.orcid && !validateOrcid(data.orcid) ? 'border-red-300' : 'border-slate-300'
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">eRA Commons ID</label>
            <input
              type="text"
              value={data.eraCommons}
              onChange={(e) => updateField('eraCommons', e.target.value.toUpperCase())}
              placeholder="JSMITH123"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'personal' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Personal Statement (describes your qualifications for this project)
            </label>
            <textarea
              value={data.personalStatement}
              onChange={(e) => updateField('personalStatement', e.target.value)}
              rows={8}
              placeholder="Describe your expertise, qualifications, and why you are suited for this project..."
              className="w-full px-4 py-3 border border-slate-300 rounded-xl resize-none"
            />
            <p className="text-xs text-slate-500 mt-2">
              {data.personalStatement.split(/\s+/).filter(Boolean).length} words
            </p>
          </div>
        )}

        {activeTab === 'positions' && (
          <div className="space-y-4">
            {data.positions.map((pos, i) => (
              <div key={i} className="grid grid-cols-5 gap-3 items-end">
                <input
                  type="text"
                  value={pos.position}
                  onChange={(e) => updatePosition(i, 'position', e.target.value)}
                  placeholder="Position/Title"
                  className="px-3 py-2 border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  value={pos.institution}
                  onChange={(e) => updatePosition(i, 'institution', e.target.value)}
                  placeholder="Institution"
                  className="px-3 py-2 border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  value={pos.startDate}
                  onChange={(e) => updatePosition(i, 'startDate', e.target.value)}
                  placeholder="Start (YYYY)"
                  className="px-3 py-2 border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  value={pos.endDate}
                  onChange={(e) => updatePosition(i, 'endDate', e.target.value)}
                  placeholder="End (YYYY)"
                  className="px-3 py-2 border border-slate-300 rounded-lg"
                />
                <button onClick={() => removePosition(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button onClick={addPosition} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
              <Plus className="w-4 h-4" /> Add Position
            </button>
          </div>
        )}

        {activeTab === 'contributions' && (
          <div className="space-y-6">
            <p className="text-sm text-slate-600">Up to 5 contributions to science (with up to 4 citations each)</p>
            {data.contributions.map((contrib, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Contribution {i + 1}</span>
                  {data.contributions.length > 1 && (
                    <button onClick={() => setData(prev => ({ ...prev, contributions: prev.contributions.filter((_, idx) => idx !== i) }))} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={contrib.title}
                  onChange={(e) => updateContribution(i, 'title', e.target.value)}
                  placeholder="Contribution Title"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
                <textarea
                  value={contrib.description}
                  onChange={(e) => updateContribution(i, 'description', e.target.value)}
                  placeholder="Description of contribution and its impact..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
                />
              </div>
            ))}
            {data.contributions.length < 5 && (
              <button onClick={addContribution} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
                <Plus className="w-4 h-4" /> Add Contribution
              </button>
            )}
          </div>
        )}

        {activeTab === 'grants' && (
          <div className="space-y-4">
            {data.grants.map((grant, i) => (
              <div key={i} className="grid grid-cols-6 gap-3 items-end">
                <input
                  type="text"
                  value={grant.title}
                  onChange={(e) => updateGrant(i, 'title', e.target.value)}
                  placeholder="Project Title"
                  className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  value={grant.funder}
                  onChange={(e) => updateGrant(i, 'funder', e.target.value)}
                  placeholder="Funder"
                  className="px-3 py-2 border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  value={grant.role}
                  onChange={(e) => updateGrant(i, 'role', e.target.value)}
                  placeholder="Role"
                  className="px-3 py-2 border border-slate-300 rounded-lg"
                />
                <select
                  value={grant.status}
                  onChange={(e) => updateGrant(i, 'status', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
                <button onClick={() => setData(prev => ({ ...prev, grants: prev.grants.filter((_, idx) => idx !== i) }))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button onClick={addGrant} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
              <Plus className="w-4 h-4" /> Add Grant
            </button>
          </div>
        )}
      </div>

      {/* Export Footer */}
      <div className="p-6 border-t border-slate-200 flex gap-3">
        <button
          onClick={() => exportPDF('nih')}
          disabled={exporting}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700"
        >
          {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          Export NIH Biosketch
        </button>
        <button
          onClick={() => exportPDF('nsf')}
          disabled={exporting}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-600 text-white py-3 rounded-xl font-semibold hover:bg-slate-700"
        >
          {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          Export NSF Biosketch
        </button>
      </div>
    </div>
  );
}