import { useState } from 'react';
import { Upload, FileText, CheckCircle, Circle, AlertTriangle, Link2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Concern {
  id: string;
  category: 'significance' | 'innovation' | 'approach' | 'investigator' | 'environment' | 'other';
  summary: string;
  fullText: string;
  resolution: string;
  linkedSection: string;
  status: 'unaddressed' | 'in_progress' | 'resolved';
}

interface Props {
  projectId: string;
  onConcernsUpdate?: (concerns: Concern[]) => void;
}

const CATEGORIES = [
  { value: 'significance', label: 'Significance', color: 'bg-blue-100 text-blue-700' },
  { value: 'innovation', label: 'Innovation', color: 'bg-purple-100 text-purple-700' },
  { value: 'approach', label: 'Approach', color: 'bg-amber-100 text-amber-700' },
  { value: 'investigator', label: 'Investigator', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'environment', label: 'Environment', color: 'bg-slate-100 text-slate-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' },
];

const SECTIONS = [
  'specific_aims', 'significance', 'innovation', 'approach', 
  'preliminary_data', 'team', 'budget', 'facilities'
];

export default function ResubmissionTracker({ projectId, onConcernsUpdate }: Props) {
  const [critiqueText, setCritiqueText] = useState('');
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [parsing, setParsing] = useState(false);

  const parseCritique = () => {
    if (!critiqueText.trim()) {
      toast.error('Please paste critique text first');
      return;
    }

    setParsing(true);
    
    // Parse critique into concerns
    const parsed: Concern[] = [];
    const lines = critiqueText.split('\n');
    
    // Look for numbered weaknesses or concerns
    const weaknessPatterns = [
      /weakness[es]?:?\s*/i,
      /concern[s]?:?\s*/i,
      /needs? improvement/i,
      /should address/i,
      /lacking/i,
      /insufficient/i,
      /unclear/i,
    ];

    let currentText = '';
    let foundConcern = false;

    lines.forEach((line, idx) => {
      const isWeakness = weaknessPatterns.some(p => p.test(line));
      const isNumbered = /^\s*[\d•\-\*]\)?\.?\s/.test(line);
      
      if (isWeakness || (isNumbered && foundConcern)) {
        if (currentText.trim()) {
          parsed.push(createConcern(currentText.trim()));
        }
        currentText = line;
        foundConcern = true;
      } else if (foundConcern && line.trim()) {
        currentText += ' ' + line.trim();
      }
    });

    if (currentText.trim()) {
      parsed.push(createConcern(currentText.trim()));
    }

    // If no structured concerns found, create one from the whole text
    if (parsed.length === 0 && critiqueText.trim()) {
      parsed.push(createConcern(critiqueText.trim()));
    }

    setConcerns(parsed);
    onConcernsUpdate?.(parsed);
    toast.success(`Parsed ${parsed.length} reviewer concerns`);
    setParsing(false);
  };

  const createConcern = (text: string): Concern => {
    // Auto-categorize based on keywords
    let category: Concern['category'] = 'other';
    if (/significance|importance|impact|burden/i.test(text)) category = 'significance';
    else if (/innovat|novel|new approach/i.test(text)) category = 'innovation';
    else if (/approach|method|design|analysis|feasib/i.test(text)) category = 'approach';
    else if (/investigator|PI|team|experience|expertise/i.test(text)) category = 'investigator';
    else if (/environment|resource|facility|equipment/i.test(text)) category = 'environment';

    return {
      id: Math.random().toString(36).substr(2, 9),
      category,
      summary: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      fullText: text,
      resolution: '',
      linkedSection: '',
      status: 'unaddressed',
    };
  };

  const updateConcern = (id: string, updates: Partial<Concern>) => {
    const updated = concerns.map(c => c.id === id ? { ...c, ...updates } : c);
    setConcerns(updated);
    onConcernsUpdate?.(updated);
  };

  const removeConcern = (id: string) => {
    const updated = concerns.filter(c => c.id !== id);
    setConcerns(updated);
    onConcernsUpdate?.(updated);
  };

  const addManualConcern = () => {
    const newConcern = createConcern('New reviewer concern...');
    setConcerns([...concerns, newConcern]);
  };

  const resolvedCount = concerns.filter(c => c.status === 'resolved').length;
  const progress = concerns.length > 0 ? Math.round((resolvedCount / concerns.length) * 100) : 0;

  const StatusIcon = ({ status }: { status: Concern['status'] }) => {
    if (status === 'resolved') return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (status === 'in_progress') return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    return <Circle className="w-5 h-5 text-slate-300" />;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Resubmission Intelligence</h2>
        <p className="text-slate-600 text-sm">Parse reviewer critiques and track resolution of concerns</p>
      </div>

      {/* Critique Upload */}
      <div className="p-6 border-b border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Paste Reviewer Critique / Summary Statement
        </label>
        <textarea
          value={critiqueText}
          onChange={(e) => setCritiqueText(e.target.value)}
          placeholder="Paste the critique text here. Include all reviewer comments, weaknesses, and concerns..."
          rows={6}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl resize-none mb-4"
        />
        <button
          onClick={parseCritique}
          disabled={parsing}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {parsing ? 'Parsing...' : 'Parse Critique'}
        </button>
      </div>

      {/* Progress */}
      {concerns.length > 0 && (
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-slate-800">Resolution Progress</span>
            <span className="text-sm text-slate-600">{resolvedCount} / {concerns.length} resolved</span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Concerns List */}
      <div className="p-6">
        {concerns.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No concerns parsed yet. Paste critique above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {concerns.map((concern, idx) => (
              <div key={concern.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-50 flex items-start gap-3">
                  <button onClick={() => updateConcern(concern.id, { 
                    status: concern.status === 'resolved' ? 'unaddressed' : 
                            concern.status === 'in_progress' ? 'resolved' : 'in_progress'
                  })}>
                    <StatusIcon status={concern.status} />
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-slate-500">#{idx + 1}</span>
                      <select
                        value={concern.category}
                        onChange={(e) => updateConcern(concern.id, { category: e.target.value as Concern['category'] })}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          CATEGORIES.find(c => c.value === concern.category)?.color
                        }`}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                      <button onClick={() => removeConcern(concern.id)} className="ml-auto text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-700">{concern.fullText}</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> Link to Section
                    </label>
                    <select
                      value={concern.linkedSection}
                      onChange={(e) => updateConcern(concern.id, { linkedSection: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">Select section...</option>
                      {SECTIONS.map(sec => (
                        <option key={sec} value={sec}>{sec.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Resolution Notes</label>
                    <textarea
                      value={concern.resolution}
                      onChange={(e) => updateConcern(concern.id, { resolution: e.target.value })}
                      placeholder="How this concern will be addressed in the resubmission..."
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button
              onClick={addManualConcern}
              className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-slate-400 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Concern Manually
            </button>
          </div>
        )}
      </div>
    </div>
  );
}