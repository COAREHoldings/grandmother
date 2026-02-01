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
    const { projectContent, reviewerType = 'primary' } = await req.json();
    
    // Reviewer types: primary, secondary, tertiary
    const reviewerProfiles = {
      primary: { focus: ['significance', 'approach'], strictness: 0.9 },
      secondary: { focus: ['innovation', 'investigator'], strictness: 0.7 },
      tertiary: { focus: ['environment', 'budget'], strictness: 0.5 },
    };

    const profile = reviewerProfiles[reviewerType as keyof typeof reviewerProfiles] || reviewerProfiles.primary;
    
    // Heuristic analysis of content sections
    const sections = projectContent?.sections || {};
    const criterionScores: Record<string, number> = {};
    const fatalFlaws: string[] = [];
    const strengths: string[] = [];

    // Score each NIH criterion (1-9 scale)
    const analyzeCriterion = (name: string, sectionKeys: string[]): number => {
      let totalWords = 0;
      let hasContent = false;
      
      for (const key of sectionKeys) {
        const content = sections[key]?.content || '';
        const words = content.split(/\s+/).filter(Boolean).length;
        totalWords += words;
        if (words > 50) hasContent = true;
      }
      
      if (!hasContent) {
        fatalFlaws.push(`${name}: Section appears incomplete or missing`);
        return 8;
      }
      
      // Basic scoring based on content presence
      if (totalWords > 1000) {
        strengths.push(`${name}: Comprehensive coverage`);
        return 2 + Math.random() * 2;
      } else if (totalWords > 500) {
        return 3 + Math.random() * 2;
      } else if (totalWords > 200) {
        return 5 + Math.random() * 2;
      }
      return 7;
    };

    criterionScores.significance = analyzeCriterion('Significance', ['significance', 'abstract']);
    criterionScores.innovation = analyzeCriterion('Innovation', ['innovation']);
    criterionScores.approach = analyzeCriterion('Approach', ['approach', 'preliminary_data']);
    criterionScores.investigator = analyzeCriterion('Investigator', ['biosketch', 'team']);
    criterionScores.environment = analyzeCriterion('Environment', ['environment', 'facilities']);

    // Round scores
    Object.keys(criterionScores).forEach(key => {
      criterionScores[key] = Math.round(criterionScores[key] * 10) / 10;
    });

    // Calculate overall impact
    const avgScore = Object.values(criterionScores).reduce((a, b) => a + b, 0) / 5;
    const overallImpact = Math.round(avgScore * 10);

    // Generate summary based on analysis
    let summary = '';
    if (avgScore <= 3) {
      summary = 'This is a strong application with clear scientific merit and feasibility. The approach is well-designed and the team is well-qualified.';
    } else if (avgScore <= 5) {
      summary = 'This application has merit but several areas need strengthening. The scientific premise is sound but the approach needs more detail.';
    } else if (avgScore <= 7) {
      summary = 'This application has significant weaknesses that limit enthusiasm. Key sections need substantial revision before resubmission.';
    } else {
      summary = 'This application has fundamental flaws that prevent funding consideration. Major revisions to the scientific approach are required.';
    }

    // Add reviewer-specific perspective
    if (reviewerType === 'primary') {
      summary += ' As primary reviewer, I focused on the overall scientific rigor and approach.';
    } else if (reviewerType === 'secondary') {
      summary += ' As secondary reviewer, I evaluated the innovation and investigator qualifications.';
    }

    const result = {
      reviewerType,
      reviewerProfile: profile,
      criterionScores,
      overallImpact,
      fatalFlaws,
      strengths,
      summary,
      recommendation: avgScore <= 5 ? 'discuss' : 'not_discuss',
      modelVersion: 'heuristic_v1',
      readyForLLMUpgrade: true,
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