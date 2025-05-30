// api/claude-extract-dimensions.js - UPGRADED TO OPUS 4
import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude with error checking
let anthropic;
try {
  if (!process.env.CLAUDE_API_KEY) {
    console.error('CLAUDE_API_KEY is not set in environment variables');
  } else {
    console.log('Claude API key found, length:', process.env.CLAUDE_API_KEY.length);
    anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
  }
} catch (error) {
  console.error('Failed to initialize Anthropic:', error);
}

// Helper function to determine media type
function determineMediaType(base64Data) {
  if (!base64Data) return 'image/jpeg';
  
  const firstChars = base64Data.substring(0, 20);
  console.log('First chars of base64:', firstChars);
  
  if (base64Data.startsWith('/9j/')) return 'image/jpeg';
  if (base64Data.startsWith('iVBORw0KGgo')) return 'image/png';
  if (base64Data.startsWith('R0lGODlh')) return 'image/gif';
  if (base64Data.startsWith('UklGR')) return 'image/webp';
  return 'image/jpeg'; // Default
}

export default async function handler(req, res) {
  console.log('=== Claude Drawing Analysis API (Opus 4) ===');
  console.log('Method:', req.method);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if API key is available
    if (!process.env.CLAUDE_API_KEY) {
      console.error('CLAUDE_API_KEY environment variable is not set');
      return res.status(500).json({
        success: false,
        error: 'API configuration error',
        details: 'Claude API key is not configured. Please set CLAUDE_API_KEY in environment variables.'
      });
    }

    // Check if Anthropic initialized
    if (!anthropic) {
      console.error('Anthropic client not initialized');
      return res.status(500).json({
        success: false,
        error: 'API initialization error',
        details: 'Failed to initialize Claude client'
      });
    }

    console.log('Processing Claude drawing extraction with Opus 4...');

    // Get the uploaded image data
    const { image, hints, retryWithContext } = req.body;
    
    console.log('Request body size:', JSON.stringify(req.body).length);
    console.log('Image data exists:', !!image);
    console.log('Image data length:', image ? image.length : 0);
    
    if (!image) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image provided' 
      });
    }

    // Detect media type
    const mediaType = determineMediaType(image);
    console.log('Detected media type:', mediaType);

    // Enhanced prompt for Opus 4 - leveraging its superior reasoning
    const analysisPrompt = `You are an expert stone fabrication analyst. Carefully examine this architectural/construction drawing and extract ALL stone countertop pieces with precise dimensions.

Use your advanced visual reasoning to:
- Identify all countertop pieces (kitchen perimeter, islands, vanities, wet bars)
- Read dimension markings accurately (look for numbers with " or ' marks)
- Understand spatial relationships and infer missing dimensions when logical
- Distinguish between different types of stone surfaces
- Account for complex layouts and overlapping elements

For each piece found, extract:
- Precise dimensions in inches (convert feet: 2' = 24", 4'-6" = 54")
- Type classification (countertop, island, vanity, backsplash)
- Edge details if visible
- Any special notes or features

Return ONLY this JSON structure:
{
  "success": true,
  "data": {
    "pieces": [
      {
        "name": "Kitchen Perimeter Counter",
        "width": 96,
        "depth": 25,
        "type": "countertop",
        "edgeDetail": "Eased",
        "notes": "L-shaped section",
        "confidence": "high"
      }
    ],
    "summary": {
      "totalPieces": 1,
      "drawingType": "kitchen",
      "confidence": "high",
      "complexLayout": false
    }
  }
}

If dimensions are unclear or missing, use your reasoning to provide best estimates and mark confidence as "medium" or "low".

If the drawing is completely unreadable, return:
{
  "success": false,
  "error": "Cannot analyze drawing",
  "suggestions": ["Upload higher resolution image", "Ensure dimension lines are visible", "Check if drawing shows stone surfaces"]
}`;

    console.log('Calling Claude Opus 4 API...');
    console.log('Using model: claude-opus-4-20250514');
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-opus-4-20250514',  // UPGRADED TO OPUS 4
        max_tokens: 4000,  // Increased for more detailed analysis
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: image
              }
            },
            {
              type: 'text',
              text: analysisPrompt
            }
          ]
        }]
      });

      console.log('Claude Opus 4 API response received successfully');
      console.log('Response ID:', response.id);
      console.log('Usage:', response.usage);

      // Parse Claude's response
      const claudeResponse = response.content[0].text;
      console.log('Claude response length:', claudeResponse.length);
      console.log('First 200 chars:', claudeResponse.substring(0, 200));
      
      // Extract JSON from Claude's response
      const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', claudeResponse);
        throw new Error('No valid JSON found in Claude response');
      }

      const extractedData = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed JSON');
      console.log('Pieces found:', extractedData.data?.pieces?.length || 0);
      
      // Enhance the response if successful
      if (extractedData.success && extractedData.data && extractedData.data.pieces) {
        extractedData.data.pieces = extractedData.data.pieces.map(piece => ({
          ...piece,
          area: piece.area || (piece.width * piece.depth / 144),
          width: Number(piece.width),
          depth: Number(piece.depth),
          edgeDetail: piece.edgeDetail || 'Eased',
          confidence: piece.confidence || 'medium',
          shape: piece.shape || 'rectangle'
        }));

        extractedData.data.extractedAt = new Date().toISOString();
        extractedData.data.aiModel = 'claude-opus-4';  // Updated model info
        extractedData.data.preprocessed = true;
      }

      console.log('Sending successful response from Opus 4');
      return res.status(200).json(extractedData);

    } catch (apiError) {
      console.error('Claude Opus 4 API call failed:', apiError);
      console.error('Error type:', apiError.constructor.name);
      console.error('Error message:', apiError.message);
      
      // Check for specific error types
      if (apiError.message?.includes('api_key')) {
        return res.status(500).json({
          success: false,
          error: 'API authentication failed',
          details: 'Invalid or missing Claude API key',
          suggestions: ['Check your Claude API key in Vercel environment variables']
        });
      }
      
      if (apiError.message?.includes('rate_limit')) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          details: 'Too many requests to Claude API',
          suggestions: ['Please wait a moment and try again']
        });
      }
      
      if (apiError.message?.includes('model')) {
        return res.status(500).json({
          success: false,
          error: 'Model not available',
          details: 'Claude Opus 4 model not accessible',
          suggestions: ['Check if your API key has access to Opus 4', 'Try again in a moment']
        });
      }
      
      throw apiError; // Re-throw to be caught by outer catch
    }

  } catch (error) {
    console.error('Handler Error:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: 'Drawing analysis failed',
      details: error.message || 'Unknown error',
      suggestions: [
        'Ensure the drawing has clear dimension lines',
        'Check if text is readable',
        'Try uploading a higher resolution image',
        'Verify the drawing shows stone fabrication details',
        'Check API configuration'
      ]
    });
  }
}
