// Save this as: components/MultiProductSlabVisualization.jsx
import { useState, useEffect } from 'react';
import { Package } from './icons/Icons';

export const MultiProductSlabVisualization = ({ 
  slabData, 
  slabWidth, 
  slabHeight, 
  allProducts,
  settings 
}) => {
  const [isAnimating, setIsAnimating] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 1500);
    return () => clearTimeout(timer);
  }, [slabData]);
  
  if (!slabData || !slabData.pieces || slabData.pieces.length === 0) return null;

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

  // Color palette for different products
  const colors = [
    { bg: 'linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)', border: '#059669' },
    { bg: 'linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%)', border: '#1d4ed8' },
    { bg: 'linear-gradient(135deg, #fda4af 0%, #f87171 100%)', border: '#dc2626' },
    { bg: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', border: '#d97706' },
    { bg: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)', border: '#7c3aed' },
    { bg: 'linear-gradient(135deg, #5eead4 0%, #14b8a6 100%)', border: '#0f766e' },
  ];

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-center gap-2 text-sm text-gray-600">
        <Package className="w-4 h-4" />
        <span>Multi-Product Slab - {slabWidth}" × {slabHeight}"</span>
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
        {slabData.pieces.map((piece, index) => {
          const product = allProducts[piece.productIndex];
          const color = colors[piece.productIndex % colors.length];
          const width = piece.rotated ? piece.depth : piece.width;
          const height = piece.rotated ? piece.width : piece.depth;
          
          return (
            <div
              key={`${piece.productIndex}-${piece.pieceIndex}`}
              className={`absolute flex flex-col items-center justify-center text-xs font-medium rounded transition-all duration-300 ${
                isAnimating ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
              }`}
              style={{
                left: `${piece.x * scale}px`,
                top: `${piece.y * scale}px`,
                width: `${width * scale - 2}px`,
                height: `${height * scale - 2}px`,
                transitionDelay: `${index * 50}ms`,
                background: color.bg,
                border: `2px solid ${color.border}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div className="text-white font-bold text-[10px] drop-shadow-sm">
                {product?.customName || `P${piece.productIndex + 1}`}
              </div>
              <div className="text-white/90 text-[9px] drop-shadow-sm">{width}×{height}"</div>
              {piece.rotated && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] font-bold shadow-sm" style={{ color: color.border }}>
                  R
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 text-center">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Efficiency: <span className={`font-bold ${
            slabData.efficiency > 80 ? 'text-green-600' : 
            slabData.efficiency > 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>{slabData.efficiency?.toFixed(1) || '0'}%</span>
        </div>
        
        {/* Product Legend */}
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          {[...new Set(slabData.pieces.map(p => p.productIndex))].map(productIndex => {
            const product = allProducts[productIndex];
            const color = colors[productIndex % colors.length];
            const count = slabData.pieces.filter(p => p.productIndex === productIndex).length;
            
            return (
              <div key={productIndex} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ 
                    background: color.bg,
                    border: `1px solid ${color.border}`
                  }}
                ></div>
                <span className="text-gray-600">
                  {product?.customName || `Product ${productIndex + 1}`} ({count})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};