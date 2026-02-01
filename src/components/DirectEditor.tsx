import React, { useState } from 'react';
import { FileText, MessageSquare, Wand2 } from 'lucide-react';

interface DirectEditorProps {
  module: string;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  children?: React.ReactNode; // For questionnaire
}

const MODULE_CONFIG: Record<string, { title: string; placeholder: string; field: string }> = {
  concept: {
    title: 'Research Concept',
    placeholder: 'Describe your research concept, its significance, and the gap in knowledge it addresses...',
    field: 'content'
  },
  hypothesis: {
    title: 'Central Hypothesis',
    placeholder: 'State your central hypothesis and the rationale behind it...',
    field: 'content'
  },
  specific_aims: {
    title: 'Specific Aims',
    placeholder: 'List and describe your specific aims. Include measurable objectives and expected outcomes...',
    field: 'content'
  },
  team: {
    title: 'Key Personnel',
    placeholder: 'Describe each key team member, their roles, qualifications, and contributions to the project...',
    field: 'content'
  },
  approach: {
    title: 'Research Approach',
    placeholder: 'Detail your research methodology, experimental design, data analysis plans, and timeline...',
    field: 'content'
  },
  budget: {
    title: 'Budget Justification',
    placeholder: 'Justify your budget requests for personnel, equipment, supplies, travel, and other costs...',
    field: 'content'
  },
  preliminary_data: {
    title: 'Preliminary Data',
    placeholder: 'Present your preliminary findings, pilot study results, or supporting data...',
    field: 'content'
  },
  summary_figure: {
    title: 'Summary Figure',
    placeholder: 'Describe your summary figure concept or paste figure caption here...',
    field: 'content'
  }
};

export const DirectEditor: React.FC<DirectEditorProps> = ({ module, data, onChange, children }) => {
  const [mode, setMode] = useState<'write' | 'guided'>('write');
  const config = MODULE_CONFIG[module];
  
  if (!config) return children || null;

  const content = (data[config.field] as string) || '';
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const pageCount = (wordCount / 250).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('write')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'write' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Write/Edit
          </button>
          <button
            onClick={() => setMode('guided')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'guided' ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Guided
          </button>
        </div>
        <div className="text-sm text-gray-500">
          {wordCount} words · ~{pageCount} pages
        </div>
      </div>

      {mode === 'write' ? (
        <div className="space-y-3">
          <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
            <textarea
              value={content}
              onChange={(e) => onChange({ ...data, [config.field]: e.target.value })}
              placeholder={config.placeholder}
              rows={20}
              className="w-full px-4 py-3 text-gray-800 placeholder-gray-400 resize-none focus:outline-none"
              style={{ minHeight: '400px' }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Write directly or paste your content here</span>
            <span>Auto-saved on changes</span>
          </div>
        </div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
};

export default DirectEditor;
