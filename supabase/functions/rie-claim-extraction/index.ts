import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface ClaimExtractionRequest {
  project_id: string
  section_type: string
  content: string
}

interface ExtractedClaim {
  claim_text: string
  claim_type: 'factual' | 'methodological' | 'statistical'
  confidence: number
  context: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { project_id, section_type, content }: ClaimExtractionRequest = await req.json()

    if (!project_id || !section_type || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: project_id, section_type, content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract claims using pattern matching and heuristics
    const claims = extractClaims(content, section_type)

    // Store extracted claims in database
    const claimsToInsert = claims.map(claim => ({
      project_id,
      section_type,
      claim_text: claim.claim_text,
      claim_type: claim.claim_type,
      confidence: claim.confidence,
      context: claim.context,
      status: 'pending',
      created_at: new Date().toISOString()
    }))

    if (claimsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('rie_claims')
        .insert(claimsToInsert)

      if (insertError) {
        console.error('Error inserting claims:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to store claims', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        claims_extracted: claims.length,
        claims: claims
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Claim extraction error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function extractClaims(content: string, sectionType: string): ExtractedClaim[] {
  const claims: ExtractedClaim[] = []
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)

  // Patterns for different claim types
  const factualPatterns = [
    /studies?\s+(show|demonstrate|indicate|reveal|found)/i,
    /research\s+(has\s+)?(shown|demonstrated|established)/i,
    /evidence\s+(suggests|indicates|shows)/i,
    /according\s+to/i,
    /\d+%\s+of/i,
    /has\s+been\s+(shown|demonstrated|proven)/i,
  ]

  const statisticalPatterns = [
    /\d+(\.\d+)?%/,
    /p\s*[<>=]\s*0?\.\d+/i,
    /\d+\s*(million|billion|thousand)/i,
    /significantly\s+(higher|lower|greater|more|less)/i,
    /\d+\s*-\s*fold/i,
  ]

  const methodologicalPatterns = [
    /we\s+(will\s+)?(use|employ|apply|implement)/i,
    /method(ology)?\s+(involves?|includes?|consists?)/i,
    /approach\s+(is|will\s+be|involves?)/i,
    /protocol\s+(requires?|specifies?)/i,
  ]

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (trimmed.length < 30) continue

    let claimType: 'factual' | 'methodological' | 'statistical' | null = null
    let confidence = 0.5

    // Check for statistical claims first (most specific)
    for (const pattern of statisticalPatterns) {
      if (pattern.test(trimmed)) {
        claimType = 'statistical'
        confidence = 0.85
        break
      }
    }

    // Check for factual claims
    if (!claimType) {
      for (const pattern of factualPatterns) {
        if (pattern.test(trimmed)) {
          claimType = 'factual'
          confidence = 0.75
          break
        }
      }
    }

    // Check for methodological claims
    if (!claimType) {
      for (const pattern of methodologicalPatterns) {
        if (pattern.test(trimmed)) {
          claimType = 'methodological'
          confidence = 0.7
          break
        }
      }
    }

    if (claimType) {
      claims.push({
        claim_text: trimmed,
        claim_type: claimType,
        confidence,
        context: sectionType
      })
    }
  }

  return claims
}
