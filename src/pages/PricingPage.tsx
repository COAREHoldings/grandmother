import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { CheckCircle, Loader2, Crown, Zap, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    icon: Zap,
    features: [
      '3 AI calls per month',
      '1 active project',
      'Basic templates',
      'Community support'
    ],
    buttonText: 'Current Plan',
    highlighted: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/month',
    icon: Crown,
    features: [
      'Unlimited AI calls',
      'Unlimited projects',
      'Review simulation',
      'Resubmission wizard',
      'Manuscript conversion',
      'Priority support'
    ],
    buttonText: 'Upgrade to Pro',
    highlighted: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$199',
    period: '/month',
    icon: Building2,
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Custom templates',
      'API access',
      'Dedicated support',
      'SLA guarantee'
    ],
    buttonText: 'Contact Sales',
    highlighted: false
  }
];

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('subscription');
    
    if (status === 'success') {
      toast.success('Subscription activated successfully!');
      window.history.replaceState({}, '', '/pricing');
    } else if (status === 'cancelled') {
      toast.error('Subscription cancelled');
      window.history.replaceState({}, '', '/pricing');
    }

    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('gm_subscriptions')
      .select('*, gm_plans(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (data?.gm_plans?.plan_type) {
      setCurrentPlan(data.gm_plans.plan_type);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (planId === 'free') {
      toast.success('You are already on the Free plan');
      return;
    }

    if (planId === currentPlan) {
      toast.success('You are already subscribed to this plan');
      return;
    }

    setLoading(planId);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planType: planId,
          customerEmail: user.email,
          successUrl: `${window.location.origin}/pricing?subscription=success`,
          cancelUrl: `${window.location.origin}/pricing?subscription=cancelled`
        }
      });

      if (error) throw error;

      if (data?.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else if (data?.data?.message) {
        toast.success(data.data.message);
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Failed to start checkout');
    }

    setLoading(null);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Choose Your Plan
          </h1>
          <p className="text-lg text-slate-600">
            Unlock powerful grant writing features with our premium plans
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-600 ring-offset-4'
                    : 'bg-white border border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <plan.icon className={`w-8 h-8 ${plan.highlighted ? 'text-indigo-200' : 'text-indigo-600'}`} />
                  <h3 className={`text-xl font-semibold ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                    {plan.name}
                  </h3>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.highlighted ? 'text-indigo-200' : 'text-slate-500'}>{plan.period}</span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? 'text-indigo-200' : 'text-indigo-600'}`} />
                      <span className={plan.highlighted ? 'text-indigo-100' : 'text-slate-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id || isCurrentPlan}
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    plan.highlighted
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50 disabled:bg-indigo-100'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300'
                  } disabled:cursor-not-allowed`}
                >
                  {loading === plan.id && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isCurrentPlan ? 'Current Plan' : plan.buttonText}
                </button>

                {isCurrentPlan && (
                  <p className={`text-center text-sm mt-3 ${plan.highlighted ? 'text-indigo-200' : 'text-slate-500'}`}>
                    Your active subscription
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-600">
            All plans include a 14-day money-back guarantee. 
            <br />
            Questions? Contact us at support@grandmother.ai
          </p>
        </div>
      </div>
    </Layout>
  );
}
