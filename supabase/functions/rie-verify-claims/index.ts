import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface VerifyClaimsRequest {
  project_id: string
  claim_ids?: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { project_id, claim_ids }: VerifyClaimsRequest = await req.json()

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: project_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch pending claims for this project
    let query = supabase
      .from('rie_claims')
      .select('*')
      .eq('project_id', project_id)
      .eq('status', 'pending')

    if (claim_ids && claim_ids.length > 0) {
      query = query.in('id', claim_ids)
    }

    const { data: claims, error: fetchError } = await query.limit(10)

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch claims', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!claims || claims.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No pending claims to verify', verified: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process each claim
    const results = []
    for (const claim of claims) {
      const verification = verifyClaim(claim)
      
      // Update claim status
      await supabase
        .from('rie_claims')
        .update({
          status: verification.status,
          verification_score: verification.score,
          verification_notes: verification.notes,
          verified_at: new Date().toISOString()
        })
        .eq('id', claim.id)

      // If references found, store them
      if (verification.references.length > 0) {
        const refsToInsert = verification.references.map(ref => ({
          claim_id: claim.id,
          project_id: project_id,
          reference_text: ref.text,
          source_type: ref.source_type,
          relevance_score: ref.relevance,
          created_at: new Date().toISOString()
        }))

        await supabase.from('rie_references').insert(refsToInsert)
      }

      results.push({
        claim_id: claim.id,
        claim_text: claim.claim_text.substring(0, 100) + '...',
        status: verification.status,
        score: verification.score,
        references_found: verification.references.length
      })
    }

    // Update project RIE score
    await updateProjectScore(supabase, project_id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Claim verification error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

interface VerificationResult {
  status: 'verified' | 'unverified' | 'partial'
  score: number
  notes: string
  references: Array<{
    text: string
    source_type: string
    relevance: number
  }>
}

function verifyClaim(claim: any): VerificationResult {
  // Simulated verification logic
  // In production, this would integrate with literature APIs
  const claimText = claim.claim_text.toLowerCase()
  
  let score = 0.5
  let status: 'verified' | 'unverified' | 'partial' = 'partial'
  const references: Array<{ text: string; source_type: string; relevance: number }> = []
  const notes: string[] = []

  // Boost score for statistical claims with proper formatting
  if (claim.claim_type === 'statistical') {
    if (/p\s*[<>=]\s*0?\.\d+/i.test(claimText)) {
      score += 0.15
      notes.push('Contains properly formatted p-value')
    }
    if (/\d+%/.test(claimText)) {
      score += 0.1
      notes.push('Contains percentage statistic')
    }
  }

  // Check for citation indicators
  if (/\(\d{4}\)/.test(claim.claim_text) || /et\s+al\.?/i.test(claimText)) {
    score += 0.2
    notes.push('Contains citation reference')
    references.push({
      text: 'Inline citation detected',
      source_type: 'citation',
      relevance: 0.8
    })
  }

  // Penalize vague language
  if (/many\s+studies|some\s+research|it\s+is\s+known/i.test(claimText)) {
    score -= 0.15
    notes.push('Contains vague reference language')
  }

  // Determine final status
  if (score >= 0.7) {
    status = 'verified'
  } else if (score < 0.4) {
    status = 'unverified'
  }

  return {
    status,
    score: Math.max(0, Math.min(1, score)),
    notes: notes.join('; ') || 'Standard verification applied',
    references
  }
}

async function updateProjectScore(supabase: any, projectId: string) {
  // Calculate aggregate score for the project
  const { data: claims } = await supabase
    .from('rie_claims')
    .select('verification_score, status')
    .eq('project_id', projectId)
    .not('status', 'eq', 'pending')

  if (!claims || claims.length === 0) return

  const totalScore = claims.reduce((sum: number, c: any) => sum + (c.verification_score || 0), 0)
  const avgScore = totalScore / claims.length
  const verifiedCount = claims.filter((c: any) => c.status === 'verified').length

  await supabase.from('rie_scores').upsert({
    project_id: projectId,
    overall_score: avgScore,
    claims_total: claims.length,
    claims_verified: verifiedCount,
    claims_unverified: claims.filter((c: any) => c.status === 'unverified').length,
    updated_at: new Date().toISOString()
  }, { onConflict: 'project_id' })
}
