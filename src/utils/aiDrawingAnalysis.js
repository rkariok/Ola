// Save this as: utils/aiDrawingAnalysis.js

export const analyzeDrawingWithAI = async (file) => {
  const reader = new FileReader();
  
  return new Promise((resolve, reject) => {
    reader.readAsDataURL(file);
    
    reader.onload = async () => {
      try {
        const base64Data = reader.result.split(',')[1];
        
        const response = await fetch('/api/claude-extract-dimensions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Data
          })
        });

        const result = await response.json();
        
        if (result.success && result.data.pieces) {
          resolve(result.data);
        } else {
          const errorMsg = result.error || "Analysis failed";
          const suggestions = result.suggestions ? "\n\nSuggestions:\n• " + result.suggestions.join("\n• ") : "";
          reject(new Error(`${errorMsg}${suggestions}`));
        }
      } catch (error) {
        console.error("Claude analysis error:", error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
  });
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
        notes: piece.notes || ''
      };
    }
  });

  const newProducts = [];
  let productCounter = 1;

  for (let i = 0; i < currentIndex; i++) {
    newProducts.push(products[i]);
  }

  Object.keys(groupedPieces).forEach(key => {
    const group = groupedPieces[key];
    
    let productName;
    if (group.quantity > 1) {
      const baseName = group.names[0] || group.type;
      productName = `${baseName} (${group.quantity}x)`;
    } else {
      productName = group.names[0] || `${group.type} ${productCounter}`;
    }
    
    newProducts.push({
      stone: products[currentIndex].stone,
      width: group.width.toString(),
      depth: group.depth.toString(),
      quantity: group.quantity,
      edgeDetail: group.edgeDetail,
      result: null,
      id: Date.now() + productCounter,
      customName: productName,
      priority: group.type === 'island' ? 'high' : 'normal',
      note: group.notes + (group.quantity > 1 ? ` | Combined ${group.quantity} identical pieces` : ''),
      aiExtracted: true,
      pieceType: group.type
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
  
  const alertMessage = `🤖 Claude AI Successfully Analyzed Drawing!\n\n` +
        `📐 Drawing Type: ${drawingType.charAt(0).toUpperCase() + drawingType.slice(1)}\n` +
        `✅ Found: ${totalPieces} pieces (${uniqueSizes} unique sizes)\n` +
        `🎯 Confidence: ${confidence.charAt(0).toUpperCase() + confidence.slice(1)}\n\n` +
        `📋 Products Created:\n${Object.keys(groupedPieces).map(key => {
          const group = groupedPieces[key];
          return `• ${group.names[0]} - ${group.width}"×${group.depth}" (${group.quantity}x)`;
        }).join('\n')}`;

  return {
    newProducts,
    alertMessage
  };
};