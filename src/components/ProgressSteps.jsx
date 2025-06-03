// Save this as: components/ProgressSteps.jsx
import { ChevronRight } from './icons/Icons';

export const ProgressSteps = ({ currentStep }) => {
  const steps = [
    { number: 1, label: 'Customer Info', completed: currentStep > 1 },
    { number: 2, label: 'Types', completed: currentStep > 2 },
    { number: 3, label: 'Calculate', completed: currentStep > 3 },
    { number: 4, label: 'Results', completed: currentStep > 4 }
  ];

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-center items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.completed 
                    ? 'bg-teal-600 text-white' 
                    : currentStep === step.number 
                      ? 'bg-teal-600 text-white'
                      : 'border-2 border-gray-300 text-gray-400'
                }`}>
                  {step.completed ? '✓' : step.number}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-gray-400 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
