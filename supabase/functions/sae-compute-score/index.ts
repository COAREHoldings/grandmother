import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Scoring weights from spec
const WEIGHTS = {
  experimental_unit_replication: 25,
  endpoint_clarity: 20,
  model_appropriateness: 20,
  power_detectable: 15,
  multiplicity_missingness: 10,
  decision_reporting: 10
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

    // Get aim with stats and SAP blocks
    const { data: aim } = await supabase
      .from('sae_aims')
      .select('*, sae_aim_stats_inputs(*), sae_aim_sap_blocks(*)')
      .eq('id', aim_id)
      .single()

    if (!aim) {
      return new Response(
        JSON.stringify({ error: 'Aim not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stats = aim.sae_aim_stats_inputs?.[0] || {}
    const blocks = aim.sae_aim_sap_blocks || []
    
    let score = 0
    const explanations: string[] = []

    // A) Experimental Unit & Replication (25 pts)
    let sectionA = 0
    if (stats.experimental_unit) {
      sectionA += 10
      explanations.push('Experimental unit defined.')
    } else {
      explanations.push('Missing: experimental unit not specified.')
    }
    
    if (stats.replicates_json?.biological || stats.replicates_json?.technical) {
      sectionA += 10
      explanations.push('Replication structure specified.')
    }
    
    if (stats.replicates_json?.pseudo_addressed) {
      sectionA += 5
    }
    score += Math.min(sectionA, WEIGHTS.experimental_unit_replication)

    // B) Endpoint Clarity (20 pts)
    let sectionB = 0
    if (stats.primary_endpoint_text) {
      sectionB += 10
      explanations.push('Primary endpoint defined.')
    } else {
      explanations.push('Missing: primary endpoint not specified.')
    }
    
    if (stats.timepoint_text) {
      sectionB += 5
    }
    
    const secondaries = stats.secondary_endpoints_json || []
    if (secondaries.length > 0) {
      sectionB += 5
    }
    score += Math.min(sectionB, WEIGHTS.endpoint_clarity)

    // C) Model Appropriateness (20 pts)
    let sectionC = 0
    const modelBlock = blocks.find((b: any) => b.block_type === 'model')
    if (modelBlock?.content_md) {
      sectionC += 10
      if (['repeated', 'clustered'].includes(stats.endpoint_type)) {
        if (/mixed|gee|multilevel|hierarchical/i.test(modelBlock.content_md)) {
          sectionC += 5
          explanations.push('Model handles clustered/repeated structure.')
        }
      } else {
        sectionC += 5
      }
      if (/assumption|diagnostic|residual/i.test(modelBlock.content_md)) {
        sectionC += 5
      }
    }
    score += Math.min(sectionC, WEIGHTS.model_appropriateness)

    // D) Power/Detectable Effect (15 pts)
    let sectionD = 0
    if (stats.sme_effect_size || stats.effect_size_scale) {
      sectionD += 8
      explanations.push('Effect size specified.')
    }
    if (stats.variance_source && stats.variance_source !== 'unknown') {
      sectionD += 7
      explanations.push('Variance source documented.')
    }
    score += Math.min(sectionD, WEIGHTS.power_detectable)

    // E) Multiplicity/Missingness (10 pts)
    let sectionE = 0
    const multBlock = blocks.find((b: any) => b.block_type === 'multiplicity_missingness')
    if (multBlock?.content_md) {
      if (/bonferroni|fdr|holm|multiplicity|adjustment/i.test(multBlock.content_md)) {
        sectionE += 4
      }
      if (/missing|imputation|dropout|attrition/i.test(multBlock.content_md)) {
        sectionE += 3
      }
      if (/outlier|robust|sensitivity/i.test(multBlock.content_md)) {
        sectionE += 3
      }
    }
    score += Math.min(sectionE, WEIGHTS.multiplicity_missingness)

    // F) Decision Rules (10 pts)
    let sectionF = 0
    const decisionBlock = blocks.find((b: any) => b.block_type === 'decision_reporting')
    if (decisionBlock?.content_md) {
      if (/success|criterion|threshold|conclude/i.test(decisionBlock.content_md)) {
        sectionF += 5
      }
      if (/confidence interval|effect size|report/i.test(decisionBlock.content_md)) {
        sectionF += 5
      }
    }
    score += Math.min(sectionF, WEIGHTS.decision_reporting)

    // Clamp score
    score = Math.max(0, Math.min(100, Math.round(score)))

    // Generate plain explanation
    const explanation = generateExplanation(score, explanations)

    // Upsert score
    await supabase.from('sae_aim_scores').upsert({
      aim_id,
      adequacy_score: score,
      explanation_plain: explanation,
      computed_at: new Date().toISOString()
    }, { onConflict: 'aim_id' })

    return new Response(
      JSON.stringify({ success: true, score, explanation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateExplanation(score: number, points: string[]): string {
  let band = ''
  if (score >= 85) band = 'This aim has strong statistical rigor.'
  else if (score >= 70) band = 'This aim has adequate statistical planning with some areas for improvement.'
  else if (score >= 50) band = 'This aim needs attention to statistical methodology.'
  else band = 'This aim requires significant statistical revision.'

  const summary = points.slice(0, 5).join(' ')
  
  return `${band} ${summary} This score reflects endpoint clarity, analysis model appropriateness, power planning, and data handling provisions. It does not predict review outcomes.`
}
