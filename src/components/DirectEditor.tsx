import React, { useState } from 'react';
import { FileText, MessageSquare, Sparkles } from 'lucide-react';

interface DirectEditorProps {
  module: string;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  children?: React.ReactNode;
}

const MODULE_CONFIG: Record<string, { title: string; placeholder: string; field: string }> = {
  concept: {
    title: 'Research Concept',
    placeholder: 'Write your research concept here...\n\nDescribe:\n• The specific problem or gap in knowledge you are addressing\n• Why this problem matters and its impact if solved\n• Current approaches and their limitations\n• What makes your approach innovative\n• The long-term goal of your research program',
    field: 'content'
  },
  hypothesis: {
    title: 'Central Hypothesis',
    placeholder: 'Write your central hypothesis here...\n\nInclude:\n• Your central, testable hypothesis\n• Evidence or rationale supporting this hypothesis\n• How you will test it\n• Alternative outcomes you might observe\n• Implications if your hypothesis is correct',
    field: 'content'
  },
  specific_aims: {
    title: 'Specific Aims',
    placeholder: 'Write your specific aims here...\n\nFor each aim, describe:\n• The objective (clear, measurable goal)\n• The approach (key experiments or methods)\n• Expected outcomes (what you will learn or produce)\n\nTypically 2-3 aims for an R01.',
    field: 'content'
  },
  team: {
    title: 'Key Personnel',
    placeholder: 'Describe your team here...\n\nInclude:\n• Principal Investigator name, qualifications, and % effort\n• Co-Investigators and their roles\n• How the team\'s combined expertise addresses project needs\n• External collaborators or consultants',
    field: 'content'
  },
  approach: {
    title: 'Research Approach',
    placeholder: 'Write your research approach here...\n\nDetail:\n• Overall research strategy\n• Specific methods and techniques\n• Sample sizes and power calculations\n• Project timeline with milestones\n• Potential problems and alternative approaches\n• How you will ensure scientific rigor',
    field: 'content'
  },
  budget: {
    title: 'Budget Justification',
    placeholder: 'Write your budget justification here...\n\nInclude:\n• Personnel needs and effort levels\n• Major equipment (items over $5,000)\n• Supplies and consumables\n• Travel requirements\n• Other costs (core facilities, publication fees)\n• Subcontracts or consortium arrangements',
    field: 'content'
  },
  preliminary_data: {
    title: 'Preliminary Data',
    placeholder: 'Present your preliminary data here...\n\nDescribe:\n• Key findings that support your hypothesis\n• Data sources (your lab, pilot studies, literature)\n• Figures you will include and what they demonstrate\n• How this data demonstrates feasibility\n• Relevant publications supporting your work',
    field: 'content'
  },
  summary_figure: {
    title: 'Summary Figure',
    placeholder: 'Describe your summary figure here...\n\nInclude:\n• The main message reviewers should understand at a glance\n• Visual elements (diagrams, flowcharts, timelines, data plots)\n• How the figure tells your research story\n• Caption text for the figure',
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
      {/* Mode Toggle - More prominent */}
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('write')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'write' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            Write / Edit
          </button>
          <button
            onClick={() => setMode('guided')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'guided' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Guided Questions
          </button>
        </div>
        <div className="text-sm font-medium text-slate-600 bg-white px-3 py-1.5 rounded border border-slate-200">
          {wordCount} words · ~{pageCount} pages
        </div>
      </div>

      {mode === 'write' ? (
        <div className="space-y-2">
          {/* Large Writing Area */}
          <div className="border-2 border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-white">
            <textarea
              value={content}
              onChange={(e) => onChange({ ...data, [config.field]: e.target.value })}
              placeholder={config.placeholder}
              className="w-full px-6 py-5 text-base text-slate-800 placeholder-slate-400 resize-none focus:outline-none leading-relaxed"
              style={{ minHeight: '600px' }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500 px-1">
            <span>Write freely or paste your content. Switch to "Guided Questions" for structured prompts.</span>
            <span>Changes auto-saved</span>
          </div>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
          {children}
        </div>
      )}
    </div>
  );
};

export default DirectEditor;
