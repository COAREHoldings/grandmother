import { useState } from 'react';
import Layout from '@/components/Layout';
import BiosketchBuilder from '@/components/BiosketchBuilder';
import LetterGenerator from '@/components/LetterGenerator';
import { User, FileText } from 'lucide-react';

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<'biosketch' | 'letters'>('biosketch');

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Document Builder</h1>
          <p className="text-slate-600">Generate biosketches and support letters for your grant applications</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('biosketch')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'biosketch'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <User className="w-5 h-5" />
            Biosketch Builder
          </button>
          <button
            onClick={() => setActiveTab('letters')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'letters'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-5 h-5" />
            Letter Generator
          </button>
        </div>

        {/* Content */}
        {activeTab === 'biosketch' && <BiosketchBuilder />}
        {activeTab === 'letters' && <LetterGenerator />}
      </div>
    </Layout>
  );
}