import { useState, useEffect } from 'react';
import { Scissors, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Suggestion {
  section: string;
  paragraph: number;
  original: string;
  issue: 'verbose' | 'redundant' | 'low_impact';
  suggestion: string;
  savings: number;
}

// Protected content patterns that should never be suggested for removal
const PROTECTED_PATTERNS = [
  /hypothesis/i,
  /specific aim/i,
  /statistical/i,
  /power calculation/i,
  /sample size/i,
  /human subjects?/i,
  /vertebrate animal/i,
  /irb/i,
  /iacuc/i,
  /informed consent/i,
  /data safety/i,
];

interface Props {
  content: string;
  sectionName: string;
  pageLimit?: number;
  currentPages: number;
  onApplySuggestion?: (original: string, replacement: string) => void;
}

export default function ContentReduction({ content, sectionName, pageLimit, currentPages, onApplySuggestion }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const isOverLimit = pageLimit ? currentPages > pageLimit : false;
  const wordsOverLimit = pageLimit ? Math.max(0, Math.round((currentPages - pageLimit) * 300)) : 0;

  useEffect(() => {
    if (content && isOverLimit) {
      analyzeContent();
    }
  }, [content, isOverLimit]);

  const isProtectedContent = (text: string): boolean => {
    return PROTECTED_PATTERNS.some(pattern => pattern.test(text));
  };

  const analyzeContent = () => {
    setAnalyzing(true);
    const newSuggestions: Suggestion[] = [];
    
    const paragraphs = content.split(/\n\n+/);
    
    paragraphs.forEach((para, idx) => {
      if (isProtectedContent(para)) return;
      
      const words = para.split(/\s+/).length;
      
      // Check for verbose patterns
      const verbosePatterns = [
        { pattern: /it is important to note that/gi, replacement: 'notably' },
        { pattern: /in order to/gi, replacement: 'to' },
        { pattern: /due to the fact that/gi, replacement: 'because' },
        { pattern: /at this point in time/gi, replacement: 'now' },
        { pattern: /in the event that/gi, replacement: 'if' },
        { pattern: /a large number of/gi, replacement: 'many' },
        { pattern: /has the ability to/gi, replacement: 'can' },
        { pattern: /it should be noted that/gi, replacement: '' },
        { pattern: /the results of this study suggest/gi, replacement: 'results suggest' },
        { pattern: /there is evidence to suggest/gi, replacement: 'evidence suggests' },
      ];

      verbosePatterns.forEach(({ pattern, replacement }) => {
        if (pattern.test(para)) {
          const condensed = para.replace(pattern, replacement).trim();
          const savings = words - condensed.split(/\s+/).length;
          if (savings > 2) {
            newSuggestions.push({
              section: sectionName,
              paragraph: idx + 1,
              original: para.substring(0, 100) + '...',
              issue: 'verbose',
              suggestion: `Replace verbose phrase with "${replacement || '[remove]'}"`,
              savings,
            });
          }
        }
      });

      // Check for low-impact background (long paragraphs without specific terms)
      if (words > 80 && !para.match(/our|we|this project|proposed|will/gi)) {
        newSuggestions.push({
          section: sectionName,
          paragraph: idx + 1,
          original: para.substring(0, 100) + '...',
          issue: 'low_impact',
          suggestion: 'Consider condensing background information',
          savings: Math.round(words * 0.3),
        });
      }
    });

    // Check for redundancy across paragraphs
    const seenConcepts = new Map<string, number>();
    paragraphs.forEach((para, idx) => {
      if (isProtectedContent(para)) return;
      
      const keyTerms = para.toLowerCase().match(/\b\w{6,}\b/g) || [];
      keyTerms.forEach(term => {
        if (seenConcepts.has(term)) {
          const firstIdx = seenConcepts.get(term)!;
          if (idx - firstIdx > 1) {
            newSuggestions.push({
              section: sectionName,
              paragraph: idx + 1,
              original: `Repeated concept from paragraph ${firstIdx + 1}`,
              issue: 'redundant',
              suggestion: `Consider consolidating discussion of "${term}"`,
              savings: 15,
            });
          }
        } else {
          seenConcepts.set(term, idx);
        }
      });
    });

    setSuggestions(newSuggestions.slice(0, 10));
    setAnalyzing(false);
  };

  const totalSavings = suggestions.reduce((sum, s) => sum + s.savings, 0);
  const potentialPages = totalSavings / 300;

  if (!isOverLimit) {
    return (
      <div className="p-4 bg-emerald-50 rounded-xl flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-emerald-600" />
        <span className="text-emerald-800">Section is within page limits</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-amber-100 transition-all"
      >
        <div className="flex items-center gap-3">
          <Scissors className="w-5 h-5 text-amber-600" />
          <div className="text-left">
            <p className="font-medium text-amber-800">
              Content Reduction Suggestions
            </p>
            <p className="text-sm text-amber-700">
              ~{wordsOverLimit} words over limit • {suggestions.length} suggestions found
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-amber-600">
            Potential savings: ~{totalSavings} words ({potentialPages.toFixed(1)} pages)
          </span>
          {expanded ? <ChevronUp className="w-5 h-5 text-amber-600" /> : <ChevronDown className="w-5 h-5 text-amber-600" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-amber-200 p-4 space-y-3">
          {/* Integrity Notice */}
          <div className="p-3 bg-white rounded-lg text-sm text-slate-600">
            <strong>Integrity Protection:</strong> Suggestions will never target hypothesis, specific aims, 
            statistical justification, power calculations, or compliance sections.
          </div>

          {suggestions.map((suggestion, i) => (
            <div key={i} className="p-3 bg-white rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      suggestion.issue === 'verbose' ? 'bg-blue-100 text-blue-700' :
                      suggestion.issue === 'redundant' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {suggestion.issue === 'verbose' ? 'Verbose' : 
                       suggestion.issue === 'redundant' ? 'Redundant' : 'Low Impact'}
                    </span>
                    <span className="text-xs text-slate-500">Paragraph {suggestion.paragraph}</span>
                  </div>
                  <p className="text-sm text-slate-600 italic mb-1">"{suggestion.original}"</p>
                  <p className="text-sm text-slate-800">{suggestion.suggestion}</p>
                </div>
                <span className="text-sm font-medium text-emerald-600 whitespace-nowrap ml-4">
                  ~{suggestion.savings} words
                </span>
              </div>
            </div>
          ))}

          {suggestions.length === 0 && !analyzing && (
            <p className="text-center text-slate-500 py-4">
              No reduction suggestions available for this content.
            </p>
          )}
        </div>
      )}
    </div>
  );
}