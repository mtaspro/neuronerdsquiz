import React from 'react';
import { motion } from 'framer-motion';

const MaintenanceOverlay = ({ isActive, isSuperAdmin }) => {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] bg-gray-900 flex items-center justify-center"
    >
      <div className="text-center">
        <div className="w-64 h-64 mx-auto mb-8">
          <iframe
            src="https://lottie.host/embed/fafc6dbc-d742-4f7a-b475-d4e9e4483057/rmRAaaC8hp.json"
            className="w-full h-full border-0"
            title="Maintenance Animation"
          />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">
          🔧 Maintenance Mode
        </h2>
        <p className="text-gray-300 text-lg">
          We're updating the system. Please check back in a few minutes.
        </p>
        {isSuperAdmin && (
          <div className="mt-6 p-4 bg-green-900/50 border border-green-500 rounded-lg">
            <p className="text-green-300 text-sm font-semibold">
              👑 SuperAdmin Access: You can still use the site during maintenance
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MaintenanceOverlay;