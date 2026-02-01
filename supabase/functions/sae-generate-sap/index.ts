// SAE SAP Generator - Drafts Statistical Analysis Plan blocks for each aim
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface SAPGenerateRequest {
  aim_id: string;
  aim_text: string;
  stats_inputs: {
    sample_size?: number;
    power?: number;
    alpha?: number;
    effect_size?: string;
    primary_outcome?: string;
    statistical_test?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { aim_id, aim_text, stats_inputs }: SAPGenerateRequest = await req.json();

    if (!aim_id || !aim_text) {
      return new Response(JSON.stringify({ error: 'aim_id and aim_text are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate SAP blocks based on inputs
    const sapBlocks = generateSAPBlocks(aim_text, stats_inputs);

    // Return generated SAP blocks
    return new Response(JSON.stringify({
      aim_id,
      sap_blocks: sapBlocks,
      generated_at: new Date().toISOString(),
      version: 1
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateSAPBlocks(aimText: string, inputs: SAPGenerateRequest['stats_inputs']) {
  const blocks = [];

  // Block 1: Study Design
  blocks.push({
    block_type: 'study_design',
    title: 'Study Design',
    content: `This aim will employ a ${detectStudyDesign(aimText)} design to test the hypothesis.`,
    editable: true,
    required: true
  });

  // Block 2: Primary Outcome
  blocks.push({
    block_type: 'primary_outcome',
    title: 'Primary Outcome Measure',
    content: inputs.primary_outcome 
      ? `The primary outcome measure is ${inputs.primary_outcome}.`
      : 'Define the primary outcome measure for this aim.',
    editable: true,
    required: true
  });

  // Block 3: Sample Size Justification
  const sampleText = inputs.sample_size && inputs.power && inputs.alpha
    ? `A sample size of n=${inputs.sample_size} provides ${(inputs.power * 100).toFixed(0)}% power to detect the expected effect at α=${inputs.alpha}.`
    : 'Sample size calculation pending. Specify power, alpha, and expected effect size.';
  
  blocks.push({
    block_type: 'sample_size',
    title: 'Sample Size Justification',
    content: sampleText,
    editable: true,
    required: true
  });

  // Block 4: Statistical Test
  blocks.push({
    block_type: 'statistical_test',
    title: 'Statistical Analysis Method',
    content: inputs.statistical_test
      ? `The primary analysis will use ${inputs.statistical_test}.`
      : suggestStatisticalTest(aimText),
    editable: true,
    required: true
  });

  // Block 5: Effect Size
  blocks.push({
    block_type: 'effect_size',
    title: 'Expected Effect Size',
    content: inputs.effect_size
      ? `The expected effect size is ${inputs.effect_size}, based on preliminary data or published literature.`
      : 'Specify the expected effect size with justification from preliminary data or literature.',
    editable: true,
    required: true
  });

  // Block 6: Missing Data
  blocks.push({
    block_type: 'missing_data',
    title: 'Missing Data Handling',
    content: 'Missing data will be handled using [specify method: multiple imputation, complete case analysis, etc.].',
    editable: true,
    required: false
  });

  // Block 7: Sensitivity Analysis
  blocks.push({
    block_type: 'sensitivity',
    title: 'Sensitivity Analyses',
    content: 'Sensitivity analyses will be conducted to assess robustness of findings.',
    editable: true,
    required: false
  });

  return blocks;
}

function detectStudyDesign(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('randomiz')) return 'randomized controlled trial';
  if (lower.includes('cohort')) return 'prospective cohort';
  if (lower.includes('case-control')) return 'case-control';
  if (lower.includes('cross-section')) return 'cross-sectional';
  if (lower.includes('longitudinal')) return 'longitudinal';
  return 'experimental';
}

function suggestStatisticalTest(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('compar') && lower.includes('group')) {
    return 'Group comparisons will be analyzed using t-tests or ANOVA as appropriate.';
  }
  if (lower.includes('correlat') || lower.includes('associat')) {
    return 'Associations will be examined using regression analysis.';
  }
  if (lower.includes('survival') || lower.includes('time-to')) {
    return 'Time-to-event outcomes will be analyzed using Kaplan-Meier and Cox regression.';
  }
  return 'Specify the appropriate statistical test based on outcome type and design.';
}
