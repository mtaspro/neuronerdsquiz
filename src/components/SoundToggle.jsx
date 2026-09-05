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
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors border ${
        soundEnabled 
          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25' 
          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700/80 hover:text-slate-200'
      } ${className}`}
      title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
    >
      {soundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
      <span className="text-sm">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
    </button>
  );
};

export default SoundToggle;