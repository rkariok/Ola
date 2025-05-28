// Save this as: src/utils/multiProductOptimization.js

export const optimizeMultiProductLayout = (products, stoneOptions, settings) => {
  try {
    // Group products by stone type
    const productsByStone = {};
    
    products.forEach((product, index) => {
      if (!product.stone || !product.width || !product.depth) return;
      
      if (!productsByStone[product.stone]) {
        productsByStone[product.stone] = [];
      }
      
      // Create pieces for each product
      const quantity = parseInt(product.quantity) || 1;
      for (let i = 0; i < quantity; i++) {
        productsByStone[product.stone].push({
          productIndex: index,
          pieceIndex: i,
          width: parseFloat(product.width),
          depth: parseFloat(product.depth),
          customName: product.customName || `Product ${index + 1}`,
          edgeDetail: product.edgeDetail || 'Eased',
          priority: product.priority || 'normal',
          originalProduct: product
        });
      }
    });
    
    const optimizedResults = {};
    
    // Optimize each stone type
    Object.keys(productsByStone).forEach(stoneType => {
      try {
        const pieces = productsByStone[stoneType];
        const stone = stoneOptions.find(s => s["Stone Type"] === stoneType);
        
        if (!stone) {
          optimizedResults[stoneType] = { error: 'Stone type not found' };
          return;
        }
        
        const slabWidth = parseFloat(stone["Slab Width"]) || 126;
        const slabHeight = parseFloat(stone["Slab Height"]) || 63;
        const kerf = settings.includeKerf ? (settings.kerfWidth || 0.125) : 0;
        
        // Sort pieces by priority and size (largest first)
        pieces.sort((a, b) => {
          // First sort by priority
          const priorityOrder = { high: 0, normal: 1, low: 2 };
          const priorityDiff = (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then by area (largest first)
          return (b.width * b.depth) - (a.width * a.depth);
        });
        
        // Pack pieces into slabs using Next Fit Decreasing algorithm with rotation
        const slabs = [];
        const placedPieces = [];
        
        pieces.forEach(piece => {
          let placed = false;
          
          // Try to place in existing slabs
          for (let slabIndex = 0; slabIndex < slabs.length && !placed; slabIndex++) {
            const slab = slabs[slabIndex];
            const placement = findBestPlacement(piece, slab, slabWidth, slabHeight, kerf);
            
            if (placement) {
              slab.pieces.push({
                ...piece,
                ...placement,
                slabIndex
              });
              placedPieces.push({
                ...piece,
                ...placement,
                slabIndex
              });
              placed = true;
            }
          }
          
          // If not placed, create new slab
          if (!placed) {
            const newSlabIndex = slabs.length;
            const newSlab = {
              pieces: [],
              width: slabWidth,
              height: slabHeight
            };
            
            // Place piece in corner of new slab
            newSlab.pieces.push({
              ...piece,
              x: 0,
              y: 0,
              rotated: false,
              slabIndex: newSlabIndex
            });
            
            placedPieces.push({
              ...piece,
              x: 0,
              y: 0,
              rotated: false,
              slabIndex: newSlabIndex
            });
            
            slabs.push(newSlab);
          }
        });
        
        // Calculate efficiency for each slab
        slabs.forEach(slab => {
          const usedArea = slab.pieces.reduce((sum, piece) => {
            const w = piece.rotated ? piece.depth : piece.width;
            const h = piece.rotated ? piece.width : piece.depth;
            return sum + (w * h);
          }, 0);
          
          slab.efficiency = (usedArea / (slabWidth * slabHeight)) * 100;
        });
        
        optimizedResults[stoneType] = {
          slabs,
          placedPieces,
          totalSlabs: slabs.length,
          averageEfficiency: slabs.length > 0 ? 
            slabs.reduce((sum, s) => sum + s.efficiency, 0) / slabs.length : 0
        };
      } catch (error) {
        console.error(`Error optimizing stone type ${stoneType}:`, error);
        optimizedResults[stoneType] = { error: error.message };
      }
    });
    
    return optimizedResults;
  } catch (error) {
    console.error('Error in optimizeMultiProductLayout:', error);
    return {};
  }
};

// Helper function to find best placement for a piece in a slab
function findBestPlacement(piece, slab, slabWidth, slabHeight, kerf) {
  try {
    const positions = [];
    
    // Generate candidate positions
    const candidatePositions = [
      { x: 0, y: 0 }, // Top-left corner
    ];
    
    // Add positions next to existing pieces
    slab.pieces.forEach(existingPiece => {
      const w = existingPiece.rotated ? existingPiece.depth : existingPiece.width;
      const h = existingPiece.rotated ? existingPiece.width : existingPiece.depth;
      
      // Right of existing piece
      candidatePositions.push({ x: existingPiece.x + w + kerf, y: existingPiece.y });
      // Below existing piece
      candidatePositions.push({ x: existingPiece.x, y: existingPiece.y + h + kerf });
    });
    
    // Try each position with both orientations
    for (const pos of candidatePositions) {
      for (const rotated of [false, true]) {
        const w = rotated ? piece.depth : piece.width;
        const h = rotated ? piece.width : piece.depth;
        
        // Check if piece fits at this position
        if (pos.x + w <= slabWidth && pos.y + h <= slabHeight) {
          // Check for overlaps
          let overlaps = false;
          for (const existing of slab.pieces) {
            const ew = existing.rotated ? existing.depth : existing.width;
            const eh = existing.rotated ? existing.width : existing.depth;
            
            if (!(pos.x + w + kerf <= existing.x || 
                  pos.x >= existing.x + ew + kerf ||
                  pos.y + h + kerf <= existing.y || 
                  pos.y >= existing.y + eh + kerf)) {
              overlaps = true;
              break;
            }
          }
          
          if (!overlaps) {
            positions.push({
              x: pos.x,
              y: pos.y,
              rotated,
              waste: calculateWaste(pos.x, pos.y, w, h, slabWidth, slabHeight)
            });
          }
        }
      }
    }
    
    // Return position with least waste
    if (positions.length > 0) {
      positions.sort((a, b) => a.waste - b.waste);
      const best = positions[0];
      return {
        x: best.x,
        y: best.y,
        rotated: best.rotated
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error in findBestPlacement:', error);
    return null;
  }
}

// Calculate waste score for a position
function calculateWaste(x, y, w, h, slabWidth, slabHeight) {
  // Lower score is better
  // Prefer positions that use space efficiently
  const rightSpace = slabWidth - (x + w);
  const bottomSpace = slabHeight - (y + h);
  
  // Penalize positions that create small unusable spaces
  let waste = 0;
  if (rightSpace > 0 && rightSpace < 12) waste += 100; // Too small for most pieces
  if (bottomSpace > 0 && bottomSpace < 12) waste += 100;
  
  // Prefer positions closer to origin
  waste += x + y;
  
  return waste;
}

// Apply multi-product optimization results to products
export const applyMultiProductOptimization = (products, optimizationResults, stoneOptions, settings) => {
  try {
    const optimizedProducts = products.map(product => ({ ...product }));
    
    // Reset all results first
    optimizedProducts.forEach(product => {
      product.result = null;
    });
    
    // Apply optimization results
    Object.keys(optimizationResults).forEach(stoneType => {
      const result = optimizationResults[stoneType];
      if (result.error || !result.placedPieces) return;
      
      const stone = stoneOptions.find(s => s["Stone Type"] === stoneType);
      if (!stone) return;
      
      const slabCost = parseFloat(stone["Slab Cost"]) || 0;
      const fabCost = parseFloat(stone["Fab Cost"]) || 0;
      const markup = parseFloat(stone["Mark Up"]) || 1;
      
      // Calculate cost per slab including breakage buffer
      const breakageBuffer = settings.breakageBuffer || 10;
      const costPerSlab = slabCost * (1 + breakageBuffer / 100);
      
      // Group pieces by original product
      const piecesByProduct = {};
      result.placedPieces.forEach(piece => {
        const key = piece.productIndex;
        if (!piecesByProduct[key]) {
          piecesByProduct[key] = {
            pieces: [],
            slabsUsed: new Set()
          };
        }
        piecesByProduct[key].pieces.push(piece);
        piecesByProduct[key].slabsUsed.add(piece.slabIndex);
      });
      
      // Calculate costs for each product
      Object.keys(piecesByProduct).forEach(productIndex => {
        const idx = parseInt(productIndex);
        const productData = piecesByProduct[productIndex];
        const product = optimizedProducts[idx];
        
        if (!product) return;
        
        const w = parseFloat(product.width) || 0;
        const d = parseFloat(product.depth) || 0;
        const quantity = parseInt(product.quantity) || 1;
        const area = w * d;
        const usableAreaSqft = (area / 144) * quantity;
        
        // Calculate shared slab costs
        let materialCost = 0;
        productData.slabsUsed.forEach(slabIndex => {
          const slab = result.slabs[slabIndex];
          if (!slab) return;
          
          const totalPiecesInSlab = slab.pieces.length;
          const productPiecesInSlab = slab.pieces.filter(p => p.productIndex === idx).length;
          
          // Proportional cost based on area used
          const productAreaInSlab = productPiecesInSlab * w * d;
          const totalAreaInSlab = slab.pieces.reduce((sum, p) => {
            const pw = p.rotated ? p.depth : p.width;
            const ph = p.rotated ? p.width : p.depth;
            return sum + pw * ph;
          }, 0);
          
          const proportion = totalAreaInSlab > 0 ? productAreaInSlab / totalAreaInSlab : 0;
          materialCost += costPerSlab * proportion;
        });
        
        const fabricationCost = usableAreaSqft * fabCost;
        const rawCost = materialCost + fabricationCost;
        const finalPrice = rawCost * markup;
        
        // Calculate effective efficiency
        const effectiveSlabs = costPerSlab > 0 ? materialCost / costPerSlab : 0;
        const slabWidth = parseFloat(stone["Slab Width"]) || 126;
        const slabHeight = parseFloat(stone["Slab Height"]) || 63;
        const theoreticalArea = effectiveSlabs * slabWidth * slabHeight;
        const efficiency = theoreticalArea > 0 ? (productData.pieces.length * w * d / theoreticalArea) * 100 : 0;
        
        optimizedProducts[idx].result = {
          usableAreaSqft,
          totalSlabsNeeded: effectiveSlabs,
          efficiency,
          materialCost,
          fabricationCost,
          rawCost,
          finalPrice,
          topsPerSlab: productData.slabsUsed.size > 0 ? 
            Math.floor(productData.pieces.length / productData.slabsUsed.size) : 0,
          multiProductOptimized: true,
          sharedSlabs: Array.from(productData.slabsUsed),
          placementDetails: productData.pieces
        };
      });
    });
    
    return optimizedProducts;
  } catch (error) {
    console.error('Error in applyMultiProductOptimization:', error);
    // Return original products with standard calculation as fallback
    return products;
  }
};
