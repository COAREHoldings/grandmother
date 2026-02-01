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
    const { content, filename } = await req.json();
    
    if (!content) {
      return new Response(JSON.stringify({ error: 'No content provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Section patterns for grant documents
    const sectionPatterns = [
      { name: 'title', patterns: [/^title[:\s]/i, /project\s*title/i] },
      { name: 'abstract', patterns: [/^abstract/i, /project\s*summary/i, /summary/i] },
      { name: 'specific_aims', patterns: [/specific\s*aims?/i, /^aims?[:\s]/i] },
      { name: 'significance', patterns: [/significance/i, /background/i] },
      { name: 'innovation', patterns: [/innovation/i, /innovative/i] },
      { name: 'approach', patterns: [/approach/i, /research\s*design/i, /methods?/i, /methodology/i] },
      { name: 'preliminary_data', patterns: [/preliminary\s*(data|studies|results)/i] },
      { name: 'environment', patterns: [/environment/i, /facilities/i, /resources/i] },
      { name: 'budget', patterns: [/budget/i, /costs?/i] },
      { name: 'timeline', patterns: [/timeline/i, /milestones?/i, /schedule/i] },
      { name: 'references', patterns: [/references/i, /bibliography/i, /citations/i] },
      { name: 'biosketch', patterns: [/biosketch/i, /biographical/i, /cv/i, /curriculum\s*vitae/i] },
    ];

    const lines = content.split('\n');
    const sections: Record<string, { status: string; content: string; startLine: number }> = {};
    
    // Initialize all sections as missing
    sectionPatterns.forEach(s => {
      sections[s.name] = { status: 'missing', content: '', startLine: -1 };
    });

    // Detect sections
    let currentSection: string | null = null;
    let currentContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      let foundSection = false;

      for (const sec of sectionPatterns) {
        if (sec.patterns.some(p => p.test(line))) {
          // Save previous section
          if (currentSection && currentContent.length > 0) {
            const text = currentContent.join('\n').trim();
            sections[currentSection].content = text;
            sections[currentSection].status = text.length > 100 ? 'present' : 'incomplete';
          }
          
          currentSection = sec.name;
          currentContent = [];
          sections[sec.name].startLine = i;
          foundSection = true;
          break;
        }
      }

      if (!foundSection && currentSection) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection && currentContent.length > 0) {
      const text = currentContent.join('\n').trim();
      sections[currentSection].content = text;
      sections[currentSection].status = text.length > 100 ? 'present' : 'incomplete';
    }

    // Map to 8-module framework
    const moduleMapping = [
      { module: 1, name: 'Title & Concept Clarity', sources: ['title', 'abstract'] },
      { module: 2, name: 'Hypothesis Development', sources: ['specific_aims', 'significance'] },
      { module: 3, name: 'Specific Aims Structure', sources: ['specific_aims'] },
      { module: 4, name: 'Team Mapping', sources: ['biosketch', 'environment'] },
      { module: 5, name: 'Experimental Approach', sources: ['approach'] },
      { module: 6, name: 'Preliminary Data & Rationale', sources: ['preliminary_data', 'significance'] },
      { module: 7, name: 'Budget & Feasibility', sources: ['budget', 'timeline'] },
      { module: 8, name: 'Impact & Translation', sources: ['significance', 'innovation'] },
    ];

    const moduleStatus = moduleMapping.map(m => {
      const sourceStatuses = m.sources.map(s => sections[s]?.status || 'missing');
      let status = 'missing';
      if (sourceStatuses.every(s => s === 'present')) status = 'present';
      else if (sourceStatuses.some(s => s === 'present' || s === 'incomplete')) status = 'incomplete';
      
      return {
        module_number: m.module,
        module_name: m.name,
        status,
        sources: m.sources.map(s => ({ section: s, status: sections[s]?.status || 'missing' }))
      };
    });

    // Calculate completion
    const presentCount = moduleStatus.filter(m => m.status === 'present').length;
    const incompleteCount = moduleStatus.filter(m => m.status === 'incomplete').length;
    const completionPercent = Math.round((presentCount * 100 + incompleteCount * 50) / 8);

    return new Response(JSON.stringify({
      sections,
      moduleStatus,
      completionPercent,
      wordCount: content.split(/\s+/).length,
      filename
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});