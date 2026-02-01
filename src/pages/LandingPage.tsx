import { Link } from 'react-router-dom';
import { 
  FileText, 
  Brain, 
  Users, 
  DollarSign, 
  RefreshCw, 
  BookOpen,
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Writing',
    description: '8 specialized modules with GPT-4o assistance for concept, hypothesis, aims, approach, and more.'
  },
  {
    icon: Users,
    title: 'Review Simulation',
    description: 'Three AI reviewers with distinct personas evaluate your grant on the NIH 1-9 scale.'
  },
  {
    icon: DollarSign,
    title: 'Budget Engine',
    description: 'NIH salary cap compliance, STTR 40/30 rules, and automatic indirect cost calculations.'
  },
  {
    icon: RefreshCw,
    title: 'Resubmission Wizard',
    description: 'Parse critiques from summary statements and generate targeted responses.'
  },
  {
    icon: BookOpen,
    title: 'Manuscript Conversion',
    description: 'Transform funded grants into peer-reviewed publications seamlessly.'
  },
  {
    icon: FileText,
    title: 'Multi-Agency Support',
    description: 'Templates for NIH, NCI, DoD CDMRP, CPRIT, NSF, SBIR, STTR, and foundations.'
  }
];

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    features: ['3 AI calls per month', '1 active project', 'Basic templates', 'Community support'],
    cta: 'Get Started',
    highlighted: false
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    features: ['Unlimited AI calls', 'Unlimited projects', 'Review simulation', 'Resubmission wizard', 'Priority support'],
    cta: 'Start Pro Trial',
    highlighted: true
  },
  {
    name: 'Enterprise',
    price: '$199',
    period: '/month',
    features: ['Everything in Pro', 'Team collaboration', 'Custom templates', 'API access', 'Dedicated support'],
    cta: 'Contact Sales',
    highlighted: false
  }
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDYwIEwgNjAgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Grant Writing Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Write Winning Grants with
              <span className="block text-indigo-200">Grand Mother</span>
            </h1>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-10">
              The intelligent grant writing assistant for biomedical researchers. 
              From concept to funded project, we guide you every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl"
              >
                Start Writing Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-transparent text-white border-2 border-white/30 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Comprehensive tools designed specifically for biomedical grant writing.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-slate-100"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-slate-600">
              Choose the plan that fits your research needs.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 ${
                  tier.highlighted
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-600 ring-offset-4'
                    : 'bg-white border border-slate-200'
                }`}
              >
                <h3 className={`text-xl font-semibold mb-2 ${tier.highlighted ? 'text-white' : 'text-slate-900'}`}>
                  {tier.name}
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.period && <span className={tier.highlighted ? 'text-indigo-200' : 'text-slate-500'}>{tier.period}</span>}
                </div>
                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${tier.highlighted ? 'text-indigo-200' : 'text-indigo-600'}`} />
                      <span className={tier.highlighted ? 'text-indigo-100' : 'text-slate-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block w-full text-center py-3 rounded-xl font-semibold transition-all ${
                    tier.highlighted
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Grant Writing?
          </h2>
          <p className="text-xl text-slate-300 mb-10">
            Join thousands of researchers who have improved their funding success rate.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-500 transition-all"
          >
            Get Started Today
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-400" />
              <span className="text-white font-semibold">Grand Mother</span>
            </div>
            <p className="text-slate-400 text-sm">
              2026 Grand Mother. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
