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
    const { planType, customerEmail, successUrl, cancelUrl } = await req.json();
    
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe not configured. Please add STRIPE_SECRET_KEY to your environment.');
    }

    const planConfig: Record<string, { amount: number; name: string }> = {
      free: { amount: 0, name: 'Free Plan' },
      pro: { amount: 2900, name: 'Pro Plan - $29/month' },
      enterprise: { amount: 19900, name: 'Enterprise Plan - $199/month' }
    };

    const plan = planConfig[planType];
    if (!plan) {
      throw new Error('Invalid plan type');
    }

    if (plan.amount === 0) {
      return new Response(JSON.stringify({
        data: { message: 'Free plan does not require payment', plan: 'free' }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create Stripe checkout session
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'customer_email': customerEmail,
        'success_url': successUrl || `${req.headers.get('origin')}/pricing?subscription=success`,
        'cancel_url': cancelUrl || `${req.headers.get('origin')}/pricing?subscription=cancelled`,
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': plan.name,
        'line_items[0][price_data][unit_amount]': plan.amount.toString(),
        'line_items[0][price_data][recurring][interval]': 'month',
        'line_items[0][quantity]': '1',
        'metadata[plan_type]': planType
      }).toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stripe error: ${errorText}`);
    }

    const session = await response.json();

    return new Response(JSON.stringify({
      data: {
        checkoutUrl: session.url,
        sessionId: session.id
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
