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
    const { module, action, data, projectContext } = await req.json();
    
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompts: Record<string, string> = {
      concept: `You are an expert biomedical grant writing consultant specializing in concept development. 
Help researchers articulate their research concept, identify gaps in the field, describe clinical burden, 
and align with funding opportunity announcements (FOAs). Output should be structured and actionable.`,
      
      hypothesis: `You are a scientific hypothesis development expert. Help researchers craft testable, 
falsifiable hypotheses. Evaluate hypothesis clarity, testability, and suggest alternative hypotheses. 
Ensure hypotheses are specific, measurable, and aligned with the research concept.`,
      
      aims: `You are a specific aims expert for NIH-style grants. Help develop 2-3 well-structured specific aims 
with clear objectives, sub-aims, and success metrics. Analyze aim dependencies and identify potential risks.
Generate professional aim page drafts.`,
      
      team: `You are a research team assembly consultant. Help identify required expertise, suggest team roles,
and ensure appropriate personnel matching for grant projects. Consider required skills, percent effort, and institutional requirements.`,
      
      approach: `You are a research methodology expert. Help develop detailed research approaches including 
experimental design, methods, timelines, milestones, and alternative strategies. Ensure scientific rigor.`,
      
      budget: `You are a grant budget specialist familiar with NIH salary caps ($232,200), indirect costs,
STTR 40/30 rules, and federal budget requirements. Help create justified, compliant budgets.`,
      
      preliminary_data: `You are a preliminary data organization specialist. Help researchers organize and present 
their existing data to support grant feasibility. Suggest data visualizations and narrative connections.`,
      
      summary_figure: `You are a scientific visualization consultant. Help design summary figures that 
communicate the research concept, approach, and expected outcomes in a single compelling visual.`
    };

    const actionPrompts: Record<string, string> = {
      generate: 'Generate comprehensive content for this section based on the provided information.',
      improve: 'Improve and enhance the existing content while maintaining the original intent.',
      critique: 'Provide constructive feedback and suggestions for improvement.',
      align_foa: 'Analyze alignment with the specified FOA and suggest improvements.',
      validate: 'Validate the content for scientific accuracy and grant requirements.'
    };

    const systemPrompt = systemPrompts[module] || systemPrompts.concept;
    const actionPrompt = actionPrompts[action] || actionPrompts.generate;

    const userMessage = `
${actionPrompt}

Project Context:
- Title: ${projectContext?.title || 'Not specified'}
- Agency: ${projectContext?.agency || 'NIH'}
- Mechanism: ${projectContext?.mechanism || 'R01'}
- FOA: ${projectContext?.foa || 'Not specified'}

Current Input:
${JSON.stringify(data, null, 2)}

Please provide your response in JSON format with the following structure:
{
  "content": "Main generated content",
  "suggestions": ["List of improvement suggestions"],
  "warnings": ["Any concerns or warnings"],
  "metadata": { "wordCount": number, "readabilityScore": number }
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
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    const aiContent = JSON.parse(result.choices[0].message.content);
    const tokensUsed = result.usage?.total_tokens || 0;

    return new Response(JSON.stringify({
      data: aiContent,
      tokensUsed,
      model: 'gpt-4o'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: { code: 'AI_ERROR', message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
