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

  // Get available combinations for current selections
  const getAvailableOptions = () => {
    let filteredOptions = [...stoneOptions];
    
    // Filter by stone type if selected
    if (product.stone) {
      filteredOptions = filteredOptions.filter(s => s["Stone Type"] === product.stone);
    }
    
    // Filter by slab size if selected
    if (product.slabSize && product.stone) {
      filteredOptions = filteredOptions.filter(s => s["Slab Size"] === product.slabSize);
    }
    
    // Filter by thickness if selected
    if (product.thickness && product.stone) {
      filteredOptions = filteredOptions.filter(s => s["Thickness"] === product.thickness);
    }
    
    // Filter by finish if selected
    if (product.finish && product.stone) {
      filteredOptions = filteredOptions.filter(s => s["Finish"] === product.finish);
    }
    
    return filteredOptions;
  };

  // Get unique values for each field based on current filters
  const getFieldOptions = (fieldName) => {
    const availableOptions = getAvailableOptions();
    const values = new Set();
    
    availableOptions.forEach(option => {
      if (option[fieldName]) {
        values.add(option[fieldName]);
      }
    });
    
    return Array.from(values).sort();
  };

  // Check if current combination exists
  const combinationExists = () => {
    if (!product.stone || !product.slabSize || !product.thickness || !product.finish) {
      return false;
    }
    
    return stoneOptions.some(stone => 
      stone["Stone Type"] === product.stone &&
      stone["Slab Size"] === product.slabSize &&
      stone["Thickness"] === product.thickness &&
      stone["Finish"] === product.finish
    );
  };

  // Smart auto-selection when stone changes
  const handleStoneChange = (newStone) => {
    updateField('stone', newStone);
    
    if (!newStone) {
      // Clear all dependent fields
      updateField('slabSize', '');
      updateField('thickness', '');
      updateField('finish', '');
      return;
    }
    
    // Get all options for this stone
    const stoneOptions = getFieldOptions('Slab Size');
    const thicknessOptions = getFieldOptions('Thickness');
    const finishOptions = getFieldOptions('Finish');
    
    // Reset dependent fields to first available option
    updateField('slabSize', stoneOptions[0] || '');
    updateField('thickness', thicknessOptions[0] || '');
    updateField('finish', finishOptions[0] || '');
    
    setNotification(`Stone changed to ${newStone}. Fields auto-updated.`);
    setTimeout(() => setNotification(''), 3000);
  };

  // Handle changes to other fields
  const handleFieldChange = (field, value) => {
    updateField(field, value);
    
    // Check if this creates an invalid combination
    const tempProduct = { ...product, [field]: value };
    const availableAfterChange = stoneOptions.filter(s => {
      let matches = true;
      if (tempProduct.stone) matches = matches && s["Stone Type"] === tempProduct.stone;
      if (tempProduct.slabSize) matches = matches && s["Slab Size"] === tempProduct.slabSize;
      if (tempProduct.thickness) matches = matches && s["Thickness"] === tempProduct.thickness;
      if (tempProduct.finish) matches = matches && s["Finish"] === tempProduct.finish;
      return matches;
    });
    
    if (availableAfterChange.length === 0) {
      setNotification('⚠️ This combination doesn\'t exist. Please adjust your selections.');
      setTimeout(() => setNotification(''), 5000);
    }
  };

  // Get current available options
  const slabSizeOptions = product.stone ? getFieldOptions('Slab Size') : [];
  const thicknessOptions = product.stone ? getFieldOptions('Thickness') : [];
  const finishOptions = product.stone ? getFieldOptions('Finish') : [];

  // Show warning if combination doesn't exist
  const showCombinationWarning = product.stone && product.slabSize && product.thickness && product.finish && !combinationExists();

  return (
    <Card className={`p-6 ${product.aiParsed ? 'ring-1 ring-purple-200 bg-purple-50/30' : ''} ${showCombinationWarning ? 'ring-2 ring-red-300' : ''}`}>
      {/* AI Parsed Indicator */}
      {product.aiParsed && (
        <div className="mb-3 px-3 py-2 bg-purple-100 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-700 font-medium flex items-center gap-1">
              🤖 AI Parsed Type
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

      {/* Combination Warning */}
      {showCombinationWarning && (
        <div className="mb-3 px-3 py-2 bg-red-100 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">
            ⚠️ This combination doesn't exist in the database!
          </p>
          <p className="text-xs text-red-600 mt-1">
            {product.stone} + {product.slabSize} + {product.thickness}" + {product.finish}
          </p>
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
            Slab Size 
            {slabSizeOptions.length === 0 && product.stone && (
              <span className="text-xs text-red-500 ml-1">(no options)</span>
            )}
          </label>
          <select
            value={product.slabSize || ''}
            onChange={(e) => handleFieldChange('slabSize', e.target.value)}
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
            Thickness
            {thicknessOptions.length === 0 && product.stone && (
              <span className="text-xs text-red-500 ml-1">(no options)</span>
            )}
          </label>
          <select
            value={product.thickness || ''}
            onChange={(e) => handleFieldChange('thickness', e.target.value)}
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
            Finish
            {finishOptions.length === 0 && product.stone && (
              <span className="text-xs text-red-500 ml-1">(no options)</span>
            )}
          </label>
          <select
            value={product.finish || ''}
            onChange={(e) => handleFieldChange('finish', e.target.value)}
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
      
      {/* Show what combinations exist */}
      {product.stone && getAvailableOptions().length > 0 && (
        <div className="mb-4 p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            Available combinations for {product.stone}: {getAvailableOptions().length}
          </p>
        </div>
      )}
      
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
