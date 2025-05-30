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

  const prompt = `Parse this stone fabrication product text and return ONLY valid JSON.

Available stones: ${availableStones.join(', ')}

Text: "${text}"

Return this exact JSON format with no other text:
{
  "products": [
    {
      "quantity": 1,
      "name": "Product Name",
      "stoneType": null,
      "width": 24,
      "depth": 36,
      "confidence": "high",
      "features": ""
    }
  ]
}

Rules:
- Convert feet to inches: 2'D=24", 6'W=72", 4'-1"=49"
- Extract quantity from: QTY:26, (26), One(1), etc.
- For "2'D x 6'W": depth=24, width=72
- Match stone names to available list or use null
- Confidence: high/medium/low
- Features: backsplash, sinks from "with" clauses

CRITICAL: Return ONLY the JSON object, no explanations.`;

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

    const content = response.content[0].text.trim();
    console.log('Raw Claude response:', content);

    // Try to clean the response if it has extra text
    let jsonText = content;
    
    // Look for JSON object in the response
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonText = content.substring(jsonStart, jsonEnd + 1);
    }
    
    console.log('Cleaned JSON text:', jsonText);

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Attempted to parse:', jsonText);
      throw new Error('Claude returned invalid JSON format');
    }
    
    // Validate the response structure
    if (!parsed.products || !Array.isArray(parsed.products)) {
      console.error('Invalid structure:', parsed);
      throw new Error('Invalid response format from Claude - missing products array');
    }

    // Validate and clean each product
    const validProducts = parsed.products.filter(product => {
      const isValid = product.quantity && 
             product.name && 
             product.width && 
             product.depth &&
             !isNaN(Number(product.width)) && 
             !isNaN(Number(product.depth)) &&
             Number(product.quantity) > 0;
             
      if (!isValid) {
        console.warn('Invalid product filtered out:', product);
      }
      
      return isValid;
    }).map(product => ({
      ...product,
      quantity: Number(product.quantity),
      width: Number(product.width),
      depth: Number(product.depth),
      confidence: product.confidence || 'medium',
      features: product.features || '',
      stoneType: product.stoneType || null
    }));

    if (validProducts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid products found in the text. Please check dimensions and format.'
      });
    }

    console.log('Successfully parsed products:', validProducts);

    res.status(200).json({
      success: true,
      data: {
        products: validProducts,
        totalFound: validProducts.length
      }
    });

  } catch (error) {
    console.error('Claude parsing error:', error);
    
    // More specific error messages
    if (error.message.includes('JSON')) {
      return res.status(500).json({
        success: false,
        error: 'Could not parse the response. Please try with simpler product descriptions or check the format.'
      });
    }
    
    if (error.message.includes('API')) {
      return res.status(500).json({
        success: false,
        error: 'API connection error. Please try again in a moment.'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse products'
    });
  }
}
