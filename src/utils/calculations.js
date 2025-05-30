// Save this as: utils/calculations.js

export const calculateMaxPiecesPerSlab = (pieceW, pieceH, slabW, slabH, includeKerf, kerfWidth) => {
  const kerf = includeKerf ? kerfWidth : 0;
  let maxPieces = 0;

  const fit1W = Math.floor((slabW + kerf) / (pieceW + kerf));
  const fit1H = Math.floor((slabH + kerf) / (pieceH + kerf));
  const option1 = fit1W * fit1H;

  const fit2W = Math.floor((slabW + kerf) / (pieceH + kerf));
  const fit2H = Math.floor((slabH + kerf) / (pieceW + kerf));
  const option2 = fit2W * fit2H;

  maxPieces = Math.max(option1, option2);

  for (let rows1 = 0; rows1 <= Math.floor((slabH + kerf) / (pieceH + kerf)); rows1++) {
    const usedHeight1 = Math.max(0, rows1 * (pieceH + kerf) - kerf);
    const remainingHeight = slabH - usedHeight1;
    
    const pieces1 = rows1 * Math.floor((slabW + kerf) / (pieceW + kerf));
    
    if (remainingHeight >= pieceW) {
      const rows2 = Math.floor((remainingHeight + kerf) / (pieceW + kerf));
      const pieces2 = rows2 * Math.floor((slabW + kerf) / (pieceH + kerf));
      maxPieces = Math.max(maxPieces, pieces1 + pieces2);
    } else {
      maxPieces = Math.max(maxPieces, pieces1);
    }
  }

  for (let rows2 = 0; rows2 <= Math.floor((slabH + kerf) / (pieceW + kerf)); rows2++) {
    const usedHeight2 = Math.max(0, rows2 * (pieceW + kerf) - kerf);
    const remainingHeight = slabH - usedHeight2;
    
    const pieces2 = rows2 * Math.floor((slabW + kerf) / (pieceH + kerf));
    
    if (remainingHeight >= pieceH) {
      const rows1 = Math.floor((remainingHeight + kerf) / (pieceH + kerf));
      const pieces1 = rows1 * Math.floor((slabW + kerf) / (pieceW + kerf));
      maxPieces = Math.max(maxPieces, pieces1 + pieces2);
    } else {
      maxPieces = Math.max(maxPieces, pieces2);
    }
  }

  return maxPieces;
};

export const calculateProductResults = (product, stoneOptions, settings) => {
  const stone = stoneOptions.find(s => s["Stone Type"] === product.stone);
  if (!stone) return { ...product, result: null };

  const slabCost = parseFloat(stone["Slab Cost"]);
  const fabCost = parseFloat(stone["Fab Cost"]);
  const markup = parseFloat(stone["Mark Up"]);
  const w = parseFloat(product.width);
  const d = parseFloat(product.depth);
  const quantity = parseInt(product.quantity);

  if (!w || !d || isNaN(slabCost) || isNaN(fabCost) || isNaN(markup)) return { ...product, result: null };

  const slabWidth = parseFloat(stone["Slab Width"]);
  const slabHeight = parseFloat(stone["Slab Height"]);

  const pieces = Array(quantity).fill().map((_, i) => ({
    id: i + 1,
    width: w,
    depth: d,
    name: `${product.stone} #${i + 1}`
  }));

  const maxPiecesPerSlab = calculateMaxPiecesPerSlab(
    w, d, slabWidth, slabHeight, 
    settings.includeKerf, settings.kerfWidth
  );
  
  const area = w * d;
  const usableAreaSqft = (area / 144) * quantity;
  const totalSlabsNeeded = Math.ceil(quantity / maxPiecesPerSlab);
  const totalSlabArea = totalSlabsNeeded * slabWidth * slabHeight;
  const totalUsedArea = pieces.reduce((sum, p) => sum + p.width * p.depth, 0);
  const efficiency = totalSlabArea > 0 ? (totalUsedArea / totalSlabArea) * 100 : 0;
  
  // Calculate costs WITHOUT markup first
  const materialCost = (slabCost * totalSlabsNeeded) * (1 + settings.breakageBuffer/100);
  const fabricationCost = settings.includeFabrication ? (usableAreaSqft * fabCost) : 0;
  
  // Raw cost is the sum of material and fabrication costs (no markup yet)
  const rawCost = materialCost + fabricationCost;
  
  // Final price applies markup to the entire raw cost
  const finalPrice = rawCost * markup;

  return {
    ...product,
    result: {
      usableAreaSqft,
      totalSlabsNeeded,
      efficiency,
      materialCost,      // This is the base material cost (no markup)
      fabricationCost,   // This is the base fabrication cost (no markup)
      rawCost,          // This is material + fabrication (no markup)
      finalPrice,       // This is the final price with markup applied to everything
      topsPerSlab: maxPiecesPerSlab
    }
  };
};
