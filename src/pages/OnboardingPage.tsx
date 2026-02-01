import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, Building2, Upload, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

type Step = 'track' | 'verify' | 'plan';
type UserType = 'academic' | 'commercial';

const ACADEMIC_PLANS = [
  { id: 'fellow', name: 'Fellow', price: 0, features: ['3 AI scores/month', '1 project', 'Watermarked exports', 'Basic templates'] },
  { id: 'pi', name: 'PI', price: 49, features: ['Unlimited scoring', 'Unlimited projects', 'Compliance validator', 'Resubmission comparison', 'Priority support'] },
  { id: 'department', name: 'Department', price: 299, features: ['15 team seats', 'Org dashboard', 'Usage analytics', 'All PI features', 'Admin controls'] },
  { id: 'institution', name: 'Institution', price: 'Custom', features: ['Unlimited seats', 'Portfolio analytics', 'API access', 'SSO integration', 'Dedicated support'] },
];

const COMMERCIAL_PLANS = [
  { id: 'founder', name: 'Founder', price: 0, features: ['SBIR/STTR builder', '5 AI scores/month', '2 projects', 'Watermarked exports'] },
  { id: 'startup_pro', name: 'Startup Pro', price: 99, features: ['Unlimited scoring', '10 projects', 'Compliance validator', 'Risk heatmap', 'Phase II guidance'] },
  { id: 'growth_lab', name: 'Growth Lab', price: 399, features: ['5 team seats', 'Forecasting tools', 'Pipeline dashboard', 'All Pro features'] },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', features: ['Unlimited seats', 'Portfolio analytics', 'API access', 'Custom integrations', 'Dedicated CSM'] },
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('track');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [email, setEmail] = useState('');
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      checkExistingProfile();
    }
  }, [user]);

  const checkExistingProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('gf_users').select('*').eq('id', user.id).maybeSingle();
    if (data) {
      setExistingProfile(data);
      if (data.user_type && data.plan_tier !== 'fellow') {
        navigate('/dashboard');
      }
    }
  };

  const isEduEmail = (email: string) => email.toLowerCase().endsWith('.edu');

  const handleTrackSelect = async (type: UserType) => {
    setUserType(type);
    if (type === 'academic' && isEduEmail(email)) {
      // Auto-verify .edu emails
      await updateProfile(type, true, 'edu_email');
      setStep('plan');
    } else if (type === 'academic') {
      setStep('verify');
    } else {
      await updateProfile(type, false, null);
      setStep('plan');
    }
  };

  const updateProfile = async (type: UserType, verified: boolean, method: string | null) => {
    if (!user) return;
    await supabase.from('gf_users').upsert({
      id: user.id,
      email: user.email,
      user_type: type,
      academic_verified: verified,
      verification_method: method,
    });
  };

  const handleVerificationUpload = async () => {
    if (!verificationFile || !user) return;
    setLoading(true);
    
    // In production, upload to storage and trigger review process
    await updateProfile('academic', false, 'pending_review');
    toast.success('Verification submitted! We\'ll review within 24 hours.');
    setStep('plan');
    setLoading(false);
  };

  const handlePlanSelect = async (planId: string) => {
    if (!user) return;
    setLoading(true);

    const isPaid = !['fellow', 'founder'].includes(planId);
    
    if (isPaid) {
      // Redirect to Stripe checkout
      toast.success('Redirecting to checkout...');
      // In production, call stripe checkout edge function
      await supabase.from('gf_users').update({ plan_tier: planId }).eq('id', user.id);
    } else {
      await supabase.from('gf_users').update({ plan_tier: planId }).eq('id', user.id);
    }

    toast.success('Welcome to GrantMother!');
    navigate('/dashboard');
    setLoading(false);
  };

  const plans = userType === 'academic' ? ACADEMIC_PLANS : COMMERCIAL_PLANS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">GrantMother</h1>
          <p className="text-indigo-300">AI-Powered Grant Writing Platform</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-12">
          {['track', 'verify', 'plan'].map((s, i) => (
            <div key={s} className={`w-24 h-1 rounded-full ${
              ['track', 'verify', 'plan'].indexOf(step) >= i ? 'bg-indigo-500' : 'bg-slate-700'
            }`} />
          ))}
        </div>

        {/* Step 1: Track Selection */}
        {step === 'track' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white text-center mb-8">Choose Your Track</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => handleTrackSelect('academic')}
                className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-indigo-500 transition-all text-left group"
              >
                <GraduationCap className="w-12 h-12 text-indigo-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Academic</h3>
                <p className="text-slate-400 mb-4">Universities, research institutions, and academic medical centers</p>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• NIH R-series grants</li>
                  <li>• NSF proposals</li>
                  <li>• Foundation grants</li>
                  <li>• Career development awards</li>
                </ul>
                <ArrowRight className="w-5 h-5 text-indigo-400 mt-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleTrackSelect('commercial')}
                className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-emerald-500 transition-all text-left group"
              >
                <Building2 className="w-12 h-12 text-emerald-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Commercial</h3>
                <p className="text-slate-400 mb-4">Startups, small businesses, and commercial research teams</p>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• SBIR Phase I/II/IIB</li>
                  <li>• STTR awards</li>
                  <li>• DoD contracts</li>
                  <li>• Commercial R&D</li>
                </ul>
                <ArrowRight className="w-5 h-5 text-emerald-400 mt-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Academic Verification */}
        {step === 'verify' && userType === 'academic' && (
          <div className="max-w-md mx-auto space-y-6">
            <h2 className="text-2xl font-semibold text-white text-center mb-2">Verify Academic Status</h2>
            <p className="text-slate-400 text-center mb-8">
              Upload proof of academic affiliation (ID card, appointment letter, or institution email screenshot)
            </p>

            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
              <label className="flex flex-col items-center gap-4 cursor-pointer">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-indigo-400" />
                </div>
                <span className="text-white font-medium">
                  {verificationFile ? verificationFile.name : 'Choose file to upload'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setVerificationFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            <button
              onClick={handleVerificationUpload}
              disabled={!verificationFile || loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              Submit for Verification
            </button>

            <button
              onClick={() => setStep('plan')}
              className="w-full py-3 text-slate-400 hover:text-white"
            >
              Skip for now (limited access)
            </button>
          </div>
        )}

        {/* Step 3: Plan Selection */}
        {step === 'plan' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-white mb-2">Choose Your Plan</h2>
              <p className="text-slate-400">
                {userType === 'academic' ? 'Academic pricing for researchers' : 'Commercial pricing for startups & businesses'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-6 rounded-xl border transition-all ${
                    plan.id === 'pi' || plan.id === 'startup_pro'
                      ? 'bg-indigo-600/20 border-indigo-500'
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  {(plan.id === 'pi' || plan.id === 'startup_pro') && (
                    <span className="text-xs font-semibold text-indigo-400 uppercase mb-2 block">Most Popular</span>
                  )}
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    {typeof plan.price === 'number' ? (
                      <span className="text-3xl font-bold text-white">
                        ${plan.price}<span className="text-sm font-normal text-slate-400">/mo</span>
                      </span>
                    ) : (
                      <span className="text-xl font-bold text-white">{plan.price}</span>
                    )}
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={loading}
                    className={`w-full py-2 rounded-lg font-medium transition-all ${
                      plan.id === 'pi' || plan.id === 'startup_pro'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {typeof plan.price === 'number' && plan.price === 0 ? 'Start Free' : 
                     typeof plan.price === 'string' ? 'Contact Sales' : 'Subscribe'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
