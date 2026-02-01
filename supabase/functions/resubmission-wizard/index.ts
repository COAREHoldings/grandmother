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
    const { action, summaryStatement, project, critiques } = await req.json();
    
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = '';
    let userMessage = '';

    if (action === 'parse_critiques') {
      systemPrompt = `You are an expert at parsing NIH summary statements and extracting critiques.
Extract each critique with its severity (major/minor), the section it relates to, and the specific concern.`;
      
      userMessage = `Parse this summary statement and extract all critiques:

${summaryStatement}

Return as JSON:
{
  "score": number or null,
  "critiques": [
    {
      "id": "C1",
      "severity": "major" | "minor",
      "section": "Significance" | "Innovation" | "Approach" | "Investigator" | "Environment",
      "concern": "The specific concern raised",
      "quote": "Direct quote from the summary statement"
    }
  ],
  "overallStrengths": ["list"],
  "overallWeaknesses": ["list"]
}`;
    } else if (action === 'generate_responses') {
      systemPrompt = `You are an expert at crafting responses to NIH reviewer critiques for resubmission applications.
Generate professional, detailed responses that address concerns directly while maintaining scientific confidence.`;
      
      userMessage = `Generate responses for these reviewer critiques in the context of this project:

Project Title: ${project?.title || 'Research Project'}
Project Context: ${JSON.stringify(project || {}, null, 2)}

Critiques to address:
${JSON.stringify(critiques, null, 2)}

For each critique, provide:
{
  "responses": [
    {
      "critiqueId": "C1",
      "response": "Professional response text",
      "changes": ["List of specific changes made"],
      "newText": "If applicable, new text to add to the application"
    }
  ]
}`;
    } else if (action === 'generate_introduction') {
      systemPrompt = `You are an expert at writing the Introduction to Resubmission section for NIH grants.
This section must be one page or less and summarize key changes made in response to critiques.`;
      
      userMessage = `Generate an Introduction to Resubmission based on these critiques and responses:

Original Score: ${project?.originalScore || 'N/A'}
Critiques and Responses:
${JSON.stringify(critiques, null, 2)}

Generate a professional introduction (under 1 page) in this JSON format:
{
  "introduction": "Full text of Introduction to Resubmission section",
  "wordCount": number,
  "keyChanges": ["Bulleted summary of major changes"]
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
        max_tokens: 3000,
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
      error: { code: 'RESUBMISSION_ERROR', message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
