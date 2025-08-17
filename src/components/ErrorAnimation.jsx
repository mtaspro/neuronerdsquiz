import Lottie from 'lottie-react';
import { useState, useEffect } from 'react';

const ErrorAnimation = ({ 
  errorType = "404",
  title,
  message,
  showBackButton = true 
}) => {
  const [animationData, setAnimationData] = useState(null);

  const errorConfig = {
    "404": {
      url: "https://lottie.host/460a0e42-40ea-4f9b-a476-476d55edeccc/BBzwoxgpoo.json",
      title: "404 - Page Not Found",
      message: "The page you're looking for doesn't exist."
    },
    "500": {
      url: "https://lottie.host/62a07476-e7da-4f5b-8eb0-5b2ec23cec6d/2SEqBLHzNP.json",
      title: "500 - Server Error",
      message: "Something went wrong on our end. Please try again later."
    },
    "403": {
      url: "https://lottie.host/501785f6-bce4-4aa9-9003-c4ddb49d0101/7OyBxPWqjS.json",
      title: "403 - Access Forbidden",
      message: "You don't have permission to access this resource."
    },
    "401": {
      url: "https://lottie.host/c272d839-51d5-43d3-addc-00e5626aad52/Ihq5w3CFYt.json",
      title: "401 - Unauthorized",
      message: "Please log in to access this page."
    },
    "503": {
      url: "https://lottie.host/b3ffe6be-ed3c-4e24-803c-6b98dd80d058/4UqsIsNNGb.json",
      title: "503 - Service Unavailable",
      message: "The service is temporarily unavailable. Please try again later."
    }
  };

  const config = errorConfig[errorType] || errorConfig["404"];
  const finalTitle = title || config.title;
  const finalMessage = message || config.message;

  useEffect(() => {
    fetch(config.url)
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error('Failed to load animation:', error));
  }, [config.url]);

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center max-w-md w-full">
        {/* Lottie Animation */}
        <div className="w-64 h-64 mx-auto mb-8">
          {animationData ? (
            <Lottie
              animationData={animationData}
              loop={true}
              autoplay={true}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Error Text */}
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
          {finalTitle}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          {finalMessage}
        </p>

        {/* Back Button */}
        {showBackButton && (
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Go Back
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAnimation;