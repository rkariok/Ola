// Update this section in your ResultsView.jsx file
// Find the Results Cards section and replace it with this:

{/* Results Cards */}
<div className="space-y-4 mb-8">
  {allResults.map((p, i) => {
    const stone = stoneOptions.find(s => s["Stone Type"] === p.stone);
    const markup = parseFloat(stone?.["Mark Up"]) || 1;
    
    return (
      <Card key={i} className="p-8 hover:shadow-md transition-shadow">
        <div className="flex flex-col gap-6">
          {/* Product Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {p.customName || `Product ${i + 1}`}
              </h3>
              <p className="text-gray-600 text-sm">{p.stone}</p>
            </div>
          </div>
          
          {/* Product Details Grid - Better spacing */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Size</p>
              <p className="font-semibold text-gray-900">{p.width}×{p.depth}"</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Qty</p>
              <p className="font-semibold text-gray-900">{p.quantity}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Edge</p>
              <p className="font-semibold text-gray-900">{p.edgeDetail}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Area</p>
              <p className="font-semibold text-gray-900">{p.result?.usableAreaSqft?.toFixed(1)} ft²</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Per Slab</p>
              <p className="font-semibold text-purple-600">{p.result?.topsPerSlab || '-'}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Slabs</p>
              <p className="font-semibold text-blue-600">{p.result?.totalSlabsNeeded || '-'}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Efficiency</p>
              <p className={`font-bold ${
                (p.result?.efficiency || 0) > 80 ? 'text-green-600' : 
                (p.result?.efficiency || 0) > 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {p.result?.efficiency?.toFixed(0) || '0'}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total</p>
              <p className="font-bold text-green-600 text-xl">${p.result?.finalPrice?.toFixed(0) || '0'}</p>
            </div>
          </div>
          
          {/* Cost Breakdown - New addition */}
          <div className="flex justify-end gap-6 text-sm text-gray-600 pt-2 border-t border-gray-100">
            <span>Material: <span className="font-semibold text-blue-600">${((p.result?.materialCost || 0) * markup)?.toFixed(0)}</span></span>
            <span>Fabrication: <span className="font-semibold text-orange-600">${(p.result?.fabricationCost || 0)?.toFixed(0)}</span></span>
          </div>
        </div>
        
        {p.note && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Note:</span> {p.note}
            </p>
          </div>
        )}
      </Card>
    );
  })}
</div>
