import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ 
  size = 'medium', 
  text = 'Loading...', 
  fullScreen = false,
  color = 'blue' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'border-blue-500',
    cyan: 'border-cyan-500',
    green: 'border-green-500',
    red: 'border-red-500',
    purple: 'border-purple-500',
    gray: 'border-gray-500'
  };

  const spinnerClass = `${sizeClasses[size]} ${colorClasses[color]} border-2 border-t-transparent rounded-full`;

  const spinner = (
    <motion.div
      className={spinnerClass}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      {spinner}
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 dark:text-gray-300 text-sm font-medium"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-50 dark:bg-gray-950 flex items-center justify-center z-50 transition-colors duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700"
        >
          {content}
        </motion.div>
      </div>
    );
  }

  return content;
};

// Skeleton loader for content
export const SkeletonLoader = ({ lines = 3, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 dark:bg-gray-700 rounded h-4 mb-3 ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};

// Card skeleton loader
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="bg-gray-200 dark:bg-gray-700 rounded h-6 w-3/4 mb-4" />
      <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-full mb-2" />
      <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-5/6 mb-2" />
      <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-2/3" />
    </div>
  );
};

// Button loading state
export const LoadingButton = ({ 
  children, 
  loading = false, 
  disabled = false, 
  className = '',
  ...props 
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={`relative ${className} ${
        loading || disabled ? 'opacity-75 cursor-not-allowed' : ''
      }`}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="small" text="" color="white" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
};

export default LoadingSpinner;