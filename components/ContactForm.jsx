// Save this as: components/ContactForm.jsx
import { Card } from './ui/Card';
import { AlertCircle } from './icons/Icons';

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