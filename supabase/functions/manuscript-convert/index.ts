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
    const { action, project, section, targetJournals } = await req.json();
    
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an expert scientific manuscript writer who specializes in converting grant proposals into peer-reviewed publications. You understand the differences between grant and manuscript writing styles, and can adapt content appropriately for target journals.`;

    let userMessage = '';

    if (action === 'suggest_journals') {
      userMessage = `Based on this grant project, suggest appropriate journals for publication:

Title: ${project?.title || 'Research Project'}
Field/Keywords: ${JSON.stringify(project?.concept?.keywords || [])}
Methodology: ${JSON.stringify(project?.approach || {})}

Return as JSON:
{
  "suggestedJournals": [
    {
      "name": "Journal name",
      "impactFactor": number,
      "scope": "Brief description of journal scope",
      "fitScore": number (1-10),
      "rationale": "Why this journal is appropriate",
      "turnaroundTime": "Typical review time"
    }
  ]
}`;
    } else if (action === 'convert_section') {
      const sectionPrompts: Record<string, string> = {
        abstract: `Convert the grant's specific aims and significance into a structured abstract (Background, Methods, Results, Conclusions). Keep under 300 words.`,
        introduction: `Convert the grant's significance and innovation sections into a compelling introduction. Include proper context, gap statement, and objectives.`,
        methods: `Convert the grant's approach section into detailed methods. Include study design, participants, procedures, and statistical analysis.`,
        results: `Based on the preliminary data and expected outcomes, draft a results section. Note: This will need to be updated with actual data.`,
        discussion: `Convert the grant's expected outcomes and significance into a discussion. Include interpretation, limitations, and future directions.`
      };

      userMessage = `Convert this grant content into a ${section} section for a scientific manuscript:

Project: ${project?.title}
Target Journals: ${JSON.stringify(targetJournals || [])}

Grant Content:
${JSON.stringify(project || {}, null, 2)}

Instructions: ${sectionPrompts[section] || 'Convert to manuscript format.'}

Return as JSON:
{
  "section": "${section}",
  "content": "Full text of the section",
  "wordCount": number,
  "suggestions": ["Suggestions for improvement"],
  "referencesNeeded": ["Topics that need citations"]
}`;
    } else if (action === 'full_conversion') {
      userMessage = `Convert this entire grant into a manuscript draft:

${JSON.stringify(project, null, 2)}

Return as JSON:
{
  "abstract": "Abstract text",
  "introduction": "Introduction text",
  "methods": "Methods text",
  "results": "Results framework based on aims",
  "discussion": "Discussion text",
  "wordCounts": { "abstract": n, "introduction": n, "methods": n, "results": n, "discussion": n },
  "totalWordCount": number
}`;
    }

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
    const content = JSON.parse(result.choices[0].message.content);

    return new Response(JSON.stringify({
      data: content,
      tokensUsed: result.usage?.total_tokens || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: { code: 'MANUSCRIPT_ERROR', message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
