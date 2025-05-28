export const Button = ({ children, variant = 'default', size = 'default', className = '', ...props }) => {
  const variants = {
    default: 'bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800 shadow-sm',
    outline: 'bg-white border-2 border-gray-200 text-gray-700 hover:border-teal-500 hover:text-teal-600',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
  };
  
  const sizes = {
    default: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    sm: 'px-3 py-1.5 text-xs'
  };
  
  return (
    <button
      className={`font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};