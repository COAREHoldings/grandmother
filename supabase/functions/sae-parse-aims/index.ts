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

    const { project_id, aims_text } = await req.json()

    if (!project_id || !aims_text) {
      return new Response(
        JSON.stringify({ error: 'Missing project_id or aims_text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse aims from text using pattern matching
    const aims = parseAims(aims_text)

    // Insert parsed aims
    const insertedAims = []
    for (let i = 0; i < aims.length; i++) {
      const aim = aims[i]
      const { data, error } = await supabase
        .from('sae_aims')
        .insert({
          project_id,
          aim_index: i + 1,
          aim_text: aim.text,
          question_type: classifyAim(aim.text)
        })
        .select()
        .single()

      if (!error && data) {
        // Create empty stats input record
        await supabase.from('sae_aim_stats_inputs').insert({ aim_id: data.id })
        insertedAims.push(data)
      }
    }

    return new Response(
      JSON.stringify({ success: true, aims: insertedAims }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function parseAims(text: string): Array<{ text: string }> {
  const aims: Array<{ text: string }> = []
  
  // Pattern 1: "Aim 1:", "Aim 2:", etc.
  const aimPattern = /(?:Aim|AIM|SPECIFIC AIM)\s*(\d+)[:\.]?\s*([^]*?)(?=(?:Aim|AIM|SPECIFIC AIM)\s*\d+|$)/gi
  let match
  
  while ((match = aimPattern.exec(text)) !== null) {
    const aimText = match[2].trim()
    if (aimText.length > 10) {
      aims.push({ text: aimText })
    }
  }

  // Fallback: split by numbered lists
  if (aims.length === 0) {
    const numbered = text.split(/\n\s*\d+[\.\)]\s+/)
    for (const item of numbered) {
      if (item.trim().length > 30) {
        aims.push({ text: item.trim() })
      }
    }
  }

  return aims
}

function classifyAim(text: string): string {
  const lower = text.toLowerCase()
  
  if (/compar|difference|between.*(group|arm)/i.test(lower)) {
    if (/proportion|percent|rate|incidence/i.test(lower)) return 'difference_proportions'
    return 'difference_means'
  }
  if (/survival|time.to|hazard|kaplan/i.test(lower)) return 'time_to_event'
  if (/repeated|longitudinal|over time|trajectory/i.test(lower)) return 'repeated_measures'
  if (/cluster|multilevel|hierarchical|nested/i.test(lower)) return 'clustered'
  if (/associat|correlat|regress|predict/i.test(lower)) return 'association_regression'
  if (/omics|genomic|proteomic|transcriptom/i.test(lower)) return 'high_dimensional'
  if (/sensitiv|specific|roc|auc|diagnostic/i.test(lower)) return 'diagnostic_classifier'
  if (/equivalen|non.?inferior|margin/i.test(lower)) return 'equivalence_noninferiority'
  
  return 'difference_means'
}
