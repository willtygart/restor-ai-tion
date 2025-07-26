export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        
        // Parse the request body
        const { message } = await request.json();
        
        if (!message) {
            return new Response(JSON.stringify({ error: 'Message is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Create the AI prompt with restoration context
        const systemPrompt = `You are Restor-AI, a helpful assistant specializing in home restoration, repairs, and damage assessment. You help people with:
        
        - Water damage restoration
        - Fire damage repair
        - Mold remediation
        - Home repairs and maintenance
        - Insurance claim guidance
        - Emergency restoration procedures
        - Property damage assessment
        
        Provide helpful, practical advice while being friendly and professional. If asked about something outside restoration/repair topics, politely redirect to your specialty area.`;
        
        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
        ];
        
        // Call Cloudflare Workers AI
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

// Handle CORS preflight requests
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
