export const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between cursor-pointer group">
    {label && <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>}
    <div 
      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
        checked ? 'bg-gradient-to-r from-teal-500 to-teal-600' : 'bg-gray-200'
      }`}
      onClick={onChange}
    >
      <div 
        className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all duration-300 shadow-sm ${
          checked ? 'left-5' : 'left-0.5'
        }`}
      />
    </div>
  </label>
);