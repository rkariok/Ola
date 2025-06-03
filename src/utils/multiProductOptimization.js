// Save this as: src/utils/multiProductOptimization.js
import { calculateProductResults } from './calculations';

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
    
    // Debug log
    console.log('Product groups by exact stone:', Object.keys(productsByExactStone));
    
    const optimizedResults = {};
    
    // Optimize each exact stone combination
    Object.entries(productsByExactStone).forEach(([stoneKey, stoneGroup]) => {
      try {
        const { stoneType, thickness, finish, pieces } = stoneGroup;
        
        // Find ANY matching stone variant in options with flexible matching
        let stone = stoneOptions.find(s => 
          s["Stone Type"] === stoneType &&
          s["Thickness"] === thickness &&
          s["Finish"] === finish
        );
        
        // If no exact match, try without finish
        if (!stone) {
          stone = stoneOptions.find(s => 
            s["Stone Type"] === stoneType &&
            s["Thickness"] === thickness
          );
          if (stone) {
            console.warn(`Using stone without exact finish match for ${stoneKey}`);
          }
        }
        
        // If still no match, try with just stone type
        if (!stone) {
          stone = stoneOptions.find(s => 
            s["Stone Type"] === stoneType
          );
          if (stone) {
            console.warn(`Using stone with only type match for ${stoneKey}`);
          }
        }
        
        if (!stone) {
          console.warn(`Stone combination not found: ${stoneKey}`);
          console.log('Looking for:', { stoneType, thickness, finish });
          console.log('Available stones:', stoneOptions.filter(s => s["Stone Type"] === stoneType));
          // Still track this as an error so it's not optimized incorrectly
          // Use a unique key for the result to avoid conflicts
          optimizedResults[stoneKey] = { 
            error: 'Exact stone type/thickness/finish combination not found in database',
            stoneType,
            thickness,
            finish
          };
          return;
        }
        
        console.log(`Found stone for ${stoneKey}:`, stone);
        
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
        
        pieces.forEach((piece, pieceIndex) => {
          let placed = false;
          
          console.log(`Trying to place piece ${pieceIndex}: ${piece.width}x${piece.depth} (${piece.customName})`);
          
          // Try to place in existing slabs
          for (let slabIndex = 0; slabIndex < slabs.length && !placed; slabIndex++) {
            const slab = slabs[slabIndex];
            const placement = findBestPlacement(piece, slab, slabWidth, slabHeight, kerf);
            
            if (placement) {
              console.log(`  Placed on slab ${slabIndex} at (${placement.x}, ${placement.y})${placement.rotated ? ' ROTATED' : ''}`);
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
            
            // Try both orientations for the first piece on new slab
            let firstPlacement = { x: 0, y: 0, rotated: false };
            
            // Check if piece needs rotation to fit
            if (piece.width > slabWidth || piece.depth > slabHeight) {
              // Try rotated
              if (piece.depth <= slabWidth && piece.width <= slabHeight) {
                firstPlacement.rotated = true;
                console.log(`  Created new slab ${newSlabIndex} with ROTATED piece (doesn't fit standard)`);
              } else {
                console.warn(`  Piece too large even with rotation!`);
              }
            } else {
              console.log(`  Created new slab ${newSlabIndex}`);
            }
            
            newSlab.pieces.push({
              ...piece,
              ...firstPlacement,
              slabIndex: newSlabIndex
            });
            
            placedPieces.push({
              ...piece,
              ...firstPlacement,
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
        
        // Store results using the unique stone key
        optimizedResults[stoneKey] = {
          slabs,
          placedPieces,
          totalSlabs: slabs.length,
          averageEfficiency: slabs.length > 0 ? 
            slabs.reduce((sum, s) => sum + s.efficiency, 0) / slabs.length : 0,
          // Include the exact combination info for reference
          stoneType,
          thickness,
          finish,
          stoneKey
        };
        
        console.log(`Optimization complete for ${stoneKey}: ${slabs.length} slabs, ${placedPieces.length} pieces`);
        
      } catch (error) {
        console.error(`Error optimizing stone combination ${stoneKey}:`, error);
        optimizedResults[stoneKey] = { 
          error: error.message,
          stoneType: stoneGroup.stoneType,
          thickness: stoneGroup.thickness,
          finish: stoneGroup.finish
        };
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
      // Bottom-right corner for better packing
      candidatePositions.push({ x: existingPiece.x + w + kerf, y: existingPiece.y + h + kerf });
    });
    
    // Remove duplicates and invalid positions
    const uniquePositions = [];
    const seen = new Set();
    
    candidatePositions.forEach(pos => {
      const key = `${pos.x},${pos.y}`;
      if (!seen.has(key) && pos.x >= 0 && pos.y >= 0) {
        seen.add(key);
        uniquePositions.push(pos);
      }
    });
    
    // Try each position with both orientations
    for (const pos of uniquePositions) {
      for (const rotated of [false, true]) {
        const w = rotated ? piece.depth : piece.width;
        const h = rotated ? piece.width : piece.depth;
        
        // Skip if piece is square and already tried non-rotated
        if (piece.width === piece.depth && rotated) continue;
        
        // Check if piece fits at this position
        if (pos.x + w <= slabWidth && pos.y + h <= slabHeight) {
          // Check for overlaps with existing pieces
          let overlaps = false;
          for (const existing of slab.pieces) {
            const ew = existing.rotated ? existing.depth : existing.width;
            const eh = existing.rotated ? existing.width : existing.depth;
            
            // Check if rectangles overlap (with kerf spacing)
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
    
    // Track which products have been optimized
    const optimizedProductIndices = new Set();
    
    // Apply optimization results - now keyed by stoneKey
    Object.entries(optimizationResults).forEach(([stoneKey, result]) => {
      if (result.error || !result.placedPieces) {
        console.log(`Skipping optimization for ${stoneKey} due to error:`, result.error);
        return;
      }
      
      // Find the stone with matching properties using flexible matching
      let stone = stoneOptions.find(s => 
        s["Stone Type"] === result.stoneType &&
        s["Thickness"] === result.thickness &&
        s["Finish"] === result.finish
      );
      
      // Fallback to less specific matches if needed
      if (!stone) {
        stone = stoneOptions.find(s => 
          s["Stone Type"] === result.stoneType &&
          s["Thickness"] === result.thickness
        );
      }
      
      if (!stone) {
        stone = stoneOptions.find(s => 
          s["Stone Type"] === result.stoneType
        );
      }
      
      if (!stone) {
        console.warn(`No stone found for optimized group: ${stoneKey}`);
        return;
      }
      
      const slabCost = parseFloat(stone["Slab Cost"]) || 0;
      const fabCost = parseFloat(stone["Fab Cost"]) || 0;
      const markup = parseFloat(stone["Mark Up"]) || 1;
      
      // Calculate cost per slab including breakage buffer
      const breakageBuffer = settings.breakageBuffer || 10;
      const costPerSlab = slabCost * (1 + breakageBuffer / 100);
      
      // Use the actual optimized slab count
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
        
        if (!product) {
          console.warn(`Product at index ${idx} not found`);
          return;
        }
        
        // Verify this product matches the optimization group
        const productKey = `${product.stone}|${product.thickness}|${product.finish}`;
        if (productKey !== stoneKey) {
          console.warn(`Product ${idx} key mismatch: ${productKey} vs ${stoneKey}`);
          return;
        }
        
        // Mark this product as optimized
        optimizedProductIndices.add(idx);
        
        const w = parseFloat(product.width) || 0;
        const d = parseFloat(product.depth) || 0;
        const quantity = parseInt(product.quantity) || 1;
        const area = w * d;
        const usableAreaSqft = (area / 144) * quantity;
        
        // Calculate this product's share of material cost based on area used
        const areaRatio = totalPiecesArea > 0 ? productData.area / totalPiecesArea : 0;
        const materialCost = totalMaterialCost * areaRatio;
        
        const fabricationCost = settings.includeFabrication ? (usableAreaSqft * fabCost) : 0;
        const installationCost = settings.includeInstallation ? (usableAreaSqft * 25) : 0;
        const rawCost = materialCost + fabricationCost + installationCost;
        const finalPrice = rawCost * markup;
        
        // Calculate effective slabs (fractional based on area used)
        const effectiveSlabs = actualSlabsUsed * areaRatio;
        
        // Calculate efficiency based on actual optimization
        const slabWidth = parseFloat(stone["Slab Width"]) || 126;
        const slabHeight = parseFloat(stone["Slab Height"]) || 63;
        const theoreticalArea = effectiveSlabs * slabWidth * slabHeight;
        const efficiency = theoreticalArea > 0 ? (productData.area / theoreticalArea) * 100 : 0;
        
        // Calculate actual pieces that can fit per slab based on optimization
        const piecesPerSlab = actualSlabsUsed > 0 ? productData.count / actualSlabsUsed : 0;
        
        optimizedProducts[idx].result = {
          usableAreaSqft,
          totalSlabsNeeded: effectiveSlabs,
          efficiency,
          materialCost,
          fabricationCost,
          installationCost,
          rawCost,
          finalPrice,
          topsPerSlab: piecesPerSlab,
          multiProductOptimized: true,
          actualTotalSlabs: actualSlabsUsed,
          areaRatio: areaRatio,
          placementDetails: productData.pieces,
          optimizationKey: stoneKey,
          slabDimensions: `${slabWidth}" × ${slabHeight}"`
        };
        
        console.log(`Product ${idx} optimized in group ${stoneKey}`);
      });
    });
    
    // FALLBACK: For any products that weren't optimized, calculate them individually
    optimizedProducts.forEach((product, index) => {
      if (!optimizedProductIndices.has(index) && !product.result) {
        // Calculate this product individually using standard calculation
        const calculatedProduct = calculateProductResults(product, stoneOptions, settings);
        optimizedProducts[index] = calculatedProduct;
        
        console.log(`Product ${index} (${product.customName || 'Type ' + (index + 1)}) calculated individually - no matching optimization group`);
      }
    });
    
    return optimizedProducts;
  } catch (error) {
    console.error('Error in applyMultiProductOptimization:', error);
    // Return products with standard calculation as fallback
    return products.map(product => calculateProductResults(product, stoneOptions, settings));
  }
};
