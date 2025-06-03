// Save this as: src/utils/multiProductOptimization.js

export const optimizeMultiProductLayout = (products, stoneOptions, settings) => {
  try {
    // Group products by EXACT stone combination (type + thickness + finish)
    const productsByExactStone = {};
    
    products.forEach((product, index) => {
      if (!product.stone || !product.width || !product.depth) return;
      
      // Create a unique key that includes stone type, thickness, and finish
      const stoneKey = `${product.stone}|${product.thickness}|${product.finish}`;
      
      if (!productsByExactStone[stoneKey]) {
        productsByExactStone[stoneKey] = {
          stoneType: product.stone,
          thickness: product.thickness,
          finish: product.finish,
          pieces: []
        };
      }
      
      // Create pieces for each product
      const quantity = parseInt(product.quantity) || 1;
      for (let i = 0; i < quantity; i++) {
        productsByExactStone[stoneKey].pieces.push({
          productIndex: index,
          pieceIndex: i,
          width: parseFloat(product.width),
          depth: parseFloat(product.depth),
          customName: product.customName || `Type ${index + 1}`,
          edgeDetail: product.edgeDetail || 'Eased',
          priority: product.priority || 'normal',
          originalProduct: product
        });
      }
    });
    
    const optimizedResults = {};
    
    // Optimize each exact stone combination
    Object.entries(productsByExactStone).forEach(([stoneKey, stoneGroup]) => {
      try {
        const { stoneType, thickness, finish, pieces } = stoneGroup;
        
        // Find ANY matching stone variant in options (we'll use the first match for slab dimensions)
        const stone = stoneOptions.find(s => 
          s["Stone Type"] === stoneType &&
          s["Thickness"] === thickness &&
          s["Finish"] === finish
        );
        
        if (!stone) {
          console.warn(`Stone combination not found: ${stoneKey}`);
          // Still track this as an error so it's not optimized incorrectly
          optimizedResults[stoneType] = { 
            error: 'Exact stone type/thickness/finish combination not found in database',
            stoneType,
            thickness,
            finish
          };
          return;
        }
        
        const slabWidth = parseFloat(stone["Slab Width"]) || 126;
        const slabHeight = parseFloat(stone["Slab Height"]) || 63;
        const kerf = settings.kerfWidth || 0.125;
        
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
        
        // Store results using just the stone type as the key for backward compatibility
        optimizedResults[stoneType] = {
          slabs,
          placedPieces,
          totalSlabs: slabs.length,
          averageEfficiency: slabs.length > 0 ? 
            slabs.reduce((sum, s) => sum + s.efficiency, 0) / slabs.length : 0,
          // Include the exact combination info for reference
          thickness,
          finish,
          stoneKey
        };
      } catch (error) {
        console.error(`Error optimizing stone combination ${stoneKey}:`, error);
        optimizedResults[stoneGroup.stoneType] = { error: error.message };
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
      
      // Find the stone with matching thickness and finish from the optimization result
      const stone = stoneOptions.find(s => 
        s["Stone Type"] === stoneType &&
        s["Thickness"] === result.thickness &&
        s["Finish"] === result.finish
      );
      
      if (!stone) return;
      
      const slabCost = parseFloat(stone["Slab Cost"]) || 0;
      const fabCost = parseFloat(stone["Fab Cost"]) || 0;
      const markup = parseFloat(stone["Mark Up"]) || 1;
      
      // Calculate cost per slab including breakage buffer
      const breakageBuffer = settings.breakageBuffer || 10;
      const costPerSlab = slabCost * (1 + breakageBuffer / 100);
      
      // CRITICAL FIX: Use the actual optimized slab count
      const actualSlabsUsed = result.totalSlabs;
      const totalMaterialCost = costPerSlab * actualSlabsUsed;
      
      // Calculate total area for all pieces
      const totalPiecesArea = result.placedPieces.reduce((sum, piece) => {
        const w = piece.rotated ? piece.depth : piece.width;
        const h = piece.rotated ? piece.width : piece.depth;
        return sum + (w * h);
      }, 0);
      
      // Group pieces by original product
      const piecesByProduct = {};
      result.placedPieces.forEach(piece => {
        const key = piece.productIndex;
        if (!piecesByProduct[key]) {
          piecesByProduct[key] = {
            pieces: [],
            area: 0,
            count: 0
          };
        }
        piecesByProduct[key].pieces.push(piece);
        piecesByProduct[key].count++;
        const w = piece.rotated ? piece.depth : piece.width;
        const h = piece.rotated ? piece.width : piece.depth;
        piecesByProduct[key].area += (w * h);
      });
      
      // Calculate costs for each product based on area proportion
      Object.keys(piecesByProduct).forEach(productIndex => {
        const idx = parseInt(productIndex);
        const productData = piecesByProduct[productIndex];
        const product = optimizedProducts[idx];
        
        if (!product) return;
        
        // IMPORTANT: Only apply optimization if this product matches the exact combination
        if (product.stone !== stoneType || 
            product.thickness !== result.thickness || 
            product.finish !== result.finish) {
          console.warn(`Skipping optimization for product ${idx} - stone combination mismatch`);
          return;
        }
        
        const w = parseFloat(product.width) || 0;
        const d = parseFloat(product.depth) || 0;
        const quantity = parseInt(product.quantity) || 1;
        const area = w * d;
        const usableAreaSqft = (area / 144) * quantity;
        
        // Calculate this product's share of material cost based on area used
        const areaRatio = productData.area / totalPiecesArea;
        const materialCost = totalMaterialCost * areaRatio;
        
        const fabricationCost = settings.includeFabrication ? (usableAreaSqft * fabCost) : 0;
        const rawCost = materialCost + fabricationCost;
        const finalPrice = rawCost * markup;
        
        // Calculate effective slabs (fractional based on area used)
        const effectiveSlabs = actualSlabsUsed * areaRatio;
        
        // Calculate efficiency based on actual optimization
        const slabWidth = parseFl
