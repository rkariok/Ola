// Save this as: components/ProductCard.jsx
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { X, Upload } from './icons/Icons';
import { useEffect, useState } from 'react';

export const ProductCard = ({ 
  product, 
  index, 
  stoneOptions, 
  onUpdate, 
  onRemove, 
  onUpload, 
  loadingAI,
  canRemove = true 
}) => {
  const [notification, setNotification] = useState('');

  const updateField = (field, value) => {
    onUpdate(index, field, value);
  };

  // Get unique stone types
  const getUniqueStoneTypes = () => {
    const types = new Set();
    stoneOptions.forEach(stone => {
      if (stone["Stone Type"]) {
        types.add(stone["Stone Type"]);
      }
    });
    return Array.from(types).sort();
  };

  // Get available options for a specific stone type
  const getOptionsForStone = (stoneType, field) => {
    if (!stoneType) return [];
    
    const options = new Set();
    stoneOptions
      .filter(stone => stone["Stone Type"] === stoneType)
      .forEach(stone => {
        if (stone[field]) {
          options.add(stone[field]);
        }
      });
    
    return Array.from(options).sort();
  };

  // Check if a combination exists
  const combinationExists = (stoneType, slabSize, thickness, finish) => {
    return stoneOptions.some(stone => 
      stone["Stone Type"] === stoneType &&
      stone["Slab Size"] === slabSize &&
      stone["Thickness"] === thickness &&
      stone["Finish"] === finish
    );
  };

  // Get most common combination for a stone
  const getMostCommonCombination = (stoneType) => {
    const stoneVariants = stoneOptions.filter(s => s["Stone Type"] === stoneType);
    if (stoneVariants.length === 0) return null;
    
    // Priority order for defaults
    const thicknessOrder = ['3CM', '2CM', '4CM', '5CM', '6CM'];
    const finishOrder = ['Polished', 'Honed', 'Leathered', 'Brushed', 'Flamed'];
    const sizeOrder = ['Standard', 'Jumbo', 'Super Jumbo', 'Compact'];
    
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

  // Smart auto-selection when stone changes
  const handleStoneChange = (newStone) => {
    updateField('stone', newStone);
    
    if (!newStone) return;
    
    // Get available options for new stone
    const availableSizes = getOptionsForStone(newStone, 'Slab Size');
    const availableThicknesses = getOptionsForStone(newStone, 'Thickness');
    const availableFinishes = getOptionsForStone(newStone, 'Finish');
    
    let updates = {};
    let notifications = [];
    
    // Auto-select if only one option
    if (availableSizes.length === 1) {
      updates.slabSize = availableSizes[0];
      notifications.push(`Slab Size auto-selected: ${availableSizes[0]}`);
    } else if (!availableSizes.includes(product.slabSize)) {
      // Current selection not available, use smart default
      const common = getMostCommonCombination(newStone);
      updates.slabSize = common?.["Slab Size"] || availableSizes[0];
    }
    
    if (availableThicknesses.length === 1) {
      updates.thickness = availableThicknesses[0];
      notifications.push(`Thickness auto-selected: ${availableThicknesses[0]}`);
    } else if (!availableThicknesses.includes(product.thickness)) {
      const common = getMostCommonCombination(newStone);
      updates.thickness = common?.["Thickness"] || availableThicknesses[0];
    }
    
    if (availableFinishes.length === 1) {
      updates.finish = availableFinishes[0];
      notifications.push(`Finish auto-selected: ${availableFinishes[0]}`);
    } else if (!availableFinishes.includes(product.finish)) {
      const common = getMostCommonCombination(newStone);
      updates.finish = common?.["Finish"] || availableFinishes[0];
    }
    
    // Apply all updates at once
    Object.keys(updates).forEach(field => {
      updateField(field, updates[field]);
    });
    
    // Show notification if any auto-selection happened
    if (notifications.length > 0) {
      setNotification(notifications.join(', '));
      setTimeout(() => setNotification(''), 3000);
    }
  };

  // Get current available options
  const slabSizeOptions = product.stone ? getOptionsForStone(product.stone, 'Slab Size') : [];
  const thicknessOptions = product.stone ? getOptionsForStone(product.stone, 'Thickness') : [];
  const finishOptions = product.stone ? getOptionsForStone(product.stone, 'Finish') : [];

  // For AI-parsed products, ensure valid combination
  useEffect(() => {
    if (product.aiParsed && product.stone) {
      const exists = combinationExists(
        product.stone,
        product.slabSize,
        product.thickness,
        product.finish
      );
      
      if (!exists) {
        const common = getMostCommonCombination(product.stone);
        if (common) {
          updateField('slabSize', common["Slab Size"]);
          updateField('thickness', common["Thickness"]);
          updateField('finish', common["Finish"]);
          setNotification('AI selection adjusted to available options');
          setTimeout(() => setNotification(''), 4000);
        }
      }
    }
  }, [product.aiParsed, product.stone]);

  return (
    <Card className={`p-6 ${product.aiParsed ? 'ring-1 ring-purple-200 bg-purple-50/30' : ''}`}>
      {/* AI Parsed Indicator */}
      {product.aiParsed && (
        <div className="mb-3 px-3 py-2 bg-purple-100 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-700 font-medium flex items-center gap-1">
              🤖 AI Parsed Product
              {product.confidence && (
                <span className={`text-xs px-2 py-1 rounded ${
                  product.confidence === 'high' ? 'bg-green-100 text-green-700' :
                  product.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {product.confidence} confidence
                </span>
              )}
            </span>
            <button 
              onClick={() => updateField('aiParsed', false)}
              className="text-purple-500 hover:text-purple-700 text-xs"
            >
              dismiss
            </button>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="mb-3 px-3 py-2 bg-blue-100 border border-blue-200 rounded-lg animate-pulse">
          <p className="text-sm text-blue-700">{notification}</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {product.customName || `Type ${index + 1}`}
        </h3>
        {canRemove && (
          <Button
            onClick={() => onRemove(index)}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {/* First row: Stone Type, Slab Size, Thickness, Finish */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stone Type
          </label>
          <select
            value={product.stone}
            onChange={(e) => handleStoneChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">Select...</option>
            {getUniqueStoneTypes().map((stone, i) => (
              <option key={i} value={stone}>{stone}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slab Size {slabSizeOptions.length === 1 && <span className="text-xs text-gray-500">(auto)</span>}
          </label>
          <select
            value={product.slabSize || ''}
            onChange={(e) => updateField('slabSize', e.target.value)}
            disabled={!product.stone || slabSizeOptions.length === 0}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50"
          >
            <option value="">Select...</option>
            {slabSizeOptions.map((size, i) => (
              <option key={i} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thickness {thicknessOptions.length === 1 && <span className="text-xs text-gray-500">(auto)</span>}
          </label>
          <select
            value={product.thickness || ''}
            onChange={(e) => updateField('thickness', e.target.value)}
            disabled={!product.stone || thicknessOptions.length === 0}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50"
          >
            <option value="">Select...</option>
            {thicknessOptions.map((thickness, i) => (
              <option key={i} value={thickness}>{thickness}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Finish {finishOptions.length === 1 && <span className="text-xs text-gray-500">(auto)</span>}
          </label>
          <select
            value={product.finish || ''}
            onChange={(e) => updateField('finish', e.target.value)}
            disabled={!product.stone || finishOptions.length === 0}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50"
          >
            <option value="">Select...</option>
            {finishOptions.map((finish, i) => (
              <option key={i} value={finish}>{finish}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Second row: Edge Detail, Width, Depth, Quantity */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Edge Detail
          </label>
          <select
            value={product.edgeDetail}
            onChange={(e) => updateField('edgeDetail', e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="Eased">Eased</option>
            <option value="1.5 mitered">1.5" Mitered</option>
            <option value="Bullnose">Bullnose</option>
            <option value="Ogee">Ogee</option>
            <option value="Beveled">Beveled</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Width (inches)
          </label>
          <input
            type="number"
            value={product.width}
            onChange={(e) => updateField('width', e.target.value)}
            placeholder="24"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Depth (inches)
          </label>
          <input
            type="number"
            value={product.depth}
            onChange={(e) => updateField('depth', e.target.value)}
            placeholder="36"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            value={product.quantity}
            onChange={(e) => updateField('quantity', e.target.value)}
            min="1"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* Third row: Custom Name, Notes, Upload Drawing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom Name
          </label>
          <input
            type="text"
            value={product.customName}
            onChange={(e) => updateField('customName', e.target.value)}
            placeholder="Kitchen Island"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={product.note}
            onChange={(e) => updateField('note', e.target.value)}
            placeholder="Add any special instructions..."
            rows={1}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Drawing
          </label>
          <label className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            {loadingAI ? 'Analyzing...' : 'Choose File'}
            <input
              type="file"
              accept="image/*,.pdf,.dwg,.dxf"
              onChange={(e) => onUpload(e, index)}
              disabled={loadingAI}
              className="hidden"
            />
          </label>
        </div>
      </div>
      
      {loadingAI && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <div className="text-blue-800 font-medium">🤖 Claude AI is analyzing your drawing...</div>
              <div className="text-blue-600 text-sm">Extracting dimensions and identifying all pieces</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
