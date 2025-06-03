// Save this as: components/Header.jsx
import { Button } from './ui/Button';
import { Save, FolderOpen } from './icons/Icons';

export const Header = ({ savedQuotes, onSaveQuote, onShowSavedQuotes }) => {
  return (
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
          <div className="flex gap-2">
            <Button
              onClick={onSaveQuote}
              variant="outline"
              size="sm"
            >
              <Save className="w-4 h-4" />
              Save Quote
            </Button>
            <Button
              onClick={onShowSavedQuotes}
              variant="outline"
              size="sm"
            >
              <FolderOpen className="w-4 h-4" />
              Load Quote ({savedQuotes.length})
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};