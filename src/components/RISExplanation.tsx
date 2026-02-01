import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react';

// Version-controlled static messages - DO NOT generate dynamically
const RIS_CONFIG = {
  version: '1.0.0',
  
  scoreBands: {
    strong: {
      min: 85,
      label: 'Strong',
      color: '#22c55e',
      bgColor: '#f0fdf4',
      message: 'Your grant demonstrates strong reference integrity. The claims made throughout your application are well-supported by verified, peer-reviewed research. This level of documentation meets the highest standards for evidence-based grant writing.'
    },
    adequate: {
      min: 70,
      label: 'Adequate',
      color: '#84cc16',
      bgColor: '#f7fee7',
      message: 'Your grant shows adequate reference integrity. Most claims are supported by appropriate references, though some areas could benefit from additional verification or stronger source documentation.'
    },
    weak: {
      min: 50,
      label: 'Needs Improvement',
      color: '#eab308',
      bgColor: '#fefce8',
      message: 'Your grant has areas where reference integrity could be strengthened. Several claims lack sufficient supporting evidence or rely on references that may not adequately substantiate the assertions made.'
    },
    critical: {
      min: 0,
      label: 'Critical Review Needed',
      color: '#ef4444',
      bgColor: '#fef2f2',
      message: 'Your grant requires significant attention to reference integrity. Many claims are either unsupported or inadequately documented. We recommend a thorough review of all factual statements and their supporting evidence.'
    }
  },

  sectionMessage: 'This section score reflects how well the claims in this section are supported by verified research references.',

  strictModeBlockedMessage: 'Export is temporarily blocked because one or more critical claims do not meet the required evidence support threshold. Please review the highlighted claims and references.',

  supportStatus: {
    supported: { label: 'Supported', color: '#22c55e', icon: 'check' },
    weak: { label: 'Weak Support', color: '#eab308', icon: 'alert' },
    missing: { label: 'Missing', color: '#ef4444', icon: 'x' }
  }
};

interface ClaimDetail {
  id: string;
  claim_text: string;
  support_status: 'supported' | 'weak' | 'missing';
  best_reference?: {
    title: string;
    year: number;
  };
  alignment_score: number;
  validation_flags: {
    peer_reviewed: boolean;
    retracted: boolean;
    preprint: boolean;
  };
}

interface SectionRIS {
  section_name: string;
  score: number;
  claims: ClaimDetail[];
}

interface RISExplanationProps {
  overall_ris: number;
  section_ris: SectionRIS[];
  strict_mode: boolean;
  blocked_reason?: string;
}

function getScoreBand(score: number) {
  if (score >= 85) return RIS_CONFIG.scoreBands.strong;
  if (score >= 70) return RIS_CONFIG.scoreBands.adequate;
  if (score >= 50) return RIS_CONFIG.scoreBands.weak;
  return RIS_CONFIG.scoreBands.critical;
}

function StatusIcon({ status }: { status: 'supported' | 'weak' | 'missing' }) {
  const config = RIS_CONFIG.supportStatus[status];
  if (config.icon === 'check') return <CheckCircle className="w-4 h-4" style={{ color: config.color }} />;
  if (config.icon === 'alert') return <AlertCircle className="w-4 h-4" style={{ color: config.color }} />;
  return <XCircle className="w-4 h-4" style={{ color: config.color }} />;
}

export const RISExplanation: React.FC<RISExplanationProps> = ({
  overall_ris,
  section_ris,
  strict_mode,
  blocked_reason
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showTransparency, setShowTransparency] = useState(false);

  const band = getScoreBand(overall_ris);
  const isBlocked = strict_mode && blocked_reason;

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  return (
    <div className="space-y-6">
      {/* Strict Mode Block Warning */}
      {isBlocked && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-800">Export Blocked</h4>
            <p className="text-sm text-red-700 mt-1">{RIS_CONFIG.strictModeBlockedMessage}</p>
          </div>
        </div>
      )}

      {/* Overall Score Card */}
      <div className="rounded-xl border-2 p-6" style={{ borderColor: band.color, backgroundColor: band.bgColor }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" style={{ color: band.color }} />
            <div>
              <h3 className="text-lg font-bold text-gray-800">Reference Integrity Score</h3>
              <span className="text-sm font-medium" style={{ color: band.color }}>{band.label}</span>
            </div>
          </div>
          <div className="text-4xl font-bold" style={{ color: band.color }}>
            {overall_ris}
          </div>
        </div>
        <p className="text-gray-700 text-sm leading-relaxed">{band.message}</p>
        <div className="mt-3 text-xs text-gray-500">RIS Engine v{RIS_CONFIG.version}</div>
      </div>

      {/* Section Scores */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-800">Section Breakdown</h4>
        {section_ris.map((section) => {
          const sectionBand = getScoreBand(section.score);
          const isExpanded = expandedSections[section.section_name];

          return (
            <div key={section.section_name} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.section_name)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: sectionBand.color }}
                  />
                  <span className="font-medium text-gray-800 capitalize">
                    {section.section_name.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold" style={{ color: sectionBand.color }}>
                    {section.score}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t bg-gray-50">
                  <p className="text-sm text-gray-600 py-3">{RIS_CONFIG.sectionMessage}</p>
                  
                  {section.claims.length > 0 ? (
                    <div className="space-y-2">
                      {section.claims.map((claim) => (
                        <div key={claim.id} className="bg-white p-3 rounded border text-sm">
                          <div className="flex items-start gap-2">
                            <StatusIcon status={claim.support_status} />
                            <div className="flex-1">
                              <p className="text-gray-800">{claim.claim_text}</p>
                              {claim.best_reference && (
                                <p className="text-gray-500 text-xs mt-1">
                                  Ref: {claim.best_reference.title} ({claim.best_reference.year})
                                </p>
                              )}
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100">
                              {(claim.alignment_score * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No claims analyzed in this section</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Transparency Panel */}
      <div className="border rounded-lg">
        <button
          onClick={() => setShowTransparency(!showTransparency)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <span className="font-medium text-gray-700">Transparency Details</span>
          {showTransparency ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {showTransparency && (
          <div className="px-4 pb-4 border-t">
            <table className="w-full text-sm mt-3">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Claim</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Reference</th>
                  <th className="pb-2">Alignment</th>
                  <th className="pb-2">Flags</th>
                </tr>
              </thead>
              <tbody>
                {section_ris.flatMap((section) =>
                  section.claims.map((claim) => (
                    <tr key={claim.id} className="border-b last:border-0">
                      <td className="py-2 pr-2 max-w-xs truncate">{claim.claim_text.substring(0, 50)}...</td>
                      <td className="py-2">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: RIS_CONFIG.supportStatus[claim.support_status].color + '20',
                            color: RIS_CONFIG.supportStatus[claim.support_status].color
                          }}
                        >
                          {RIS_CONFIG.supportStatus[claim.support_status].label}
                        </span>
                      </td>
                      <td className="py-2 text-gray-600">
                        {claim.best_reference ? `${claim.best_reference.year}` : '-'}
                      </td>
                      <td className="py-2">{(claim.alignment_score * 100).toFixed(0)}%</td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          {claim.validation_flags.peer_reviewed && (
                            <span className="text-xs bg-green-100 text-green-700 px-1 rounded">PR</span>
                          )}
                          {claim.validation_flags.retracted && (
                            <span className="text-xs bg-red-100 text-red-700 px-1 rounded">RET</span>
                          )}
                          {claim.validation_flags.preprint && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">PRE</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {section_ris.flatMap(s => s.claims).length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">No claims data available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RISExplanation;
export { RIS_CONFIG };
