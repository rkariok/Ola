// Save this as: components/SlabLayoutVisualization.jsx
import { useState, useEffect } from 'react';
import { Package } from '../icons/Icons';

export const SlabLayoutVisualization = ({ pieces, slabWidth, slabHeight, maxPiecesPerSlab, includeKerf, kerfWidth, showMaxLayout = false }) => {
  const [isAnimating, setIsAnimating] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 1500);
    return () => clearTimeout(timer);
  }, [pieces]);
  
  if (!pieces || pieces.length === 0) return null;

  const pieceWidth = pieces[0]?.width || 0;
  const pieceHeight = pieces[0]?.depth || 0;
  const kerf = includeKerf ? kerfWidth : 0;

  const generateOptimalLayout = () => {
    const layout = [];
    const targetPieces = showMaxLayout ? maxPiecesPerSlab : Math.min(pieces.length, maxPiecesPerSlab);
    
    const verticalCols = Math.floor((slabWidth + kerf) / (pieceWidth + kerf));
    const verticalRows = Math.floor((slabHeight + kerf) / (pieceHeight + kerf));
    const verticalTotal = verticalCols * verticalRows;
    
    const horizontalCols = Math.floor((slabWidth + kerf) / (pieceHeight + kerf));
    const horizontalRows = Math.floor((slabHeight + kerf) / (pieceWidth + kerf));
    const horizontalTotal = horizontalCols * horizontalRows;
    
    if (verticalTotal >= targetPieces) {
      for (let row = 0; row < verticalRows && layout.length < targetPieces; row++) {
        for (let col = 0; col < verticalCols && layout.length < targetPieces; col++) {
          layout.push({
            x: col * (pieceWidth + kerf),
            y: row * (pieceHeight + kerf),
            width: pieceWidth,
            height: pieceHeight,
            orientation: 'vertical',
            id: layout.length + 1
          });
        }
      }
    } else if (horizontalTotal >= targetPieces) {
      for (let row = 0; row < horizontalRows && layout.length < targetPieces; row++) {
        for (let col = 0; col < horizontalCols && layout.length < targetPieces; col++) {
          layout.push({
            x: col * (pieceHeight + kerf),
            y: row * (pieceWidth + kerf),
            width: pieceHeight,
            height: pieceWidth,
            orientation: 'horizontal',
            id: layout.length + 1
          });
        }
      }
    } else {
      const vRow = Math.floor((slabHeight + kerf) / (pieceHeight + kerf));
      const vCols = Math.floor((slabWidth + kerf) / (pieceWidth + kerf));
      
      if (vRow > 0) {
        for (let col = 0; col < vCols && layout.length < targetPieces; col++) {
          layout.push({
            x: col * (pieceWidth + kerf),
            y: 0,
            width: pieceWidth,
            height: pieceHeight,
            orientation: 'vertical',
            id: layout.length + 1
          });
        }
        
        const usedHeight = pieceHeight + kerf;
        const remainingHeight = slabHeight - usedHeight;
        
        if (remainingHeight >= pieceWidth - kerf) {
          const hRows = Math.floor((remainingHeight + kerf) / (pieceWidth + kerf));
          const hCols = Math.floor((slabWidth + kerf) / (pieceHeight + kerf));
          
          for (let row = 0; row < hRows && layout.length < targetPieces; row++) {
            for (let col = 0; col < hCols && layout.length < targetPieces; col++) {
              layout.push({
                x: col * (pieceHeight + kerf),
                y: usedHeight + row * (pieceWidth + kerf),
                width: pieceHeight,
                height: pieceWidth,
                orientation: 'horizontal',
                id: layout.length + 1
              });
            }
          }
        }
      }
    }
    
    return layout;
  };

  const layoutPieces = generateOptimalLayout();
  
  const containerWidth = 500;
  const containerHeight = 300;
  const scaleX = containerWidth / slabWidth;
  const scaleY = containerHeight / slabHeight;
  const scale = Math.min(scaleX, scaleY) * 0.85;

  const scaledSlabWidth = slabWidth * scale;
  const scaledSlabHeight = slabHeight * scale;

  // Generate grid lines
  const gridLines = [];
  const gridSpacing = 12; // inches
  for (let x = gridSpacing; x < slabWidth; x += gridSpacing) {
    gridLines.push({ x1: x * scale, y1: 0, x2: x * scale, y2: scaledSlabHeight });
  }
  for (let y = gridSpacing; y < slabHeight; y += gridSpacing) {
    gridLines.push({ x1: 0, y1: y * scale, x2: scaledSlabWidth, y2: y * scale });
  }

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-center gap-2 text-sm text-gray-600">
        <Package className="w-4 h-4" />
        <span>Slab Dimensions: {slabWidth}" × {slabHeight}"</span>
      </div>
      
      <div 
        className="relative mx-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-inner overflow-hidden"
        style={{ 
          width: `${scaledSlabWidth}px`, 
          height: `${scaledSlabHeight}px`
        }}
      >
        {/* Grid Background */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
          {gridLines.map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray="2,4"
            />
          ))}
        </svg>
        
        {/* Slab Border */}
        <div className="absolute inset-0 border-2 border-slate-400 rounded-lg pointer-events-none" />
        
        {/* Pieces */}
        {layoutPieces.map((piece, index) => (
          <div
            key={piece.id}
            className={`absolute flex flex-col items-center justify-center text-xs font-medium rounded transition-all duration-300 ${
              isAnimating ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
            }`}
            style={{
              left: `${piece.x * scale}px`,
              top: `${piece.y * scale}px`,
              width: `${piece.width * scale - 2}px`,
              height: `${piece.height * scale - 2}px`,
              transitionDelay: `${index * 50}ms`,
              background: 'linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)',
              border: '2px solid #059669',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div className="text-white font-bold text-sm">{piece.id}</div>
            <div className="text-emerald-100 text-[10px]">{piece.width}×{piece.height}"</div>
            {piece.orientation === 'horizontal' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white">
                R
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gradient-to-br from-emerald-300 to-emerald-500 rounded border border-emerald-600"></div>
          <span>Standard Orientation</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gradient-to-br from-emerald-300 to-emerald-500 rounded border border-emerald-600 relative">
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
          <span>Rotated 90°</span>
        </div>
      </div>
      
      <div className="mt-2 text-center text-sm text-gray-600">
        {pieces.length < maxPiecesPerSlab ? 
          `Showing ${layoutPieces.length} of ${pieces.length} pieces (max ${maxPiecesPerSlab} per slab)` :
          `Showing ${layoutPieces.length} pieces (maximum capacity)`
        }
      </div>
    </div>
  );
};