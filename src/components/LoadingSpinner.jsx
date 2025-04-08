import React from 'react';

const LoadingSpinner = ({ size = 'medium', className = '' }) => {
  // Size classes
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-6 h-6 border-2',
    large: 'w-8 h-8 border-3',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-t-indigo-600 border-r-indigo-600 border-b-gray-200 border-l-gray-200 animate-spin ${className}`}
    ></div>
  );
};

export default LoadingSpinner; 