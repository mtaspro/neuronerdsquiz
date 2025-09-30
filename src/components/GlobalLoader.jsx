import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalLoader = ({ isLoading, children, skeletonType = 'default' }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) return prev;
          return prev + Math.random() * 8;
        });
      }, 400);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [isLoading]);

  const SkeletonBox = ({ className = "", animate = true }) => (
    <div className={`bg-gray-200 dark:bg-gray-700 rounded ${animate ? 'animate-shimmer' : ''} ${className}`} />
  );

  const renderSkeleton = () => {
    switch (skeletonType) {
      case 'dashboard':
        return (
          <div className="p-8 space-y-6">
            <SkeletonBox className="h-12 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <SkeletonBox className="h-6 w-32 mb-4" />
                  <SkeletonBox className="h-4 w-full mb-2" />
                  <SkeletonBox className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        );
      case 'quiz':
        return (
          <div className="p-8 max-w-4xl mx-auto">
            <SkeletonBox className="h-8 w-48 mb-6" />
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
              <SkeletonBox className="h-6 w-full mb-6" />
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <SkeletonBox key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          </div>
        );
      case 'table':
        return (
          <div className="p-8">
            <SkeletonBox className="h-8 w-48 mb-6" />
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex space-x-4">
                  {[...Array(4)].map((_, i) => (
                    <SkeletonBox key={i} className="h-4 w-24" />
                  ))}
                </div>
              </div>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-4">
                    {[...Array(4)].map((_, j) => (
                      <SkeletonBox key={j} className="h-4 w-24" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="p-8 space-y-6">
            <SkeletonBox className="h-8 w-64" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <SkeletonBox key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {/* Progress Bar */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            exit={{ scaleX: 1, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed top-0 left-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 z-50 origin-left"
            style={{ width: '100vw' }}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-50 dark:bg-gray-950 z-40"
          >
            {/* Skeleton Background */}
            <div className="opacity-30">
              {renderSkeleton()}
            </div>

            {/* Lottie Animation Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4">
                  <iframe
                    src="https://lottie.host/embed/b39f8f87-3d0d-4751-ba62-9274ac09b80d/5CTRzY4AI4.json"
                    className="w-full h-full border-0"
                    title="Loading Animation"
                  />
                </div>
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-gray-600 dark:text-gray-400 font-medium"
                >
                  Loading...
                </motion.p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalLoader;