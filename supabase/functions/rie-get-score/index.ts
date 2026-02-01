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

    const { project_id, include_claims } = await req.json()

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: project_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: score } = await supabase
      .from('rie_scores')
      .select('*')
      .eq('project_id', project_id)
      .single()

    // Fetch claims with references for detailed view
    const claimSelect = include_claims 
      ? 'id, section_type, claim_type, claim_text, status, verification_score, rie_references(reference_text)'
      : 'section_type, claim_type, status, verification_score'
    
    const { data: claims } = await supabase
      .from('rie_claims')
      .select(claimSelect)
      .eq('project_id', project_id)

    const sectionBreakdown: Record<string, any> = {}
    const sectionRIS: Array<{ section_name: string; score: number; claims: any[] }> = []
    const claimsBySection: Record<string, any[]> = {}

    if (claims) {
      for (const claim of claims) {
        const section = claim.section_type
        if (!claimsBySection[section]) claimsBySection[section] = []
        claimsBySection[section].push(claim)
        
        if (!sectionBreakdown[section]) {
          sectionBreakdown[section] = { total: 0, verified: 0, unverified: 0, partial: 0, pending: 0, avgScore: 0, scores: [] }
        }
        const sb = sectionBreakdown[section]
        sb.total++
        sb[claim.status]++
        if (claim.verification_score) sb.scores.push(claim.verification_score)
      }

      for (const [section, sectionClaims] of Object.entries(claimsBySection)) {
        const sb = sectionBreakdown[section]
        if (sb.scores.length > 0) {
          sb.avgScore = sb.scores.reduce((a: number, b: number) => a + b, 0) / sb.scores.length
        }
        delete sb.scores

        if (include_claims) {
          sectionRIS.push({
            section_name: section,
            score: Math.round((sb.avgScore || 0) * 100),
            claims: (sectionClaims as any[]).map((c: any) => ({
              id: c.id,
              claim_text: c.claim_text || '',
              support_status: c.status === 'verified' ? 'supported' : c.status === 'partial' ? 'weak' : 'missing',
              best_reference: c.rie_references?.[0] ? { title: c.rie_references[0].reference_text, year: 2024 } : undefined,
              alignment_score: c.verification_score || 0,
              validation_flags: { peer_reviewed: c.status === 'verified', retracted: false, preprint: false }
            }))
          })
        }
      }
    }

    return new Response(
      JSON.stringify({
        project_id,
        overall_score: score?.overall_score || 0,
        claims_total: score?.claims_total || 0,
        claims_verified: score?.claims_verified || 0,
        claims_unverified: score?.claims_unverified || 0,
        last_updated: score?.updated_at || null,
        section_breakdown: sectionBreakdown,
        section_ris: sectionRIS,
        integrity_grade: getIntegrityGrade(score?.overall_score || 0)
      }),
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
