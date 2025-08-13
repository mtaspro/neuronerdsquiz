import { useCallback } from 'react';
import soundManager from '../utils/soundUtils';

const useTypingSound = () => {
  const playTypingSound = useCallback(() => {
    soundManager.play('keyType');
  }, []);

  const handleKeyDown = useCallback((e) => {
    // Only play sound for actual typing keys
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
      playTypingSound();
    }
  }, [playTypingSound]);

  return { handleKeyDown, playTypingSound };
};

export default useTypingSound;