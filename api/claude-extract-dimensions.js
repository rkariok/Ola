// api/claude-extract-dimensions.js - DEBUG VERSION
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
  console.log('=== Claude API Handler Called ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  
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

    console.log('Processing Claude extraction request...');

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

    // Simple test prompt first
    const analysisPrompt = `Analyze this construction/architectural drawing and extract all stone countertop pieces with their dimensions.

Look for:
- All countertop pieces
- Islands
- Backsplashes
- Dimension markings (numbers with " or ')
- Edge details

Return a JSON object with this structure:
{
  "success": true,
  "data": {
    "pieces": [
      {
        "name": "Main Counter",
        "width": 96,
        "depth": 25,
        "type": "countertop",
        "edgeDetail": "Eased",
        "notes": "any notes"
      }
    ],
    "summary": {
      "totalPieces": 1,
      "drawingType": "kitchen",
      "confidence": "high"
    }
  }
}

If you cannot read the drawing, return:
{
  "success": false,
  "error": "Cannot read dimensions",
  "suggestions": ["what would help"]
}`;

    console.log('Calling Claude API...');
    console.log('Using model: claude-3-5-sonnet-20241022');
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
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

      console.log('Claude API response received successfully');
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
        extractedData.data.aiModel = 'claude-3-5-sonnet';
        extractedData.data.preprocessed = true;
      }

      console.log('Sending successful response');
      return res.status(200).json(extractedData);

    } catch (apiError) {
      console.error('Claude API call failed:', apiError);
      console.error('Error type:', apiError.constructor.name);
      console.error('Error message:', apiError.message);
      console.error('Full error:', JSON.stringify(apiError, null, 2));
      
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
      
      throw apiError; // Re-throw to be caught by outer catch
    }

  } catch (error) {
    console.error('Handler Error:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: 'Analysis failed',
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
