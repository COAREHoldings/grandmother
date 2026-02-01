import { useState } from 'react';
import { Download, AlertTriangle, CheckCircle, XCircle, FileWarning, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

interface Props {
  projectId: string;
  projectData: any;
  isValid: boolean;
  issues: string[];
}

export default function ExportValidation({ projectId, projectData, isValid, issues }: Props) {
  const [exporting, setExporting] = useState(false);
  const [showOverride, setShowOverride] = useState(false);

  const extractContent = (data: any): string => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
      return Object.entries(data)
        .filter(([_, v]) => typeof v === 'string' && v.length > 0)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
        .join('\n\n');
    }
    return '';
  };

  const generatePDF = async (isDraft: boolean) => {
    setExporting(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      let yPos = margin;

      const addWatermark = () => {
        if (isDraft) {
          doc.setTextColor(220, 220, 220);
          doc.setFontSize(60);
          doc.text('DRAFT', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
          doc.setTextColor(0, 0, 0);
        }
      };

      addWatermark();

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      const title = projectData?.title || 'Untitled Grant Application';
      doc.text(title, margin, yPos, { maxWidth });
      yPos += 15;

      // Metadata
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
      yPos += 5;
      if (projectData?.target_agency) {
        doc.text(`Agency: ${projectData.target_agency}`, margin, yPos);
        yPos += 5;
      }
      yPos += 10;
      doc.setTextColor(0, 0, 0);

      // Section definitions
      const sections = [
        { key: 'concept', title: 'Research Concept' },
        { key: 'hypothesis', title: 'Hypothesis' },
        { key: 'specific_aims', title: 'Specific Aims' },
        { key: 'approach', title: 'Research Approach' },
        { key: 'preliminary_data', title: 'Preliminary Data' },
        { key: 'team', title: 'Key Personnel' },
        { key: 'budget', title: 'Budget' },
      ];

      for (const section of sections) {
        const content = extractContent(projectData?.[section.key]);
        if (!content || content.trim().length === 0) continue;

        // Check page break
        if (yPos > pageHeight - 50) {
          doc.addPage();
          yPos = margin;
          addWatermark();
        }

        // Section header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text(section.title, margin, yPos);
        yPos += 8;

        // Section content
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        const lines = doc.splitTextToSize(content, maxWidth);
        for (const line of lines) {
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = margin;
            addWatermark();
          }
          doc.text(line, margin, yPos);
          yPos += 6;
        }
        yPos += 12;
      }

      // Footer on last page
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`GRANTFATHER - Project ID: ${projectId}`, margin, pageHeight - 10);

      // Save
      const filename = `${(projectData?.title || 'grant').replace(/[^a-z0-9]/gi, '_').substring(0, 30)}_${isDraft ? 'DRAFT_' : ''}${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      toast.success(isDraft ? 'Draft PDF exported with watermark' : 'PDF exported successfully');
    } catch (err: any) {
      console.error('PDF export error:', err);
      toast.error(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const errors = issues.filter(i => i.includes('Missing') || i.includes('exceeds'));
  const warnings = issues.filter(i => !errors.includes(i));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Export Validation</h3>

      {isValid ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg mb-6">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
          <div>
            <p className="font-medium text-emerald-800">Ready for Export</p>
            <p className="text-sm text-emerald-700">All required sections present and within limits</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {errors.length > 0 && (
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Blocking Issues ({errors.length})</span>
              </div>
              <ul className="space-y-1 ml-7">
                {errors.map((issue, i) => (
                  <li key={i} className="text-sm text-red-700">• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-800">Warnings ({warnings.length})</span>
              </div>
              <ul className="space-y-1 ml-7">
                {warnings.map((issue, i) => (
                  <li key={i} className="text-sm text-amber-700">• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => generatePDF(false)}
          disabled={!isValid || exporting}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
            isValid 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          Export Final PDF
        </button>

        {!isValid && (
          <button
            onClick={() => setShowOverride(!showOverride)}
            className="px-4 py-3 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50"
            title="Export as draft"
          >
            <FileWarning className="w-5 h-5" />
          </button>
        )}
      </div>

      {showOverride && !isValid && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 mb-3">
            <strong>Draft Export:</strong> PDF will include a "DRAFT" watermark on all pages.
          </p>
          <button
            onClick={() => generatePDF(true)}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export as Draft (with watermark)
          </button>
        </div>
      )}
    </div>
  );
}