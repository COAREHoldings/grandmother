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
    const { moduleStatus, sections, projectId, userId } = await req.json();
    
    // Module weights: M2 (Hypothesis), M3 (Aims), M5 (Approach) get 1.5x weight
    const WEIGHTS = {
      1: 1.0,  // Title & Concept
      2: 1.5,  // Hypothesis Development
      3: 1.5,  // Specific Aims Structure
      4: 1.0,  // Team Mapping
      5: 1.5,  // Experimental Approach
      6: 1.0,  // Preliminary Data
      7: 1.0,  // Budget & Feasibility
      8: 1.0,  // Impact & Translation
    };
    const MAX_WEIGHTED = 10.5;

    // Calculate module scores
    const moduleScores: Record<number, {
      presence: number;
      clarity: number;
      sufficiency: number;
      score: number;
      weighted: number;
    }> = {};

    let totalWeighted = 0;

    for (const mod of moduleStatus || []) {
      const moduleNum = mod.module_number;
      
      // Calculate Presence (0-5)
      let presence = 0;
      if (mod.status === 'present') presence = 5;
      else if (mod.status === 'incomplete') presence = 2.5;
      
      // Calculate Clarity based on content analysis
      let clarity = 0;
      const sourceStatuses = mod.sources || [];
      const presentSources = sourceStatuses.filter((s: any) => s.status === 'present').length;
      const totalSources = sourceStatuses.length || 1;
      clarity = (presentSources / totalSources) * 5;
      
      // Calculate Sufficiency
      let sufficiency = 0;
      const sectionContent = sections?.[mod.sources?.[0]?.section]?.content || '';
      const wordCount = sectionContent.split(/\s+/).filter(Boolean).length;
      if (wordCount > 500) sufficiency = 5;
      else if (wordCount > 200) sufficiency = 4;
      else if (wordCount > 100) sufficiency = 3;
      else if (wordCount > 50) sufficiency = 2;
      else if (wordCount > 0) sufficiency = 1;
      
      // Module Score = (Presence + Clarity + Sufficiency) / 3
      const moduleScore = (presence + clarity + sufficiency) / 3;
      const weighted = moduleScore * (WEIGHTS[moduleNum as keyof typeof WEIGHTS] || 1.0);
      
      moduleScores[moduleNum] = {
        presence: Math.round(presence * 10) / 10,
        clarity: Math.round(clarity * 10) / 10,
        sufficiency: Math.round(sufficiency * 10) / 10,
        score: Math.round(moduleScore * 10) / 10,
        weighted: Math.round(weighted * 10) / 10,
      };
      
      totalWeighted += weighted;
    }

    // Normalized Score = WeightedScore / MAX_WEIGHTED
    const normalizedScore = totalWeighted / MAX_WEIGHTED;
    
    // NIH Score = 9 - (NormalizedScore * 8)  // 1-9 scale, lower is better
    let nihScore = 9 - (normalizedScore * 8);
    
    // Structural Cap Rule
    let structuralCapApplied = false;
    const m2Score = moduleScores[2]?.score || 0;
    const m3Score = moduleScores[3]?.score || 0;
    const m5Score = moduleScores[5]?.score || 0;
    
    if (m2Score < 2.5 || m3Score < 2.5 || m5Score < 2.5) {
      if (nihScore < 6) {
        nihScore = 6;
        structuralCapApplied = true;
      }
    }
    
    // Round to 1 decimal
    nihScore = Math.round(nihScore * 10) / 10;
    
    // Probability Band
    let probabilityBand = '<10%';
    let probabilityRange = '8-9';
    if (nihScore <= 3) {
      probabilityBand = '45-60%';
      probabilityRange = '1-3';
    } else if (nihScore <= 5) {
      probabilityBand = '20-35%';
      probabilityRange = '4-5';
    } else if (nihScore <= 7) {
      probabilityBand = '10-20%';
      probabilityRange = '6-7';
    }

    // Build response
    const result = {
      moduleScores,
      weightedScore: Math.round(totalWeighted * 100) / 100,
      normalizedScore: Math.round(normalizedScore * 100) / 100,
      nihScore,
      probabilityBand,
      probabilityRange,
      structuralCapApplied,
      criticalModules: {
        hypothesis: m2Score,
        aims: m3Score,
        approach: m5Score,
      },
      modelVersion: 'deterministic_v1',
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});