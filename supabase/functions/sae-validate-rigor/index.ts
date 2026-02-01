import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { aim_id } = await req.json()

    // Get aim and stats inputs
    const { data: aim } = await supabase
      .from('sae_aims')
      .select('*, sae_aim_stats_inputs(*)')
      .eq('id', aim_id)
      .single()

    if (!aim) {
      return new Response(
        JSON.stringify({ error: 'Aim not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stats = aim.sae_aim_stats_inputs?.[0] || {}
    const checks: Array<{ check_key: string; status: string; message: string }> = []

    // Hard Fails
    if (!stats.experimental_unit) {
      checks.push({
        check_key: 'experimental_unit_required',
        status: 'fail',
        message: 'Experimental unit is not defined. Specify whether measurements are per subject, cell, well, etc.'
      })
    }

    if (!stats.primary_endpoint_text) {
      checks.push({
        check_key: 'primary_endpoint_required',
        status: 'fail',
        message: 'Primary endpoint is not specified. Define the main outcome measure.'
      })
    }

    // Repeated/Clustered checks
    if (['repeated', 'clustered'].includes(stats.endpoint_type)) {
      checks.push({
        check_key: 'mixed_model_required',
        status: 'warn',
        message: 'For repeated/clustered data, ensure analysis plan includes mixed models or GEE approach.'
      })
    }

    // Warnings
    const secondaryEndpoints = stats.secondary_endpoints_json || []
    if (secondaryEndpoints.length > 1 || stats.timepoint_text?.includes(',')) {
      checks.push({
        check_key: 'multiplicity_plan',
        status: 'warn',
        message: 'Multiple endpoints/timepoints detected. Consider multiplicity adjustment (e.g., Bonferroni, FDR).'
      })
    }

    if (!stats.variance_source || stats.variance_source === 'unknown') {
      checks.push({
        check_key: 'variance_source',
        status: 'warn',
        message: 'Variance estimate source not specified. Indicate if from pilot data, literature, or assumed.'
      })
    }

    // Pseudo-replication check
    if (stats.replicates_json) {
      const reps = stats.replicates_json
      if (reps.technical && !reps.biological) {
        checks.push({
          check_key: 'pseudo_replication_risk',
          status: 'warn',
          message: 'Technical replicates without biological replicates may lead to pseudo-replication. Verify experimental unit.'
        })
      }
    }

    // Missing data plan
    if (stats.attrition_rate > 0 && !stats.constraints_json?.missing_plan) {
      checks.push({
        check_key: 'missing_data_plan',
        status: 'warn',
        message: 'Attrition expected but no missing data handling plan specified.'
      })
    }

    // Pass if no issues
    if (checks.filter(c => c.status === 'fail').length === 0) {
      checks.push({
        check_key: 'basic_requirements',
        status: 'pass',
        message: 'Basic statistical requirements are met.'
      })
    }

    // Clear old checks and insert new ones
    await supabase.from('sae_aim_rigor_checks').delete().eq('aim_id', aim_id)
    
    for (const check of checks) {
      await supabase.from('sae_aim_rigor_checks').insert({
        aim_id,
        check_key: check.check_key,
        status: check.status,
        message: check.message
      })
    }

    return new Response(
      JSON.stringify({ success: true, checks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
