// Save this as: components/SavedQuotesView.jsx
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export const SavedQuotesView = ({ savedQuotes, onLoad, onDelete, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/AIC.jpg" alt="AIC Logo" className="w-12 h-12 rounded-xl shadow-sm" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                  AIC Surfaces
                </h1>
                <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">Saved Quotes</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6"
        >
          ← Back to Estimator
        </Button>

        <h2 className="text-3xl font-bold text-gray-900 mb-8">Saved Quotes</h2>

        {savedQuotes.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No saved quotes found.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {savedQuotes.map((quote) => (
              <Card key={quote.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{quote.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Saved on: {new Date(quote.date).toLocaleDateString()} at {new Date(quote.date).toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Customer: {quote.userInfo.name || 'N/A'} • Products: {quote.products.length}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => onLoad(quote)} size="sm">
                      Load Quote
                    </Button>
                    <Button
                      onClick={() => onDelete(quote.id)}
                      variant="danger"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};