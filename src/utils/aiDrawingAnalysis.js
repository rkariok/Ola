// src/utils/aiDrawingAnalysis.js
import { preprocessImageInBrowser } from './browserImagePreprocessing';

export const analyzeDrawingWithAI = async (file) => {
  // Show loading state
  console.log('Starting AI drawing analysis...');
  
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File too large. Please use images under 10MB.');
    }
    
    // Preprocess image for better clarity
    console.log('Preprocessing image for better clarity...');
    const processedImage = await preprocessImageInBrowser(file);
    console.log('Preprocessing complete!');
    
    // Send to Claude API
    const response = await fetch('/api/claude-extract-dimensions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: processedImage
      })
    });

    const result = await response.json();
    
    if (result.success && result.data.pieces) {
      return result.data;
    } else {
      const errorMsg = result.error || "Analysis failed";
      const suggestions = result.suggestions ? "\n\nSuggestions:\n• " + result.suggestions.join("\n• ") : "";
      throw new Error(`${errorMsg}${suggestions}`);
    }
  } catch (error) {
    console.error("Claude analysis error:", error);
    throw error;
  }
};

// NEW: Text parsing function
export const parseProductText = async (text, stoneOptions) => {
  console.log('Starting AI text parsing...');
  
  try {
    // Validate input
    if (!text || !text.trim()) {
      throw new Error('No text provided');
    }
    
    if (text.length > 10000) { // 10k character limit
      throw new Error('Text too long. Please use shorter descriptions.');
    }
    
    // Send to Claude API
    const response = await fetch('/api/claude-parse-products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        availableStones: stoneOptions.map(s => s["Stone Type"])
      })
    });

    const result = await response.json();
    
    if (result.success && result.data.products) {
      console.log('Text parsing successful:', result.data);
      return result.data;
    } else {
      const errorMsg = result.error || "Text parsing failed";
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error("Claude text parsing error:", error);
    throw error;
  }
};

// Helper to find best matching combination
const findBestCombination = (stoneType, stoneOptions, requestedFinish = null, requestedThickness = null) => {
  const stoneVariants = stoneOptions.filter(s => s["Stone Type"] === stoneType);
  if (stoneVariants.length === 0) return null;
  
  // Priority order for defaults
  const thicknessOrder = ['3CM', '2CM', '4CM', '5CM', '6CM'];
  const finishOrder = ['Polished', 'Honed', 'Leathered', 'Brushed', 'Flamed'];
  const sizeOrder = ['Standard', 'Jumbo', 'Super Jumbo', 'Compact'];
  
  // If requested finish/thickness exists, prioritize it
  if (requestedFinish || requestedThickness) {
    const exactMatch = stoneVariants.find(s => 
      (!requestedFinish || s["Finish"] === requestedFinish) &&
      (!requestedThickness || s["Thickness"] === requestedThickness)
    );
    if (exactMatch) return exactMatch;
  }
  
  // Find best match based on priority
  let bestMatch = stoneVariants[0];
  
  for (const stone of stoneVariants) {
    const currentThickIdx = thicknessOrder.indexOf(bestMatch["Thickness"]);
    const newThickIdx = thicknessOrder.indexOf(stone["Thickness"]);
    const currentFinishIdx = finishOrder.indexOf(bestMatch["Finish"]);
    const newFinishIdx = finishOrder.indexOf(stone["Finish"]);
    
    if (newThickIdx !== -1 && (currentThickIdx === -1 || newThickIdx < currentThickIdx)) {
      bestMatch = stone;
    } else if (newThickIdx === currentThickIdx && newFinishIdx !== -1 && 
              (currentFinishIdx === -1 || newFinishIdx < currentFinishIdx)) {
      bestMatch = stone;
    }
  }
  
  return bestMatch;
};

export const handleClaudeMultiplePiecesExtraction = (claudeData, currentIndex, products, stoneOptions) => {
  console.log("Claude extracted data:", claudeData);
  
  const { pieces, summary } = claudeData;
  
  const groupedPieces = {};
  
  pieces.forEach(piece => {
    const key = `${piece.width}x${piece.depth}x${piece.edgeDetail}`;
    if (groupedPieces[key]) {
      groupedPieces[key].quantity += 1;
      groupedPieces[key].names.push(piece.name);
    } else {
      groupedPieces[key] = {
        width: piece.width,
        depth: piece.depth,
        quantity: 1,
        names: [piece.name],
        edgeDetail: piece.edgeDetail || 'Eased',
        type: piece.type || 'countertop',
        notes: piece.notes || '',
        // Store any finish/thickness AI might have detected
        detectedFinish: piece.finish || null,
        detectedThickness: piece.thickness || null
      };
    }
  });

  const newProducts = [];
  let productCounter = 1;

  for (let i = 0; i < currentIndex; i++) {
    newProducts.push(products[i]);
  }

  let notificationMessages = [];

  Object.keys(groupedPieces).forEach(key => {
    const group = groupedPieces[key];
    
    let productName;
    if (group.quantity > 1) {
      const baseName = group.names[0] || group.type;
      productName = `${baseName} (${group.quantity}x)`;
    } else {
      productName = group.names[0] || `${group.type} ${productCounter}`;
    }
    
    // Get the current stone type from the product being replaced
    const currentStone = products[currentIndex].stone;
    
    // Find best combination for this stone
    const bestCombination = findBestCombination(
      currentStone, 
      stoneOptions, 
      group.detectedFinish,
      group.detectedThickness
    );
    
    // If AI detected something not available, add to notifications
    if (group.detectedFinish && bestCombination?.["Finish"] !== group.detectedFinish) {
      notificationMessages.push(`${group.detectedFinish} finish not available for ${currentStone}, using ${bestCombination?.["Finish"] || 'default'}`);
    }
    
    if (group.detectedThickness && bestCombination?.["Thickness"] !== group.detectedThickness) {
      notificationMessages.push(`${group.detectedThickness} thickness not available for ${currentStone}, using ${bestCombination?.["Thickness"] || 'default'}`);
    }
    
    newProducts.push({
      stone: currentStone,
      width: group.width.toString(),
      depth: group.depth.toString(),
      quantity: group.quantity,
      edgeDetail: group.edgeDetail,
      result: null,
      id: Date.now() + productCounter,
      customName: productName,
      note: group.notes + (group.quantity > 1 ? ` | Combined ${group.quantity} identical pieces` : ''),
      aiExtracted: true,
      pieceType: group.type,
      // Use best combination values
      finish: bestCombination?.["Finish"] || '',
      thickness: bestCombination?.["Thickness"] || '',
      slabSize: bestCombination?.["Slab Size"] || '',
      aiParsed: true,
      confidence: summary?.confidence || 'medium'
    });
    productCounter++;
  });

  for (let i = currentIndex + 1; i < products.length; i++) {
    newProducts.push(products[i]);
  }

  const totalPieces = pieces.length;
  const uniqueSizes = Object.keys(groupedPieces).length;
  const confidence = summary?.confidence || 'medium';
  const drawingType = summary?.drawingType || 'unknown';
  
  let alertMessage = `🤖 Claude AI Successfully Analyzed Drawing!\n\n` +
        `📐 Drawing Type: ${drawingType.charAt(0).toUpperCase() + drawingType.slice(1)}\n` +
        `✅ Found: ${totalPieces} pieces (${uniqueSizes} unique sizes)\n` +
        `🎯 Confidence: ${confidence.charAt(0).toUpperCase() + confidence.slice(1)}\n\n` +
        `📋 Products Created:\n${Object.keys(groupedPieces).map(key => {
          const group = groupedPieces[key];
          return `• ${group.names[0]} - ${group.width}"×${group.depth}" (${group.quantity}x)`;
        }).join('\n')}`;
  
  // Add notifications about adjustments
  if (notificationMessages.length > 0) {
    alertMessage += `\n\n⚠️ Adjustments made:\n${notificationMessages.join('\n')}`;
  }

  return {
    newProducts,
    alertMessage
  };
};
