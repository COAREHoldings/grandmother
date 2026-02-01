import { useState } from 'react';
import { FileText, Copy, Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

type LetterType = 'support' | 'consultant' | 'vendor' | 'subcontract';

interface LetterTemplate {
  type: LetterType;
  title: string;
  description: string;
  fields: { key: string; label: string; placeholder: string; multiline?: boolean }[];
  template: (data: Record<string, string>) => string;
}

const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    type: 'support',
    title: 'Letter of Support',
    description: 'From collaborators confirming their participation',
    fields: [
      { key: 'collaboratorName', label: 'Collaborator Name', placeholder: 'Dr. Jane Smith' },
      { key: 'collaboratorTitle', label: 'Title & Institution', placeholder: 'Professor, University of California' },
      { key: 'piName', label: 'PI Name', placeholder: 'Dr. John Doe' },
      { key: 'projectTitle', label: 'Project Title', placeholder: 'Novel Biomarkers for Cancer Detection' },
      { key: 'contribution', label: 'Your Contribution', placeholder: 'Describe specific contribution...', multiline: true },
    ],
    template: (d) => `Dear Selection Committee,

I am writing to express my strong support for the research project titled "${d.projectTitle}" led by ${d.piName}.

As ${d.collaboratorTitle}, I have collaborated with ${d.piName.split(' ').pop()} on related research and am confident in their ability to successfully complete this project.

My contribution to this project will include: ${d.contribution}

I am committed to providing the necessary expertise and resources to ensure the success of this research endeavor. I look forward to this collaboration and believe the proposed research will make significant contributions to the field.

Sincerely,

${d.collaboratorName}
${d.collaboratorTitle}`,
  },
  {
    type: 'consultant',
    title: 'Consultant Commitment Letter',
    description: 'From consultants confirming availability and expertise',
    fields: [
      { key: 'consultantName', label: 'Consultant Name', placeholder: 'Dr. Expert Advisor' },
      { key: 'consultantTitle', label: 'Title & Affiliation', placeholder: 'Senior Consultant, BioTech Inc.' },
      { key: 'piName', label: 'PI Name', placeholder: 'Dr. John Doe' },
      { key: 'projectTitle', label: 'Project Title', placeholder: 'Novel Biomarkers Study' },
      { key: 'expertise', label: 'Area of Expertise', placeholder: 'Bioinformatics, data analysis' },
      { key: 'hoursYear', label: 'Hours per Year', placeholder: '40' },
      { key: 'rate', label: 'Hourly Rate ($)', placeholder: '200' },
    ],
    template: (d) => `Dear ${d.piName},

I am pleased to confirm my commitment to serve as a consultant on your project titled "${d.projectTitle}."

I will provide expertise in ${d.expertise} and will be available for approximately ${d.hoursYear} hours per year at a rate of $${d.rate}/hour.

My specific contributions will include:
- Expert consultation on methodology and approach
- Review of relevant data and analysis
- Recommendations for project optimization

I confirm my availability for the duration of the project and look forward to contributing to this important research.

Sincerely,

${d.consultantName}
${d.consultantTitle}`,
  },
  {
    type: 'vendor',
    title: 'Vendor/Resource Letter',
    description: 'From vendors confirming access to equipment or services',
    fields: [
      { key: 'vendorName', label: 'Contact Name', placeholder: 'Sales Manager' },
      { key: 'company', label: 'Company Name', placeholder: 'LabEquip Corp' },
      { key: 'piName', label: 'PI Name', placeholder: 'Dr. John Doe' },
      { key: 'resource', label: 'Resource/Equipment', placeholder: 'High-throughput sequencing services' },
      { key: 'terms', label: 'Terms/Pricing', placeholder: 'Standard academic pricing, 2-week turnaround' },
    ],
    template: (d) => `To Whom It May Concern,

${d.company} is pleased to confirm our commitment to provide ${d.resource} to support the research project led by ${d.piName}.

Terms of service:
${d.terms}

We have the capacity and resources to fulfill the requirements of this project within the proposed timeline. Our team has extensive experience supporting federally-funded research projects.

Please contact us for any additional information.

Sincerely,

${d.vendorName}
${d.company}`,
  },
  {
    type: 'subcontract',
    title: 'Subcontract Letter',
    description: 'From subcontract institution confirming participation',
    fields: [
      { key: 'subPiName', label: 'Subcontract PI Name', placeholder: 'Dr. Partner Investigator' },
      { key: 'institution', label: 'Institution', placeholder: 'Partner University' },
      { key: 'leadPiName', label: 'Lead PI Name', placeholder: 'Dr. John Doe' },
      { key: 'projectTitle', label: 'Project Title', placeholder: 'Collaborative Research Project' },
      { key: 'scope', label: 'Scope of Work', placeholder: 'Describe subcontract responsibilities...', multiline: true },
      { key: 'budget', label: 'Subcontract Budget', placeholder: '$150,000 over 3 years' },
    ],
    template: (d) => `Dear ${d.leadPiName},

This letter confirms the commitment of ${d.institution} to participate as a subcontractor on the project titled "${d.projectTitle}."

As Subcontract PI, I (${d.subPiName}) will be responsible for the following scope of work:
${d.scope}

The subcontract budget of ${d.budget} will support personnel, supplies, and other direct costs associated with our portion of the research.

${d.institution} has reviewed and approved this collaboration. All necessary institutional resources and facilities will be made available to support this project.

Sincerely,

${d.subPiName}
${d.institution}`,
  },
];

export default function LetterGenerator() {
  const [selectedType, setSelectedType] = useState<LetterType>('support');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [exporting, setExporting] = useState(false);

  const currentTemplate = LETTER_TEMPLATES.find(t => t.type === selectedType)!;

  const generateLetter = () => {
    const letter = currentTemplate.template(formData);
    setGeneratedLetter(letter);
    toast.success('Letter generated');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter);
    toast.success('Copied to clipboard');
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const margin = 25;
      const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
      
      doc.setFontSize(11);
      doc.setFont('times', 'normal');
      
      const lines = doc.splitTextToSize(generatedLetter, maxWidth);
      let y = margin;
      
      for (const line of lines) {
        if (y > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 6;
      }
      
      doc.save(`${currentTemplate.title.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF exported');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Letter Generation Engine</h2>
        
        {/* Letter Type Selection */}
        <div className="grid grid-cols-4 gap-3">
          {LETTER_TEMPLATES.map(template => (
            <button
              key={template.type}
              onClick={() => { setSelectedType(template.type); setGeneratedLetter(''); }}
              className={`p-4 rounded-xl text-left transition-all ${
                selectedType === template.type
                  ? 'bg-indigo-50 border-2 border-indigo-600'
                  : 'bg-slate-50 border-2 border-transparent hover:border-slate-200'
              }`}
            >
              <FileText className={`w-5 h-5 mb-2 ${selectedType === template.type ? 'text-indigo-600' : 'text-slate-400'}`} />
              <p className="font-medium text-slate-900 text-sm">{template.title}</p>
              <p className="text-xs text-slate-500 mt-1">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 divide-x divide-slate-200">
        {/* Form Fields */}
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-slate-800">Fill in Details</h3>
          {currentTemplate.fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
              {field.multiline ? (
                <textarea
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              )}
            </div>
          ))}
          <button
            onClick={generateLetter}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700"
          >
            Generate Letter
          </button>
        </div>

        {/* Preview */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Preview</h3>
            {generatedLetter && (
              <div className="flex gap-2">
                <button onClick={copyToClipboard} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={exportPDF} disabled={exporting} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
          <div className="bg-slate-50 rounded-xl p-4 min-h-[400px]">
            {generatedLetter ? (
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-serif">{generatedLetter}</pre>
            ) : (
              <p className="text-slate-400 text-center mt-20">Fill in the form and click Generate</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}