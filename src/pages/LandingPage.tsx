import { Link } from 'react-router-dom';
import { 
  Brain, 
  Users, 
  DollarSign, 
  RefreshCw, 
  ArrowRight,
  CheckCircle,
  Sparkles,
  GraduationCap,
  Building2,
  Shield,
  Target,
  Zap
} from 'lucide-react';

const academicFeatures = [
  { icon: Brain, title: 'AI Grant Writing', desc: 'NIH R-series, NSF, foundation grants with intelligent assistance' },
  { icon: Users, title: 'Review Simulation', desc: 'Mock study section with 3 AI reviewers using NIH 1-9 scale' },
  { icon: RefreshCw, title: 'Resubmission Wizard', desc: 'Parse critiques and generate targeted responses' },
];

const commercialFeatures = [
  { icon: Target, title: 'SBIR/STTR Builder', desc: 'Phase I, II, IIB, and Fast Track with compliance checks' },
  { icon: Shield, title: 'Compliance Engine', desc: 'PI employment, 40/30 allocation, small business rules' },
  { icon: Zap, title: 'Risk Heatmap', desc: 'Identify weaknesses before submission' },
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDYwIEwgNjAgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>
        <nav className="relative max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">GF</span>
            </div>
            <span className="text-2xl font-bold text-white">GRANTFATHER</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-slate-300 hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-500 transition-colors">
              Get Started
            </Link>
          </div>
        </nav>

        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm mb-8">
              <Sparkles className="w-4 h-4" />
              Two Verticals. One Platform. Unlimited Potential.
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              The AI Platform for
              <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Research Funding Success
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
              Whether you're an academic researcher or a startup founder, GRANTFATHER provides 
              the AI-powered tools you need to win grants and contracts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-500 transition-all shadow-lg"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Two Verticals */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Built for Your World
            </h2>
            <p className="text-lg text-slate-600">Choose your track and unlock tailored features</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Academic Track */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Academic</h3>
                  <p className="text-slate-500">Researchers & Institutions</p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                {academicFeatures.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <f.icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{f.title}</p>
                      <p className="text-sm text-slate-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {['NIH R01', 'R21', 'K99', 'NSF', 'DoD', 'CPRIT', 'Foundations'].map(tag => (
                  <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full">{tag}</span>
                ))}
              </div>
              <Link 
                to="/register"
                className="block w-full text-center bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Start Academic Track
              </Link>
            </div>

            {/* Commercial Track */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Commercial</h3>
                  <p className="text-slate-500">Startups & Small Businesses</p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                {commercialFeatures.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <f.icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{f.title}</p>
                      <p className="text-sm text-slate-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {['SBIR Phase I', 'Phase II', 'Phase IIB', 'STTR', 'Fast Track', 'DoD'].map(tag => (
                  <span key={tag} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-full">{tag}</span>
                ))}
              </div>
              <Link 
                to="/register"
                className="block w-full text-center bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
              >
                Start Commercial Track
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-indigo-600">$2.4B+</p>
              <p className="text-slate-600">Funding Supported</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-indigo-600">15,000+</p>
              <p className="text-slate-600">Grants Written</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-indigo-600">42%</p>
              <p className="text-slate-600">Avg. Success Rate</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-indigo-600">500+</p>
              <p className="text-slate-600">Institutions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Budget Engine Feature */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Budget Director
              </h2>
              <p className="text-slate-300 text-lg mb-8">
                Multi-year budget planning with automatic compliance checking. NIH salary caps, 
                STTR 40/30 allocation rules, F&A calculations, and modular budget support.
              </p>
              <ul className="space-y-4">
                {[
                  'Year 1-5 planning with personnel tracking',
                  'Automatic fringe benefits & F&A by MTDC',
                  'NIH modular budget ($25K modules)',
                  'Consortium/subcontract budgets',
                  'Contract milestone budgets'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-200">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-800 rounded-2xl p-6">
              <div className="flex gap-2 mb-4">
                {[1,2,3,4,5].map(y => (
                  <div key={y} className={`px-4 py-2 rounded-lg text-sm ${y === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                    Year {y}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Personnel</span>
                  <span className="text-white font-medium">$245,000</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Equipment</span>
                  <span className="text-white font-medium">$50,000</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Supplies</span>
                  <span className="text-white font-medium">$35,000</span>
                </div>
                <div className="flex justify-between p-3 bg-indigo-600/30 rounded-lg border border-indigo-500">
                  <span className="text-indigo-300">Total Direct</span>
                  <span className="text-white font-bold">$330,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Fund Your Research?
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            Join thousands of researchers and startups winning grants with GRANTFATHER.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition-all shadow-lg"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GF</span>
            </div>
            <span className="text-white font-semibold">GRANTFATHER</span>
          </div>
          <p className="text-slate-400 text-sm">© 2026 GRANTFATHER. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
