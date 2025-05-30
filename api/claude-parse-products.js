// Save this as: api/claude-parse-products.js
// Copy the EXACT same imports and setup from your working claude-extract-dimensions.js file

// Option A: If your existing file uses this setup
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Option B: If your existing file uses different setup, copy that instead
// For example, some setups use:
// const anthropic = new Anthropic({
//   apiKey: process.env.CLAUDE_API_KEY,  // Different env var name
// });

export default async function handler(req, res) {
  // Add CORS headers if your existing endpoint has them
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, availableStones } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ 
      success: false, 
      error: 'No text provided' 
    });
  }

  const prompt = `You are a stone fabrication expert. Parse this product description text and extract individual products with their specifications.

Available stone types in our system:
${availableStones.join(', ')}

Text to parse:
"""
${text}
"""

Extract each product and return JSON in this exact format:
{
  "products": [
    {
      "quantity": number,
      "name": "descriptive product name (without quantity)",
      "stoneType": "exact match from available stones or null if not found",
      "width": number (in inches, convert feet to inches),
      "depth": number (in inches, convert feet to inches), 
      "confidence": "high|medium|low",
      "features": "backsplash height, sink count, edge details, etc"
    }
  ]
}

Parsing rules:
1. Convert ALL dimensions to inches: 2'D = 24", 6'W = 72", 4'-1" = 49"
2. Extract quantities from formats like: QTY: 26), (QTY: 26), One (1), 26x, etc.
3. For dimensions like "2'D x 6'W": depth=24", width=72" 
4. For dimensions like "30x72" or "30" x 72"": width=30", depth=72"
5. Match stone names fuzzy: "Calacatta Laza Oro" → find best match in available stones
6. Clean product names: remove quantities, bullets, numbers
7. Extract features from "with" clauses: backsplash height, sink count
8. Set confidence: high=clear dimensions+name, medium=some ambiguity, low=unclear

Examples:
- "QTY: 26) 2 Bay Suite Large Vanity (2'D x 6'W with 2" backsplash)" 
  → quantity: 26, name: "2 Bay Suite Large Vanity", width: 72, depth: 24, features: "2" backsplash"
- "One (1) Calacatta Laza Oro Kitchen Island (3'D x 8'W)"
  → quantity: 1, name: "Kitchen Island", width: 96, depth: 36, stoneType: [best match for Calacatta]
- "FOSSIL GRAY – 2CM Quartz Polished (30x72)"
  → quantity: 1, name: "Quartz Countertop", width: 30, depth: 72, stoneType: [best match for Fossil Gray]

Return only valid JSON, no additional text.`;

  try {
    console.log('Calling Claude API for text parsing...');
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0].text;
    console.log('Claude response:', content);

    // Parse the JSON response
    const parsed = JSON.parse(content);
    
    // Validate the response structure
    if (!parsed.products || !Array.isArray(parsed.products)) {
      throw new Error('Invalid response format from Claude');
    }

    // Validate each product
    const validProducts = parsed.products.filter(product => {
      return product.quantity && 
             product.name && 
             product.width && 
             product.depth &&
             !isNaN(product.width) && 
             !isNaN(product.depth) &&
             product.quantity > 0;
    });

    if (validProducts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid products found in the text'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        products: validProducts,
        totalFound: validProducts.length
      }
    });

  } catch (error) {
    console.error('Claude parsing error:', error);
    
    // Handle JSON parsing errors
    if (error.message.includes('JSON')) {
      return res.status(500).json({
        success: false,
        error: 'Failed to parse Claude response. Please try again with clearer product descriptions.'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse products'
    });
  }
}
