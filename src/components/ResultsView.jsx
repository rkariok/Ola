// Save this as: src/components/ResultsView.jsx
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { 
  Sparkles, DollarSign, Package, TrendingUp, BarChart3, 
  Info, CheckCircle, FileText, Mail 
} from './icons/Icons';
import { SlabLayoutVisualization } from './SlabLayoutVisualization';
import { MultiProductSlabVisualization } from './MultiProductSlabVisualization';
import { optimizeMultiProductLayout } from '../utils/multiProductOptimization';
import { generateQuotePDF } from '../utils/pdfGenerator';
import { sendQuoteEmail } from '../utils/emailService';

export const ResultsView = ({ 
  allResults, 
  optimizationData,
  stoneOptions, 
  userInfo, 
  settings,
  onBack, 
  onGeneratePDF, 
  onSendEmail,
  sendingEmail,
  emailStatus 
}) => {
  // Calculate totals based on optimization mode
  let totalPrice, totalSlabs, avgEfficiency;
  
  if (settings.multiProductOptimization && optimizationData) {
    // For multi-product optimization, use the actual optimized values
    totalSlabs = Object.values(optimizationData).reduce((sum, result) => {
      return sum + (result.totalSlabs || 0);
    }, 0);
    
    // Calculate total price based on optimized slabs
    totalPrice = 0;
    Object.entries(optimizationData).forEach(([stoneType, result]) => {
      if (result.error || !result.totalSlabs) return;
      
      const stone = stoneOptions.find(s => s["Stone Type"] === stoneType);
      if (!stone) return;
      
      const slabCost = parseFloat(stone["Slab Cost"]) || 0;
      const markup = parseFloat(stone["Mark Up"]) || 1;
      const breakageBuffer = settings.breakageBuffer || 10;
      
      // Material cost for optimized slabs
      const materialCost = slabCost * result.totalSlabs * (1 + breakageBuffer / 100) * markup;
      
      // Add fabrication costs from all products
      const fabricationCost = allResults
        .filter(p => p.stone === stoneType && p.result)
        .reduce((sum, p) => sum + (p.result.fabricationCost || 0), 0);
      
      totalPrice += materialCost + fabricationCost;
    });
    
    totalPrice = totalPrice.toFixed(2);
    
    // Calculate average efficiency from optimization
    const allEfficiencies = Object.values(optimizationData)
      .filter(r => r.averageEfficiency)
      .map(r => r.averageEfficiency);
    
    avgEfficiency = allEfficiencies.length > 0 
      ? (allEfficiencies.reduce((sum, e) => sum + e, 0) / allEfficiencies.length).toFixed(1)
      : '0';
  } else {
    // Standard calculation (existing code)
    totalPrice = allResults.reduce((sum, p) => sum + (p.result?.finalPrice || 0), 0).toFixed(2);
    totalSlabs = allResults.reduce((sum, p) => sum + (p.result?.totalSlabsNeeded || 0), 0);
    avgEfficiency = allResults.length > 0 ? 
      (allResults.reduce((sum, p) => sum + (p.result?.efficiency || 0), 0) / allResults.length).toFixed(1) : '0';
  }

  // PDF and Email handlers
  const handleGeneratePDF = () => {
    generateQuotePDF(allResults, userInfo, stoneOptions, settings, optimizationData);
  };

  const handleSendEmail = async () => {
    if (onSendEmail) {
      await onSendEmail();
    } else {
      await sendQuoteEmail(userInfo, allResults, stoneOptions);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/AIC.jpg" alt="AIC Logo" className="w-12 h-12 rounded-xl shadow-sm" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                  AIC Surfaces
                </h1>
                <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">Premium Stone Fabrication</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Results Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6"
        >
          ← Back to Products
        </Button>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-teal-600" />
          Optimized Results
        </h2>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center bg-gradient-to-br from-teal-50 to-white border-teal-200">
            <DollarSign className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-teal-700">${totalPrice}</div>
            <div className="text-sm text-teal-600 font-medium mt-1">Total Investment</div>
          </Card>
          <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-700">{totalSlabs}</div>
            <div className="text-sm text-blue-600 font-medium mt-1">Total Slabs Needed</div>
          </Card>
          <Card className="p-6 text-center bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
            <TrendingUp className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-emerald-700">{avgEfficiency}%</div>
            <div className="text-sm text-emerald-600 font-medium mt-1">Average Efficiency</div>
          </Card>
        </div>

        {/* Multi-Product Optimization Visualization */}
        {settings.multiProductOptimization && settings.showVisualLayouts && (
          <div className="mb-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Multi-Product Optimization Results
              </h3>
              
              {(() => {
                // Use the passed optimization data instead of recalculating
                const optimizationResults = optimizationData || optimizeMultiProductLayout(
                  allResults.filter(r => r.result), 
                  stoneOptions, 
                  settings
                );
                
                return Object.entries(optimizationResults).map(([stoneType, result]) => {
                  if (result.error || !result.slabs || result.slabs.length === 0) return null;
                  
                  const stone = stoneOptions.find(s => s["Stone Type"] === stoneType);
                  if (!stone) return null;
                  
                  const slabWidth = parseFloat(stone["Slab Width"]);
                  const slabHeight = parseFloat(stone["Slab Height"]);
                  
                  return (
                    <div key={stoneType} className="mb-6">
                      <h4 className="text-md font-medium text-gray-700 mb-4">
                        {stoneType} - {result.slabs.length} slab{result.slabs.length !== 1 ? 's' : ''}
                      </h4>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {result.slabs.map((slab, slabIndex) => (
                          <div key={slabIndex} className="bg-gray-50 rounded-xl p-6">
                            <h5 className="text-sm font-medium text-gray-600 mb-4 text-center">
                              Slab #{slabIndex + 1}
                            </h5>
                            <MultiProductSlabVisualization
                              slabData={slab}
                              slabWidth={slabWidth}
                              slabHeight={slabHeight}
                              allProducts={allResults}
                              settings={settings}
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-800">
                          <span className="font-semibold">Optimization Summary:</span> Combined {result.placedPieces.length} pieces 
                          across {result.slabs.length} slab{result.slabs.length !== 1 ? 's' : ''} with an average efficiency 
                          of <span className="font-bold">{result.averageEfficiency.toFixed(1)}%</span>
                        </p>
                      </div>
                    </div>
                  );
                });
              })()}
            </Card>
          </div>
        )}

        {/* Slab Layout Visualization - Only show when NOT using multi-product optimization */}
        {settings.showVisualLayouts && !settings.multiProductOptimization && (
          <div className="space-y-6 mb-8">
            {allResults.map((product, productIndex) => {
              if (!product.result) return null;
              
              const stone = stoneOptions.find(s => s["Stone Type"] === product.stone);
              const slabWidth = parseFloat(stone?.["Slab Width"]) || 126;
              const slabHeight = parseFloat(stone?.["Slab Height"]) || 63;
              
              const pieces = Array(parseInt(product.quantity) || 1).fill().map((_, i) => ({
                id: i + 1,
                width: parseFloat(product.width) || 0,
                depth: parseFloat(product.depth) || 0,
                name: `${product.stone} #${i + 1}`
              }));
              
              return (
                <Card key={productIndex} className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-teal-600" />
                    Layout Visualization: {product.customName || `Product ${productIndex + 1}`}
                  </h3>
                  
                  <div className="bg-gray-50 rounded-xl p-8">
                    <SlabLayoutVisualization 
                      pieces={pieces}
                      slabWidth={slabWidth}
                      slabHeight={slabHeight}
                      maxPiecesPerSlab={product.result.topsPerSlab}
                      includeKerf={settings.includeKerf}
                      kerfWidth={settings.kerfWidth}
                      showMaxLayout={false}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Layout Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Piece Size:</span>
                          <span className="font-medium">{product.width}" × {product.depth}"</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Slab Size:</span>
                          <span className="font-medium">{slabWidth}" × {slabHeight}"</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kerf Width:</span>
                          <span className="font-medium">{settings.includeKerf ? `${settings.kerfWidth}"` : 'Not included'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-teal-50 to-white rounded-lg p-4 border border-teal-200">
                      <h4 className="text-sm font-semibold text-teal-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Optimization Results
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-teal-600">Max Pieces/Slab:</span>
                          <span className="font-bold text-teal-700">{product.result.topsPerSlab}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-teal-600">Total Quantity:</span>
                          <span className="font-bold text-teal-700">{product.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-teal-600">Efficiency:</span>
                          <span className={`font-bold ${
                            product.result.efficiency > 80 ? 'text-green-600' : 
                            product.result.efficiency > 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>{product.result.efficiency?.toFixed(1) || '0'}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-teal-600">Slabs Needed:</span>
                          <span className="font-bold text-teal-700">{product.result.totalSlabsNeeded}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Results Cards - WITH IMPROVED SPACING */}
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
                      <p className="font-semibold text-blue-600">{p.result?.totalSlabsNeeded?.toFixed(1) || '-'}</p>
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
                    {p.result?.multiProductOptimized && (
                      <span className="text-purple-600 font-medium">✨ Optimized</span>
                    )}
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

        {/* Total Summary */}
        <Card className="p-6 bg-gradient-to-r from-teal-600 to-teal-700 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-teal-100 text-sm uppercase tracking-wider">Grand Total</p>
              <p className="text-4xl font-bold">${totalPrice}</p>
            </div>
            <div className="text-right">
              <p className="text-teal-100 text-sm">
                {settings.multiProductOptimization && optimizationData ? (
                  <>Optimized pricing for {totalSlabs} slab{totalSlabs !== 1 ? 's' : ''}</>
                ) : (
                  <>
                    Material: ${allResults.reduce((sum, p) => {
                      const stone = stoneOptions.find(s => s["Stone Type"] === p.stone);
                      const markup = parseFloat(stone?.["Mark Up"]) || 1;
                      return sum + ((p.result?.materialCost || 0) * markup);
                    }, 0).toFixed(0)} • 
                    Fabrication: ${allResults.reduce((sum, p) => sum + (p.result?.fabricationCost || 0), 0).toFixed(0)}
                  </>
                )}
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Button
            onClick={handleGeneratePDF}
            size="lg"
            variant="outline"
          >
            <FileText className="w-5 h-5" />
            Generate PDF
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={sendingEmail || !userInfo.email}
            size="lg"
            variant="outline"
          >
            <Mail className="w-5 h-5" />
            {sendingEmail ? 'Sending...' : 'Email Quote'}
          </Button>
          <Button
            onClick={onBack}
            size="lg"
          >
            Back to Edit
          </Button>
        </div>

        {/* Email status message */}
        {emailStatus && (
          <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg text-center font-medium shadow-lg animate-pulse ${
            emailStatus.includes('✅') ? 'bg-green-100 text-green-800 border border-green-300' : 
            emailStatus.includes('❌') ? 'bg-red-100 text-red-800 border border-red-300' : 
            'bg-blue-100 text-blue-800 border border-blue-300'
          }`}>
            {emailStatus}
          </div>
        )}

        {/* Trust Markers */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Licensed & Insured
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              20+ Years Experience
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              AI-Optimized Layouts
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Accurate as of {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
