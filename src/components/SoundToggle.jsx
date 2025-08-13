import React, { useState, useEffect } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import soundManager from '../utils/soundUtils';

const SoundToggle = ({ className = '' }) => {
  const [soundEnabled, setSoundEnabled] = useState(soundManager.enabled);

  const toggleSound = () => {
    const newState = soundManager.toggle();
    setSoundEnabled(newState);
    
    // Play a test sound when enabling
    if (newState) {
      soundManager.play('click');
    }
  };

  return (
    <button
      onClick={toggleSound}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
        soundEnabled 
          ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
      } hover:bg-opacity-80 ${className}`}
      title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
    >
      {soundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
      <span className="text-sm">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
    </button>
  );
};

export default SoundToggle;