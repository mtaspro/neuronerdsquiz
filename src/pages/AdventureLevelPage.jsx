import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdventureLevelModal from '../components/adventure/AdventureLevelModal';
import ChemLevel1Modal from '../components/adventure/ChemLevel1Modal';
import DotCrossChallengeModal from '../components/adventure/DotCrossChallengeModal';
import RainWindChallengeModal from '../components/adventure/RainWindChallengeModal';
import VectorCalculusChallengeModal from '../components/adventure/VectorCalculusChallengeModal';

/**
 * AdventureLevelPage
 * ------------------
 * Shared adventure-router page. Reads `levelKey` from the URL (/adventure/:levelKey),
 * then mounts the matching level modal bare (full-screen, open by default).
 * Closing the modal navigates back to the Adventure Hub (/adventure).
 *
 * Each modal reports success via its `onLevelComplete` hook — the payload is
 * the intended persistence contract (auraPoints / inGameTokens / stars).
 * Backend persistence itself is wired through the onLevelComplete handler below.
 */

const LEVELS = {
  'vector-level-1': AdventureLevelModal,
  'vector-scene-1': DotCrossChallengeModal,
  'vector-scene-2': RainWindChallengeModal,
  'vector-scene-3': VectorCalculusChallengeModal,
  'chem-level-1': ChemLevel1Modal,
};

export default function AdventureLevelPage() {
  const { levelKey } = useParams();
  const navigate = useNavigate();

  const Level = LEVELS[levelKey] || AdventureLevelModal;

  const handleComplete = (result) => {
    // Persistence hook — payload `result` carries { success, accuracy/score } plus
    // the level's numeric rewards. Backend endpoint (UserStats.auraPoints /
    // inGameTokens / campaignProgress incl. stars) is a separate task.
    console.log('[AdventureLevelPage] onLevelComplete', levelKey, result);
  };

  return (
    <Level
      open
      onClose={() => navigate('/adventure')}
      onLevelComplete={handleComplete}
    />
  );
}