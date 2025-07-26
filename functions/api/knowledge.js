export async function onRequestGet(context) {
    const { env } = context;
    
    try {
        const knowledgeBase = await env.KNOWLEDGE_BASE.get("restoration_knowledge", "json");
        
        return new Response(JSON.stringify(knowledgeBase || {}), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to retrieve knowledge base" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { category, content, action = 'update' } = await request.json();
        
        // Get existing knowledge base
        let knowledgeBase = await env.KNOWLEDGE_BASE.get("restoration_knowledge", "json") || {};
        
        if (action === 'update') {
            // Update or add category
            knowledgeBase[category] = {
                content: content,
                updated: new Date().toISOString(),
                updatedBy: 'admin'
            };
        } else if (action === 'delete') {
            // Delete category
            delete knowledgeBase[category];
        }
        
        // Save back to KV
        await env.KNOWLEDGE_BASE.put("restoration_knowledge", JSON.stringify(knowledgeBase));
        
        return new Response(JSON.stringify({ 
            success: true, 
            message: `Knowledge base ${action}d successfully`,
            categories: Object.keys(knowledgeBase)
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: "Failed to update knowledge base",
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
