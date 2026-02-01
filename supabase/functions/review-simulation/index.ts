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
    const { project } = await req.json();
    
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const reviewerPersonas = [
      {
        name: 'The Methodologist',
        role: 'Statistics and Methodology Expert',
        strictness: 0.9,
        harshness: 0.7,
        focus: 'Evaluates rigor of experimental design, statistical approaches, sample sizes, and reproducibility. Critical of methodological weaknesses.',
        criteria: ['Statistical power', 'Study design', 'Controls', 'Reproducibility', 'Analytical methods']
      },
      {
        name: 'The Champion',
        role: 'Innovation and Impact Advocate',
        strictness: 0.5,
        harshness: 0.3,
        focus: 'Looks for innovative approaches and high-impact potential. Supportive of novel ideas but realistic about feasibility.',
        criteria: ['Innovation', 'Significance', 'Potential impact', 'Novel approaches', 'Field advancement']
      },
      {
        name: 'The Cynic',
        role: 'Feasibility Skeptic',
        strictness: 0.85,
        harshness: 0.85,
        focus: 'Skeptical of overly ambitious timelines, questions feasibility, looks for gaps in preliminary data and team expertise.',
        criteria: ['Feasibility', 'Timeline realism', 'Budget justification', 'Team capability', 'Preliminary data strength']
      }
    ];

    const reviews = [];
    let totalTokens = 0;

    for (const persona of reviewerPersonas) {
      const systemPrompt = `You are ${persona.name}, a ${persona.role} serving on an NIH study section.
Your reviewing style: ${persona.focus}
Your strictness level: ${persona.strictness * 100}%
Your harshness level: ${persona.harshness * 100}%

You evaluate grants using the NIH 1-9 scoring system where:
1 = Exceptional, 2 = Outstanding, 3 = Excellent, 4 = Very Good, 5 = Good, 6 = Satisfactory, 7 = Fair, 8 = Marginal, 9 = Poor

Focus your critique on: ${persona.criteria.join(', ')}

Provide detailed, constructive feedback that helps improve the grant while being honest about weaknesses.`;

      const userMessage = `Review this grant application:

Title: ${project.title || 'Untitled'}
Agency: ${project.target_agency || 'NIH'}
Mechanism: ${project.project_type || 'R01'}

Concept/Significance:
${JSON.stringify(project.concept || {}, null, 2)}

Hypothesis:
${JSON.stringify(project.hypothesis || {}, null, 2)}

Specific Aims:
${JSON.stringify(project.specific_aims || {}, null, 2)}

Approach:
${JSON.stringify(project.approach || {}, null, 2)}

Team:
${JSON.stringify(project.team || {}, null, 2)}

Budget:
${JSON.stringify(project.budget || {}, null, 2)}

Preliminary Data:
${JSON.stringify(project.preliminary_data || {}, null, 2)}

Provide your review in JSON format:
{
  "overall_score": number (1-9),
  "criterion_scores": {
    "significance": number,
    "investigator": number,
    "innovation": number,
    "approach": number,
    "environment": number
  },
  "strengths": ["list of key strengths"],
  "weaknesses": ["list of key weaknesses"],
  "detailed_critique": "Paragraph of detailed feedback",
  "recommendations": ["specific recommendations for improvement"],
  "funding_recommendation": "Fund/Fund with revisions/Do not fund"
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error for ${persona.name}`);
      }

      const result = await response.json();
      const review = JSON.parse(result.choices[0].message.content);
      totalTokens += result.usage?.total_tokens || 0;

      reviews.push({
        reviewer: persona.name,
        role: persona.role,
        ...review
      });
    }

    // Calculate consensus
    const avgScore = reviews.reduce((sum, r) => sum + r.overall_score, 0) / reviews.length;
    const consensusScore = Math.round(avgScore * 10) / 10;
    
    // Estimate funding probability based on score
    let fundingProbability = 0;
    if (consensusScore <= 2) fundingProbability = 85;
    else if (consensusScore <= 3) fundingProbability = 60;
    else if (consensusScore <= 4) fundingProbability = 35;
    else if (consensusScore <= 5) fundingProbability = 15;
    else fundingProbability = 5;

    return new Response(JSON.stringify({
      data: {
        reviews,
        consensus: {
          score: consensusScore,
          percentile: Math.round((9 - consensusScore) / 8 * 100),
          fundingProbability,
          recommendation: consensusScore <= 3 ? 'Likely to be discussed' : 'May not be discussed'
        },
        summary: {
          commonStrengths: findCommonItems(reviews.map(r => r.strengths)),
          commonWeaknesses: findCommonItems(reviews.map(r => r.weaknesses)),
          priorityRecommendations: reviews.flatMap(r => r.recommendations).slice(0, 5)
        }
      },
      tokensUsed: totalTokens
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: { code: 'REVIEW_ERROR', message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function findCommonItems(arrays: string[][]): string[] {
  if (arrays.length === 0) return [];
  const counts = new Map<string, number>();
  arrays.flat().forEach(item => {
    const key = item.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Array.from(counts.entries())
    .filter(([_, count]) => count >= 2)
    .map(([item]) => item)
    .slice(0, 3);
}
