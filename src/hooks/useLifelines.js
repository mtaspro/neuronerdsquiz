import { useState, useCallback } from 'react';

export const useLifelines = (config) => {
  const [usedCounts, setUsedCounts] = useState({
    skip: 0,
    help: 0,
    fiftyFifty: 0,
    extraTime: 0
  });

  const [lifelineEffects, setLifelineEffects] = useState({
    skippedQuestions: new Set(),
    helpUsedQuestions: new Set(),
    fiftyFiftyUsedQuestions: new Set(),
    extraTimeUsed: false
  });

  const canUseLifeline = useCallback((type) => {
    const toolConfig = config?.[type];
    if (!toolConfig?.enabled) return false;
    
    const used = usedCounts[type] || 0;
    return used < toolConfig.maxUses;
  }, [config, usedCounts]);

  const useLifeline = useCallback((type, questionId) => {
    if (!canUseLifeline(type)) return false;

    setUsedCounts(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + 1
    }));

    setLifelineEffects(prev => {
      const newEffects = { ...prev };
      
      switch (type) {
        case 'skip':
          newEffects.skippedQuestions = new Set([...prev.skippedQuestions, questionId]);
          break;
        case 'help':
          newEffects.helpUsedQuestions = new Set([...prev.helpUsedQuestions, questionId]);
          break;
        case 'fiftyFifty':
          newEffects.fiftyFiftyUsedQuestions = new Set([...prev.fiftyFiftyUsedQuestions, questionId]);
          break;
        case 'extraTime':
          newEffects.extraTimeUsed = true;
          break;
      }
      
      return newEffects;
    });

    return true;
  }, [canUseLifeline]);

  const resetLifelines = useCallback(() => {
    setUsedCounts({
      skip: 0,
      help: 0,
      fiftyFifty: 0,
      extraTime: 0
    });
    setLifelineEffects({
      skippedQuestions: new Set(),
      helpUsedQuestions: new Set(),
      fiftyFiftyUsedQuestions: new Set(),
      extraTimeUsed: false
    });
  }, []);

  return {
    usedCounts,
    lifelineEffects,
    canUseLifeline,
    useLifeline,
    resetLifelines
  };
};