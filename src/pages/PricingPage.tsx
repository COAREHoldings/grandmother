import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, GraduationCap, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

type UserType = 'academic' | 'commercial' | null;

const ACADEMIC_PLANS = [
  { id: 'fellow', name: 'Fellow', price: 0, desc: 'For students & postdocs', features: ['3 AI scores/month', '1 project', 'Watermarked exports', 'Basic templates'] },
  { id: 'pi', name: 'PI', price: 49, desc: 'For principal investigators', features: ['Unlimited scoring', 'Unlimited projects', 'Compliance validator', 'Resubmission comparison', 'Priority support'], popular: true },
  { id: 'department', name: 'Department', price: 299, desc: 'For research departments', features: ['15 team seats', 'Org dashboard', 'Usage analytics', 'All PI features', 'Admin controls'] },
  { id: 'institution', name: 'Institution', price: 'Custom', desc: 'For universities', features: ['Unlimited seats', 'Portfolio analytics', 'API access', 'SSO integration', 'Dedicated support'] },
];

const COMMERCIAL_PLANS = [
  { id: 'founder', name: 'Founder', price: 0, desc: 'For early-stage startups', features: ['SBIR/STTR builder', '5 AI scores/month', '2 projects', 'Watermarked exports'] },
  { id: 'startup_pro', name: 'Startup Pro', price: 99, desc: 'For funded startups', features: ['Unlimited scoring', '10 projects', 'Compliance validator', 'Risk heatmap', 'Phase II guidance'], popular: true },
  { id: 'growth_lab', name: 'Growth Lab', price: 399, desc: 'For growing teams', features: ['5 team seats', 'Forecasting tools', 'Pipeline dashboard', 'All Pro features'] },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', desc: 'For large organizations', features: ['Unlimited seats', 'Portfolio analytics', 'API access', 'Custom integrations', 'Dedicated CSM'] },
];

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [step, setStep] = useState<'track' | 'plans'>('track');

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('gf_users').select('user_type, plan_tier').eq('id', user.id).maybeSingle();
    if (data) {
      setUserType(data.user_type as UserType);
      setCurrentPlan(data.plan_tier);
      if (data.user_type) setStep('plans');
    }
  };

  const handleTrackSelect = (type: UserType) => {
    setUserType(type);
    setStep('plans');
  };

  const handlePlanSelect = async (planId: string) => {
    if (!user) {
      navigate('/register');
      return;
    }

    const isPaid = !['fellow', 'founder'].includes(planId);
    const isCustom = ['institution', 'enterprise'].includes(planId);
    
    if (isCustom) {
      toast.success('Contact sales@grantmother.ai for custom pricing');
      return;
    }

    if (isPaid) {
      // In production, redirect to Stripe checkout
      toast.success('Redirecting to checkout...');
    }
    
    await supabase.from('gf_users').update({ plan_tier: planId, user_type: userType }).eq('id', user.id);
    toast.success('Plan updated!');
    navigate('/dashboard');
  };

  const plans = userType === 'academic' ? ACADEMIC_PLANS : COMMERCIAL_PLANS;

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              {step === 'track' ? 'Choose Your Track' : `${userType === 'academic' ? 'Academic' : 'Commercial'} Pricing`}
            </h1>
            <p className="text-lg text-slate-600">
              {step === 'track' 
                ? 'Select the track that matches your organization type' 
                : 'Simple, transparent pricing for your research needs'}
            </p>
          </div>

          {/* Track Selection */}
          {step === 'track' && (
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <button
                onClick={() => handleTrackSelect('academic')}
                className="p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-500 transition-all text-left group"
              >
                <GraduationCap className="w-12 h-12 text-indigo-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Academic</h3>
                <p className="text-slate-600 mb-4">Universities, research institutions, and academic medical centers</p>
                <span className="text-indigo-600 font-medium group-hover:underline">View Academic Plans →</span>
              </button>

              <button
                onClick={() => handleTrackSelect('commercial')}
                className="p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-500 transition-all text-left group"
              >
                <Building2 className="w-12 h-12 text-emerald-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Commercial</h3>
                <p className="text-slate-600 mb-4">Startups, small businesses, and commercial R&D teams</p>
                <span className="text-emerald-600 font-medium group-hover:underline">View Commercial Plans →</span>
              </button>
            </div>
          )}

          {/* Plans Grid */}
          {step === 'plans' && (
            <>
              <div className="flex justify-center mb-8">
                <button
                  onClick={() => setStep('track')}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ← Back to track selection
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-2xl p-6 border-2 transition-all ${
                      plan.popular 
                        ? `${userType === 'academic' ? 'border-indigo-500' : 'border-emerald-500'} shadow-lg` 
                        : 'border-slate-200 hover:border-slate-300'
                    } ${currentPlan === plan.id ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
                  >
                    {plan.popular && (
                      <span className={`text-xs font-semibold ${userType === 'academic' ? 'text-indigo-600' : 'text-emerald-600'} uppercase mb-2 block`}>
                        Most Popular
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-sm text-slate-500 mb-4">{plan.desc}</p>
                    <div className="mb-6">
                      {typeof plan.price === 'number' ? (
                        <span className="text-3xl font-bold text-slate-900">
                          ${plan.price}<span className="text-sm font-normal text-slate-500">/mo</span>
                        </span>
                      ) : (
                        <span className="text-2xl font-bold text-slate-900">{plan.price}</span>
                      )}
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${userType === 'academic' ? 'text-indigo-500' : 'text-emerald-500'}`} />
                          <span className="text-slate-600">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handlePlanSelect(plan.id)}
                      disabled={currentPlan === plan.id}
                      className={`w-full py-3 rounded-xl font-semibold transition-all ${
                        currentPlan === plan.id
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : plan.popular
                            ? `${userType === 'academic' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {currentPlan === plan.id ? 'Current Plan' : 
                       typeof plan.price === 'number' && plan.price === 0 ? 'Start Free' :
                       typeof plan.price === 'string' ? 'Contact Sales' : 'Subscribe'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* FAQ */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: 'Can I switch between tracks?', a: 'Track selection is permanent as it determines your feature set and pricing. Contact support if you need to change tracks.' },
                { q: 'What counts as an AI score?', a: 'Each time you run the AI Review Simulation or generate AI content, it counts as one score toward your monthly limit.' },
                { q: 'Do you offer academic discounts?', a: 'Yes! Our Academic track is specifically priced for researchers with institutional budgets in mind.' },
                { q: 'Can I upgrade mid-cycle?', a: 'Absolutely. Upgrades take effect immediately and you\'ll be prorated for the remainder of your billing cycle.' },
              ].map((faq, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                  <p className="text-slate-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
