import Lottie from 'lottie-react';
import { useState, useEffect } from 'react';

const LoadingAnimation = ({ 
  message = "Loading...",
  size = "medium" // small, medium, large
}) => {
  const [animationData, setAnimationData] = useState(null);
  
  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24", 
    large: "w-32 h-32"
  };

  useEffect(() => {
    fetch("https://lottie.host/b39f8f87-3d0d-4751-ba62-9274ac09b80d/5CTRzY4AI4.json")
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error('Failed to load loading animation:', error));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={sizeClasses[size]}>
        {animationData ? (
          <Lottie 
            animationData={animationData} 
            loop={true}
            autoplay={true}
          />
        ) : (
          <div className="animate-spin rounded-full h-full w-full border-b-2 border-blue-500"></div>
        )}
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-center font-medium">
        {message}
      </p>
    </div>
  );
};

export default LoadingAnimation;