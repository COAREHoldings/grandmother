import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { project_id } = await req.json()

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: project_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch score summary
    const { data: score, error: scoreError } = await supabase
      .from('rie_scores')
      .select('*')
      .eq('project_id', project_id)
      .single()

    // Fetch claims breakdown by section
    const { data: claims } = await supabase
      .from('rie_claims')
      .select('section_type, claim_type, status, verification_score')
      .eq('project_id', project_id)

    // Aggregate by section
    const sectionBreakdown: Record<string, any> = {}
    if (claims) {
      for (const claim of claims) {
        if (!sectionBreakdown[claim.section_type]) {
          sectionBreakdown[claim.section_type] = {
            total: 0,
            verified: 0,
            unverified: 0,
            partial: 0,
            pending: 0,
            avgScore: 0,
            scores: []
          }
        }
        const section = sectionBreakdown[claim.section_type]
        section.total++
        section[claim.status]++
        if (claim.verification_score) {
          section.scores.push(claim.verification_score)
        }
      }

      // Calculate averages
      for (const key of Object.keys(sectionBreakdown)) {
        const section = sectionBreakdown[key]
        if (section.scores.length > 0) {
          section.avgScore = section.scores.reduce((a: number, b: number) => a + b, 0) / section.scores.length
        }
        delete section.scores
      }
    }

    const response = {
      project_id,
      overall_score: score?.overall_score || 0,
      claims_total: score?.claims_total || 0,
      claims_verified: score?.claims_verified || 0,
      claims_unverified: score?.claims_unverified || 0,
      last_updated: score?.updated_at || null,
      section_breakdown: sectionBreakdown,
      integrity_grade: getIntegrityGrade(score?.overall_score || 0)
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Get score error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function getIntegrityGrade(score: number): { grade: string; label: string; color: string } {
  if (score >= 0.9) return { grade: 'A', label: 'Excellent', color: '#22c55e' }
  if (score >= 0.8) return { grade: 'B', label: 'Good', color: '#84cc16' }
  if (score >= 0.7) return { grade: 'C', label: 'Adequate', color: '#eab308' }
  if (score >= 0.6) return { grade: 'D', label: 'Needs Work', color: '#f97316' }
  return { grade: 'F', label: 'Poor', color: '#ef4444' }
}
