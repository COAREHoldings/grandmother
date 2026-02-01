Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, user_id } = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get user data
    const userRes = await fetch(`${supabaseUrl}/rest/v1/gf_users?id=eq.${user_id}&select=*`, {
      headers: { 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey }
    });
    const users = await userRes.json();
    if (!users.length) {
      return new Response(JSON.stringify({ allowed: false, error: 'User not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const user = users[0];

    // Get AI usage
    const usageRes = await fetch(`${supabaseUrl}/rest/v1/gf_ai_usage?user_id=eq.${user_id}&select=*`, {
      headers: { 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey }
    });
    const usageData = await usageRes.json();
    const usage = usageData[0] || { scoring_calls_this_cycle: 0, ai_tokens_used: 0 };

    // Plan limits
    const PLAN_LIMITS: Record<string, Record<string, number | boolean | string[]>> = {
      // Academic
      fellow: { scoring_limit: 3, projects_limit: 1, watermarks: true, features: ['basic_scoring'] },
      pi: { scoring_limit: -1, projects_limit: -1, watermarks: false, features: ['scoring', 'compliance', 'resubmission'] },
      department: { scoring_limit: -1, projects_limit: -1, seats: 15, features: ['scoring', 'compliance', 'resubmission', 'org_dashboard'] },
      institution: { scoring_limit: -1, projects_limit: -1, seats: -1, features: ['scoring', 'compliance', 'resubmission', 'org_dashboard', 'portfolio', 'api'] },
      // Commercial
      founder: { scoring_limit: 5, projects_limit: 2, watermarks: true, features: ['sbir_builder', 'basic_scoring'] },
      startup_pro: { scoring_limit: -1, projects_limit: 10, watermarks: false, features: ['scoring', 'compliance', 'risk_heatmap'] },
      growth_lab: { scoring_limit: -1, projects_limit: -1, seats: 5, features: ['scoring', 'compliance', 'risk_heatmap', 'forecasting'] },
      enterprise: { scoring_limit: -1, projects_limit: -1, seats: -1, features: ['scoring', 'compliance', 'risk_heatmap', 'forecasting', 'portfolio', 'api', 'custom'] }
    };

    const limits = PLAN_LIMITS[user.plan_tier] || PLAN_LIMITS.fellow;

    // Validate based on action
    if (action === 'ai_scoring') {
      const limit = limits.scoring_limit as number;
      if (limit !== -1 && usage.scoring_calls_this_cycle >= limit) {
        return new Response(JSON.stringify({ 
          allowed: false, 
          error: `AI scoring limit reached (${limit}/month). Upgrade your plan for unlimited scoring.`,
          current: usage.scoring_calls_this_cycle,
          limit
        }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (action === 'create_project') {
      // Check project count
      const projRes = await fetch(`${supabaseUrl}/rest/v1/gf_projects?user_id=eq.${user_id}&select=id`, {
        headers: { 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey }
      });
      const projects = await projRes.json();
      const projLimit = limits.projects_limit as number;
      if (projLimit !== -1 && projects.length >= projLimit) {
        return new Response(JSON.stringify({ 
          allowed: false, 
          error: `Project limit reached (${projLimit}). Upgrade your plan for more projects.`,
          current: projects.length,
          limit: projLimit
        }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (action === 'check_feature') {
      const { feature } = await req.json();
      const features = limits.features as string[];
      if (!features.includes(feature)) {
        return new Response(JSON.stringify({ 
          allowed: false, 
          error: `Feature '${feature}' not available in your plan. Upgrade to access.`
        }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({ 
      allowed: true, 
      user,
      usage,
      limits,
      watermarks: limits.watermarks
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
