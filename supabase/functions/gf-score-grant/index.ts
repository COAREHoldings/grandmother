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
    const { sections, moduleStatus } = await req.json();

    // Score each NIH criterion (1-9 scale, 1=best, 9=worst)
    const scoreSection = (sectionNames: string[], weight = 1): number => {
      let totalScore = 0;
      let count = 0;
      
      for (const name of sectionNames) {
        const section = sections?.[name];
        if (!section) {
          totalScore += 9; // Missing = worst
        } else if (section.status === 'present') {
          const contentLength = section.content?.length || 0;
          // Score based on content richness
          if (contentLength > 2000) totalScore += 2;
          else if (contentLength > 1000) totalScore += 3;
          else if (contentLength > 500) totalScore += 4;
          else totalScore += 5;
        } else if (section.status === 'incomplete') {
          totalScore += 6;
        } else {
          totalScore += 8;
        }
        count++;
      }
      
      return count > 0 ? Math.round(totalScore / count) : 9;
    };

    // NIH Review Criteria Scores
    const significance = scoreSection(['significance', 'abstract']);
    const innovation = scoreSection(['innovation', 'approach']);
    const approach = scoreSection(['approach', 'preliminary_data', 'timeline']);
    const investigator = scoreSection(['biosketch']);
    const environment = scoreSection(['environment']);

    // Calculate overall impact score (10-90 scale)
    // Lower individual scores = better, so we need to invert for impact
    const avgCriterion = (significance + innovation + approach + investigator + environment) / 5;
    const impactScore = Math.round(avgCriterion * 10);

    // Funding probability band
    let fundingProbability: string;
    if (impactScore <= 25) fundingProbability = 'High';
    else if (impactScore <= 40) fundingProbability = 'Moderate';
    else fundingProbability = 'Low';

    // Module strength scoring
    const moduleStrength: Record<number, { presence: number; clarity: number; sufficiency: number; strength: number; deficient: boolean }> = {};
    
    if (moduleStatus) {
      for (const mod of moduleStatus) {
        const presence = mod.status === 'present' ? 5 : mod.status === 'incomplete' ? 3 : 0;
        // Estimate clarity and sufficiency from available data
        const sourcePresent = mod.sources?.filter((s: any) => s.status === 'present').length || 0;
        const totalSources = mod.sources?.length || 1;
        const clarity = Math.round((sourcePresent / totalSources) * 5);
        const sufficiency = Math.round((presence + clarity) / 2);
        const strength = Math.round((presence + clarity + sufficiency) / 3);
        
        moduleStrength[mod.module_number] = {
          presence,
          clarity,
          sufficiency,
          strength,
          deficient: strength < 3
        };
      }
    }

    const deficientModules = Object.entries(moduleStrength)
      .filter(([_, v]) => v.deficient)
      .map(([k, _]) => parseInt(k));

    return new Response(JSON.stringify({
      nihScores: {
        significance,
        innovation,
        approach,
        investigator,
        environment
      },
      impactScore,
      fundingProbability,
      moduleStrength,
      deficientModules,
      recommendations: generateRecommendations(significance, innovation, approach, investigator, environment, deficientModules)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateRecommendations(sig: number, inn: number, app: number, inv: number, env: number, deficient: number[]): string[] {
  const recs: string[] = [];
  
  if (sig > 4) recs.push('Strengthen the significance section with clearer problem statement and broader impact');
  if (inn > 4) recs.push('Highlight innovative aspects more prominently');
  if (app > 4) recs.push('Provide more methodological detail and address potential pitfalls');
  if (inv > 5) recs.push('Expand investigator credentials and relevant experience');
  if (env > 5) recs.push('Better describe available resources and institutional support');
  
  const moduleNames: Record<number, string> = {
    1: 'Title & Concept Clarity',
    2: 'Hypothesis Development', 
    3: 'Specific Aims Structure',
    4: 'Team Mapping',
    5: 'Experimental Approach',
    6: 'Preliminary Data',
    7: 'Budget & Feasibility',
    8: 'Impact & Translation'
  };
  
  deficient.forEach(m => {
    recs.push(`Module "${moduleNames[m]}" is structurally deficient and needs attention`);
  });
  
  return recs;
}