Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { planType, userType, customerEmail, userId, successUrl, cancelUrl } = await req.json();
    
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe not configured. Please add STRIPE_SECRET_KEY to your environment.');
    }

    // GRANTFATHER plan pricing (amounts in cents)
    const planConfig: Record<string, { amount: number; name: string; interval: string }> = {
      // Academic plans
      fellow: { amount: 0, name: 'Fellow (Free)', interval: 'month' },
      pi: { amount: 4900, name: 'PI Plan - $49/month', interval: 'month' },
      department: { amount: 29900, name: 'Department Plan - $299/month', interval: 'month' },
      institution: { amount: 0, name: 'Institution (Custom)', interval: 'month' },
      // Commercial plans
      founder: { amount: 0, name: 'Founder (Free)', interval: 'month' },
      startup_pro: { amount: 9900, name: 'Startup Pro - $99/month', interval: 'month' },
      growth_lab: { amount: 39900, name: 'Growth Lab - $399/month', interval: 'month' },
      enterprise: { amount: 0, name: 'Enterprise (Custom)', interval: 'month' },
      // Legacy plans
      free: { amount: 0, name: 'Free Plan', interval: 'month' },
      pro: { amount: 2900, name: 'Pro Plan - $29/month', interval: 'month' },
    };

    const plan = planConfig[planType];
    if (!plan) {
      throw new Error(`Invalid plan type: ${planType}`);
    }

    // Free and custom plans don't require payment
    if (plan.amount === 0) {
      // Update user profile directly for free plans
      if (userId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        
        await fetch(`${supabaseUrl}/rest/v1/gf_users?id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            plan_tier: planType,
            user_type: userType || 'academic',
            subscription_status: 'active'
          })
        });
      }

      return new Response(JSON.stringify({
        data: { 
          message: plan.amount === 0 && ['institution', 'enterprise'].includes(planType) 
            ? 'Contact sales@grantfather.ai for custom enterprise pricing'
            : 'Free plan activated successfully',
          plan: planType,
          requiresPayment: false
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create Stripe checkout session for paid plans
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'customer_email': customerEmail,
        'success_url': successUrl || `${req.headers.get('origin')}/pricing?subscription=success&plan=${planType}`,
        'cancel_url': cancelUrl || `${req.headers.get('origin')}/pricing?subscription=cancelled`,
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': plan.name,
        'line_items[0][price_data][unit_amount]': plan.amount.toString(),
        'line_items[0][price_data][recurring][interval]': plan.interval,
        'line_items[0][quantity]': '1',
        'metadata[plan_type]': planType,
        'metadata[user_type]': userType || 'academic',
        'metadata[user_id]': userId || ''
      }).toString()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Stripe error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const session = await response.json();

    return new Response(JSON.stringify({
      data: {
        checkoutUrl: session.url,
        sessionId: session.id,
        requiresPayment: true
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: { code: 'CHECKOUT_ERROR', message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
