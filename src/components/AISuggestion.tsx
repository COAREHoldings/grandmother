import { useState } from 'react';
import { Check, X, Pencil, Sparkles, Loader2 } from 'lucide-react';

interface Suggestion {
  id: string;
  text: string;
  type?: string;
}

interface AISuggestionProps {
  suggestion: Suggestion;
  onAccept: (text: string) => void;
  onReject: (id: string) => void;
  label?: string;
}

export function AISuggestion({ suggestion, onAccept, onReject, label }: AISuggestionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(suggestion.text);

  const handleAccept = () => {
    onAccept(isEditing ? editedText : suggestion.text);
  };

  const handleStartEdit = () => {
    setEditedText(suggestion.text);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedText(suggestion.text);
    setIsEditing(false);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 transition-all">
      {label && (
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">{label}</span>
        </div>
      )}
      
      {isEditing ? (
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className="w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none bg-white"
          rows={3}
          autoFocus
        />
      ) : (
        <p className="text-slate-800 leading-relaxed">{suggestion.text}</p>
      )}

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={handleAccept}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-all"
        >
          <Check className="w-4 h-4" />
          Accept
        </button>
        
        {isEditing ? (
          <button
            onClick={handleCancelEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition-all"
          >
            Cancel
          </button>
        ) : (
          <button
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-200 transition-all"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
        )}
        
        <button
          onClick={() => onReject(suggestion.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-all"
        >
          <X className="w-4 h-4" />
          Reject
        </button>
      </div>
    </div>
  );
}

interface AISuggestionListProps {
  suggestions: Suggestion[];
  onAccept: (text: string) => void;
  onReject: (id: string) => void;
  title?: string;
  loading?: boolean;
}

export function AISuggestionList({ suggestions, onAccept, onReject, title, loading }: AISuggestionListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-6 bg-purple-50 rounded-xl border border-purple-200">
        <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
        <span className="text-purple-700 font-medium">Generating suggestions...</span>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h4 className="font-semibold text-slate-900">{title}</h4>
        </div>
      )}
      {suggestions.map((suggestion, idx) => (
        <AISuggestion
          key={suggestion.id}
          suggestion={suggestion}
          onAccept={onAccept}
          onReject={onReject}
          label={`Suggestion ${idx + 1}`}
        />
      ))}
    </div>
  );
}

// Hook for managing suggestions state
export function useSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const addSuggestions = (newSuggestions: string[]) => {
    const formatted = newSuggestions.map((text, idx) => ({
      id: `${Date.now()}-${idx}`,
      text,
    }));
    setSuggestions(formatted);
  };

  const removeSuggestion = (id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const clearSuggestions = () => {
    setSuggestions([]);
  };

  return {
    suggestions,
    loading,
    setLoading,
    addSuggestions,
    removeSuggestion,
    clearSuggestions,
  };
}

export default AISuggestion;
