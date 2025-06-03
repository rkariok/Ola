// Save this as: components/ProductCard.jsx
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { X, Upload } from './icons/Icons';

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
  const updateField = (field, value) => {
    onUpdate(index, field, value);
  };

  // Get unique values from stone options for dropdowns
  const getUniqueValues = (field) => {
    const values = new Set();
    stoneOptions.forEach(stone => {
      if (stone[field]) {
        values.add(stone[field]);
      }
    });
    return Array.from(values);
  };

  const finishOptions = getUniqueValues('Finish');
  const thicknessOptions = getUniqueValues('Thickness');
  const slabSizeOptions = getUniqueValues('Slab Size');

  // Get current stone data to sync dependent fields
  const currentStone = stoneOptions.find(s => s["Stone Type"] === product.stone);

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
            onChange={(e) => {
              updateField('stone', e.target.value);
              // Auto-update finish, thickness, and slab size based on selected stone
              const selectedStone = stoneOptions.find(s => s["Stone Type"] === e.target.value);
              if (selectedStone) {
                if (selectedStone['Finish']) updateField('finish', selectedStone['Finish']);
                if (selectedStone['Thickness']) updateField('thickness', selectedStone['Thickness']);
                if (selectedStone['Slab Size']) updateField('slabSize', selectedStone['Slab Size']);
              }
            }}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">Select...</option>
            {stoneOptions.map((stone, i) => (
              <option key={i} value={stone["Stone Type"]}>{stone["Stone Type"]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slab Size
          </label>
          <select
            value={product.slabSize || ''}
            onChange={(e) => updateField('slabSize', e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
          </label>
          <select
            value={product.thickness || ''}
            onChange={(e) => updateField('thickness', e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
          </label>
          <select
            value={product.finish || ''}
            onChange={(e) => updateField('finish', e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
