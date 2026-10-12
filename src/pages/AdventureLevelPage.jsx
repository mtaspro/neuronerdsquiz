import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import AdventureLevelModal from '../components/adventure/AdventureLevelModal';
import ChemLevel1Modal from '../components/adventure/ChemLevel1Modal';
import DotCrossChallengeModal from '../components/adventure/DotCrossChallengeModal';
import RainWindChallengeModal from '../components/adventure/RainWindChallengeModal';
import VectorCalculusChallengeModal from '../components/adventure/VectorCalculusChallengeModal';
import OrganicQuizModal from '../components/adventure/OrganicQuizModal';

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
  'chem-organic-quest': OrganicQuizModal,
};

export default function AdventureLevelPage() {
  const { levelKey } = useParams();
  const navigate = useNavigate();

  const Level = LEVELS[levelKey] || AdventureLevelModal;

    const handleComplete = async (result) => {
    try {
      await api.post('/api/adventure/complete', {
        levelKey,
        success: result?.success === true,
        stars: result?.stars ?? (result?.accuracy >= 90 ? 3 : result?.accuracy >= 75 ? 2 : 1),
      });
    } catch (err) {
      console.error('[AdventureLevelPage] persist failed:', err?.response?.data?.error || err.message);
    }
  };

  return (
    <Level
      open
      onClose={() => navigate('/adventure')}
      onLevelComplete={handleComplete}
    />
  );
}