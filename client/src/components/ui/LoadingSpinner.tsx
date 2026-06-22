import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizes = {
  sm: 'w-5 h-5 border-2',
  md: 'w-9 h-9 border-2',
  lg: 'w-14 h-14 border-3',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
}) => (
  <div className="flex flex-col items-center justify-center gap-3 py-12">
    <div
      className={`${sizes[size]} border-gray-700 border-t-green-500 rounded-full animate-spin`}
    />
    {text && <p className="text-gray-400 text-sm">{text}</p>}
  </div>
);

export default LoadingSpinner;
