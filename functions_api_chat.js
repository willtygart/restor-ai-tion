export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { message } = await request.json();
        
        if (!message) {
            return new Response(JSON.stringify({ error: 'Message is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Get knowledge base from KV storage
        let knowledgeBase = "";
        try {
            const kbData = await env.KNOWLEDGE_BASE.get("restoration_knowledge", "json");
            if (kbData) {
                // Format knowledge base for AI
                knowledgeBase = Object.entries(kbData).map(([category, data]) => {
                    return `${category.toUpperCase().replace(/-/g, ' ')}:\n${data.content}\n`;
                }).join('\n');
            }
        } catch (error) {
            console.error('Failed to load knowledge base:', error);
            // Fallback to basic knowledge if KV fails
            knowledgeBase = `
EMERGENCY FIRST STEPS:
- Water damage: Turn off source, document with photos, start drying within 24 hours
- Fire damage: Ensure safety, secure property, document everything
- Mold: Ventilate area, don't disturb large areas (>10 sq ft), call professionals
- Storm damage: Make temporary repairs to prevent further damage

COST ESTIMATES:
- Water damage: $1,000-$7,000 depending on severity
- Mold remediation: $500-$6,000 depending on scope
- Fire damage: $3,000-$15,000+ depending on extent
- Storm damage: $2,000-$10,000 depending on damage

INSURANCE TIPS:
- Document everything with photos/video
- Keep all receipts for emergency repairs
- Most policies cover sudden, accidental damage
- Flood damage requires separate flood insurance
            `;
        }
        
        const systemPrompt = `You are Restor-AI, a professional restoration assistant specializing in helping customers with property damage and restoration needs.

KNOWLEDGE BASE:
${knowledgeBase}

GUIDELINES:
- Always prioritize safety first
- Provide specific, actionable advice
- Include realistic cost estimates when relevant
- Recommend professional help for complex/dangerous situations
- Suggest documenting everything for insurance claims
- Be empathetic - restoration situations are stressful
- If asked about something outside restoration, politely redirect
- Provide emergency steps for urgent situations
- Keep responses helpful but concise

Answer the customer's question using the knowledge base above. Be helpful, professional, and thorough.`;
        
        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
        ];
        
        const response = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
            messages: messages,
            max_tokens: 512,
            temperature: 0.7
        });
        
        return new Response(JSON.stringify({ 
            response: response.response || "I apologize, but I couldn't generate a response. Please try again."
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
        
    } catch (error) {
        console.error('Error in chat function:', error);
        
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            response: "I'm sorry, I'm having trouble right now. Please try again in a moment."
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
