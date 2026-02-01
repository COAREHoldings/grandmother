import { useState } from 'react';
import { FileText, Download, Copy, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { GfProject } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Props {
  project: GfProject | null;
}

export default function CompileGrant({ project }: Props) {
  const [compiling, setCompiling] = useState(false);
  const [compiledGrant, setCompiledGrant] = useState<string | null>(null);
  const [editedGrant, setEditedGrant] = useState<string>('');

  const compileGrant = async () => {
    if (!project) return;
    setCompiling(true);

    try {
      // Compile all module data into formatted grant text
      const compiled = generateGrantText(project);
      setCompiledGrant(compiled);
      setEditedGrant(compiled);
      toast.success('Grant compiled successfully!');
    } catch (error) {
      toast.error('Failed to compile grant');
    } finally {
      setCompiling(false);
    }
  };

  const generateGrantText = (project: GfProject): string => {
    const sections: string[] = [];
    
    // Title
    sections.push(`# ${project.title || 'Untitled Grant Application'}\n`);
    sections.push(`**Agency:** ${project.target_agency || 'Not specified'}`);
    sections.push(`**Mechanism:** ${project.project_type || 'Not specified'}\n`);
    sections.push('---\n');

    // 1. Research Concept / Significance
    const concept = project.concept as Record<string, string> || {};
    if (Object.keys(concept).length > 0) {
      sections.push('## SIGNIFICANCE\n');
      
      if (concept.problem_statement || concept.gap_statement) {
        sections.push('### Knowledge Gap');
        sections.push(concept.problem_statement || concept.gap_statement || '');
        sections.push('');
      }
      
      if (concept.why_important || concept.clinical_burden) {
        sections.push('### Scientific/Clinical Burden');
        sections.push(concept.why_important || concept.clinical_burden || '');
        sections.push('');
      }
      
      if (concept.innovation) {
        sections.push('### Innovation');
        sections.push(concept.innovation);
        sections.push('');
      }
      
      if (concept.long_term_goal) {
        sections.push('### Long-term Goal');
        sections.push(concept.long_term_goal);
        sections.push('');
      }
    }

    // 2. Central Hypothesis
    const hypothesis = project.hypothesis as Record<string, string> || {};
    if (Object.keys(hypothesis).length > 0) {
      sections.push('## CENTRAL HYPOTHESIS\n');
      
      if (hypothesis.central_hypothesis) {
        sections.push(hypothesis.central_hypothesis);
        sections.push('');
      }
      
      if (hypothesis.hypothesis_basis || hypothesis.rationale) {
        sections.push('### Rationale');
        sections.push(hypothesis.hypothesis_basis || hypothesis.rationale || '');
        sections.push('');
      }
      
      if (hypothesis.how_test) {
        sections.push('### Testing Approach');
        sections.push(hypothesis.how_test);
        sections.push('');
      }
    }

    // 3. Specific Aims
    const aims = project.specific_aims as Record<string, string> || {};
    if (Object.keys(aims).length > 0) {
      sections.push('## SPECIFIC AIMS\n');
      
      if (aims.aim1_objective || aims.aim1) {
        sections.push('### Specific Aim 1');
        sections.push(`**Objective:** ${aims.aim1_objective || aims.aim1 || ''}`);
        if (aims.aim1_approach) sections.push(`**Approach:** ${aims.aim1_approach}`);
        if (aims.aim1_outcome) sections.push(`**Expected Outcome:** ${aims.aim1_outcome}`);
        if (aims.aim1_rationale) sections.push(`**Rationale:** ${aims.aim1_rationale}`);
        sections.push('');
      }
      
      if (aims.aim2_objective || aims.aim2) {
        sections.push('### Specific Aim 2');
        sections.push(`**Objective:** ${aims.aim2_objective || aims.aim2 || ''}`);
        if (aims.aim2_approach) sections.push(`**Approach:** ${aims.aim2_approach}`);
        if (aims.aim2_outcome) sections.push(`**Expected Outcome:** ${aims.aim2_outcome}`);
        if (aims.aim2_rationale) sections.push(`**Rationale:** ${aims.aim2_rationale}`);
        sections.push('');
      }
      
      if (aims.aim3_objective || aims.aim3) {
        sections.push('### Specific Aim 3');
        sections.push(`**Objective:** ${aims.aim3_objective || aims.aim3 || ''}`);
        if (aims.aim3_approach) sections.push(`**Approach:** ${aims.aim3_approach}`);
        sections.push('');
      }
    }

    // 4. Research Approach
    const approach = project.approach as Record<string, string> || {};
    if (Object.keys(approach).length > 0) {
      sections.push('## RESEARCH STRATEGY / APPROACH\n');
      
      if (approach.overall_strategy) {
        sections.push('### Overall Strategy');
        sections.push(approach.overall_strategy);
        sections.push('');
      }
      
      if (approach.methods || approach.methodology) {
        sections.push('### Methods');
        sections.push(approach.methods || approach.methodology || '');
        sections.push('');
      }
      
      if (approach.sample_size) {
        sections.push('### Statistical Considerations');
        sections.push(approach.sample_size);
        sections.push('');
      }
      
      if (approach.timeline) {
        sections.push('### Timeline');
        sections.push(approach.timeline);
        sections.push('');
      }
      
      if (approach.potential_problems) {
        sections.push('### Potential Problems');
        sections.push(approach.potential_problems);
        sections.push('');
      }
      
      if (approach.alternative_approaches) {
        sections.push('### Alternative Approaches');
        sections.push(approach.alternative_approaches);
        sections.push('');
      }
      
      if (approach.rigor) {
        sections.push('### Scientific Rigor');
        sections.push(approach.rigor);
        sections.push('');
      }
    }

    // 5. Key Personnel
    const team = project.team as Record<string, string> || {};
    if (Object.keys(team).length > 0) {
      sections.push('## KEY PERSONNEL\n');
      
      if (team.pi_name) {
        sections.push('### Principal Investigator');
        sections.push(`**Name:** ${team.pi_name}`);
        if (team.pi_effort) sections.push(`**Effort:** ${team.pi_effort}%`);
        if (team.pi_qualifications || team.pi_expertise) {
          sections.push(`**Qualifications:** ${team.pi_qualifications || team.pi_expertise}`);
        }
        sections.push('');
      }
      
      if (team.co_investigators || team.coinvestigators) {
        sections.push('### Co-Investigators');
        sections.push(team.co_investigators || team.coinvestigators || '');
        sections.push('');
      }
      
      if (team.team_expertise) {
        sections.push('### Team Expertise');
        sections.push(team.team_expertise);
        sections.push('');
      }
      
      if (team.collaborators || team.consultants) {
        sections.push('### Collaborators/Consultants');
        sections.push(team.collaborators || team.consultants || '');
        sections.push('');
      }
    }

    // 6. Preliminary Data
    const prelim = project.preliminary_data as Record<string, string> || {};
    if (Object.keys(prelim).length > 0) {
      sections.push('## PRELIMINARY DATA\n');
      
      if (prelim.key_findings || prelim.data_summary) {
        sections.push('### Key Findings');
        sections.push(prelim.key_findings || prelim.data_summary || '');
        sections.push('');
      }
      
      if (prelim.feasibility) {
        sections.push('### Feasibility');
        sections.push(prelim.feasibility);
        sections.push('');
      }
      
      if (prelim.figures_description || prelim.figure_descriptions) {
        sections.push('### Figure Descriptions');
        sections.push(prelim.figures_description || prelim.figure_descriptions || '');
        sections.push('');
      }
      
      if (prelim.publications) {
        sections.push('### Relevant Publications');
        sections.push(prelim.publications);
        sections.push('');
      }
    }

    // 7. Budget Summary
    const budget = project.budget as Record<string, any> || {};
    if (Object.keys(budget).length > 0) {
      sections.push('## BUDGET SUMMARY\n');
      
      if (budget.personnel_needs) {
        sections.push('### Personnel');
        sections.push(budget.personnel_needs);
        sections.push('');
      }
      
      if (budget.equipment) {
        sections.push('### Equipment');
        sections.push(budget.equipment);
        sections.push('');
      }
      
      if (budget.supplies) {
        sections.push('### Supplies');
        sections.push(budget.supplies);
        sections.push('');
      }
      
      if (budget.travel) {
        sections.push('### Travel');
        sections.push(budget.travel);
        sections.push('');
      }
      
      if (budget.justification) {
        sections.push('### Budget Justification');
        sections.push(budget.justification);
        sections.push('');
      }
    }

    // 8. Summary Figure
    const figure = project.summary_figure as Record<string, string> || {};
    if (Object.keys(figure).length > 0) {
      sections.push('## SUMMARY FIGURE CONCEPT\n');
      
      if (figure.figure_purpose || figure.figure_concept) {
        sections.push('### Purpose');
        sections.push(figure.figure_purpose || figure.figure_concept || '');
        sections.push('');
      }
      
      if (figure.visual_elements || figure.key_elements) {
        sections.push('### Visual Elements');
        sections.push(figure.visual_elements || figure.key_elements || '');
        sections.push('');
      }
      
      if (figure.narrative_flow) {
        sections.push('### Narrative Flow');
        sections.push(figure.narrative_flow);
        sections.push('');
      }
      
      if (figure.key_takeaway) {
        sections.push('### Key Takeaway');
        sections.push(figure.key_takeaway);
        sections.push('');
      }
    }

    return sections.filter(s => s.trim()).join('\n');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedGrant);
    toast.success('Copied to clipboard!');
  };

  const downloadAsMarkdown = () => {
    const blob = new Blob([editedGrant], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.title || 'grant'}_compiled.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded as Markdown');
  };

  const downloadAsText = () => {
    // Remove markdown formatting for plain text
    const plainText = editedGrant
      .replace(/^#{1,3}\s+/gm, '')
      .replace(/\*\*/g, '')
      .replace(/---/g, '')
      .trim();
    
    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.title || 'grant'}_compiled.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded as Plain Text');
  };

  const downloadAsDocx = async () => {
    const children: Paragraph[] = [];
    const lines = editedGrant.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('# ')) {
        children.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.TITLE }));
      } else if (line.startsWith('## ')) {
        children.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_1 }));
      } else if (line.startsWith('### ')) {
        children.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_2 }));
      } else if (line.startsWith('**') && line.endsWith('**')) {
        children.push(new Paragraph({ children: [new TextRun({ text: line.slice(2, -2), bold: true })] }));
      } else if (line.includes('**')) {
        const parts = line.split(/\*\*/);
        const runs = parts.map((part, i) => new TextRun({ text: part, bold: i % 2 === 1 }));
        children.push(new Paragraph({ children: runs }));
      } else if (line.trim() === '---') {
        children.push(new Paragraph({ text: '' }));
      } else {
        children.push(new Paragraph({ text: line }));
      }
    }

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${project?.title || 'grant'}_compiled.docx`);
    toast.success('Downloaded as DOCX');
  };

  // Calculate completion
  const getModuleCompleteness = () => {
    const modules = ['concept', 'hypothesis', 'specific_aims', 'team', 'approach', 'budget', 'preliminary_data', 'summary_figure'];
    const completed = modules.filter(m => {
      const data = project?.[m as keyof GfProject];
      return data && typeof data === 'object' && Object.keys(data as object).length > 0;
    });
    return { completed: completed.length, total: modules.length };
  };

  const { completed, total } = getModuleCompleteness();

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" />
            <div>
              <h3 className="text-xl font-bold">Compile Your Grant</h3>
              <p className="text-indigo-200">Transform your answers into a formatted grant document</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{completed}/{total}</p>
            <p className="text-indigo-200 text-sm">Modules Complete</p>
          </div>
        </div>

        <div className="w-full h-2 bg-indigo-400/30 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>

        <button
          onClick={compileGrant}
          disabled={compiling || completed === 0}
          className="w-full py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {compiling ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Compiling...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Compile Grant Document
            </>
          )}
        </button>
      </div>

      {/* Compiled Output */}
      {compiledGrant && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="font-medium text-slate-900">Compiled Grant Document</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={downloadAsMarkdown}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <Download className="w-4 h-4" />
                .md
              </button>
              <button
                onClick={downloadAsText}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <Download className="w-4 h-4" />
                .txt
              </button>
              <button
                onClick={downloadAsDocx}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-all"
              >
                <Download className="w-4 h-4" />
                .docx
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <textarea
              value={editedGrant}
              onChange={(e) => setEditedGrant(e.target.value)}
              rows={25}
              className="w-full font-mono text-sm p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-slate-50"
              placeholder="Your compiled grant will appear here..."
            />
          </div>
        </div>
      )}

      {/* Tips */}
      {!compiledGrant && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="font-medium text-amber-800 mb-2">Tips for a Complete Grant</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Answer the guided questions in each module thoroughly</li>
            <li>• The compiler combines all your answers into a structured document</li>
            <li>• You can edit the compiled output before exporting</li>
            <li>• Use the AI Generate feature in each module for assistance</li>
          </ul>
        </div>
      )}
    </div>
  );
}
