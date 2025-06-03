// Save this as: components/ContactForm.jsx
import { useState } from 'react';
import { Card } from './ui/Card';
import { AlertCircle } from './icons/Icons';
import { parseProductText } from '../utils/aiDrawingAnalysis';

export const ContactForm = ({ userInfo, onChange }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-teal-600" />
        Contact Information
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={userInfo.name}
            onChange={(e) => onChange({ ...userInfo, name: e.target.value })}
            placeholder="John Smith"
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            value={userInfo.email}
            onChange={(e) => onChange({ ...userInfo, email: e.target.value })}
            placeholder="email@example.com"
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={userInfo.phone}
            onChange={(e) => onChange({ ...userInfo, phone: e.target.value })}
            placeholder="(555) 123-4567"
            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>
    </Card>
  );
};

// Helper to find best combination for AI parsed products
const findBestCombination = (stoneType, stoneOptions) => {
  const stoneVariants = stoneOptions.filter(s => s["Stone Type"] === stoneType);
  if (stoneVariants.length === 0) return null;
  
  // Priority order for defaults
  const thicknessOrder = ['3CM', '2CM', '4CM', '5CM', '6CM'];
  const finishOrder = ['Polished', 'Honed', 'Leathered', 'Brushed', 'Flamed'];
  
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

// NEW: Separate component for bulk import
export const BulkProductImport = ({ stoneOptions, onProductsParsed }) => {
  const [bulkInput, setBulkInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState('');

  const handleQuickParse = async () => {
    if (!bulkInput.trim() || parsing) return;
    
    setParsing(true);
    setParseMessage('');
    
    try {
      // Call Claude API for text parsing
      const result = await parseProductText(bulkInput, stoneOptions);
      
      if (result.products && result.products.length > 0) {
        let adjustmentMessages = [];
        
        // Convert to your product format with smart defaults
        const newProducts = result.products.map((p, index) => {
          const selectedStone = p.stoneType || stoneOptions[0]?.["Stone Type"] || '';
          
          // Find best combination for this stone
          const bestCombination = findBestCombination(selectedStone, stoneOptions);
          
          // Check if AI's suggestions are available
          let finalFinish = bestCombination?.["Finish"] || '';
          let finalThickness = bestCombination?.["Thickness"] || '';
          let finalSlabSize = bestCombination?.["Slab Size"] || '';
          
          // If AI detected specific finish/thickness, check if available
          if (p.finish && stoneOptions.some(s => 
            s["Stone Type"] === selectedStone && s["Finish"] === p.finish
          )) {
            finalFinish = p.finish;
          } else if (p.finish) {
            adjustmentMessages.push(`${p.name}: ${p.finish} not available, using ${finalFinish}`);
          }
          
          if (p.thickness && stoneOptions.some(s => 
            s["Stone Type"] === selectedStone && s["Thickness"] === p.thickness
          )) {
            finalThickness = p.thickness;
          } else if (p.thickness) {
            adjustmentMessages.push(`${p.name}: ${p.thickness} not available, using ${finalThickness}`);
          }
          
          return {
            stone: selectedStone,
            width: p.width.toString(),
            depth: p.depth.toString(),
            quantity: p.quantity,
            edgeDetail: 'Eased',
            result: null,
            id: Date.now() + index,
            customName: p.name,
            note: p.features || '',
            aiParsed: true,
            confidence: p.confidence,
            finish: finalFinish,
            thickness: finalThickness,
            slabSize: finalSlabSize
          };
        });
        
        // Send to parent component
        onProductsParsed(newProducts);
        
        // Clear input and show success
        setBulkInput('');
        let message = `✅ Added ${newProducts.length} product${newProducts.length !== 1 ? 's' : ''}`;
        
        if (adjustmentMessages.length > 0) {
          message += '\n⚠️ ' + adjustmentMessages.join('\n⚠️ ');
        }
        
        setParseMessage(message);
        
        // Clear message after 6 seconds (longer for adjustments)
        setTimeout(() => setParseMessage(''), adjustmentMessages.length > 0 ? 6000 : 4000);
      } else {
        setParseMessage('❌ No products found in the text');
        setTimeout(() => setParseMessage(''), 5000);
      }
    } catch (error) {
      console.error('Parse error:', error);
      setParseMessage(`❌ ${error.message}`);
      setTimeout(() => setParseMessage(''), 5000);
    } finally {
      setParsing(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        Quick Product Import (Optional)
      </h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste product list for AI parsing
          <span className="text-xs text-gray-500 ml-2">
            - Automatically extracts dimensions, quantities, and stone types
          </span>
        </label>
        <textarea
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          onBlur={handleQuickParse}
          disabled={parsing}
          placeholder="QTY: 26) 2 Bay Suite Large Vanity Countertops (2'D x 6'W with 2&quot; backsplash)
·  (QTY: 26) Small Vanity Countertops (2'D x 4'-1&quot;W)
One (1) Calacatta Laza Oro Kitchen Island (3'D x 8'W)
FOSSIL GRAY – 2CM Quartz Polished (30x72)"
          rows={2}
          className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
        />
        
        {/* Status messages */}
        {parsing && (
          <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
            <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full"></div>
            🤖 Claude AI is parsing your list...
          </p>
        )}
        
        {parseMessage && (
          <div className={`text-sm mt-2 ${
            parseMessage.includes('✅') ? 'text-green-600' : 'text-red-600'
          }`}>
            {parseMessage.split('\n').map((line, i) => (
              <p key={i} className={line.includes('⚠️') ? 'text-orange-600' : ''}>{line}</p>
            ))}
          </div>
        )}
        
        {bulkInput.trim() && !parsing && !parseMessage && (
          <button
            onClick={handleQuickParse}
            className="mt-2 px-3 py-1 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors flex items-center gap-1"
          >
            🤖 Parse with AI
          </button>
        )}
      </div>
    </Card>
  );
};
