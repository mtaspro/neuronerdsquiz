import React from 'react';
import { FaForward, FaLightbulb, FaEye, FaClock } from 'react-icons/fa';

const LifelineTools = ({ 
  config, 
  usedCounts, 
  onUseLifeline, 
  disabled = false,
  currentQuestion 
}) => {
  const tools = [
    {
      key: 'skip',
      icon: FaForward,
      label: 'Skip',
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Skip question without penalty'
    },
    {
      key: 'help',
      icon: FaLightbulb,
      label: 'Help',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      description: `Show answer (-${config?.help?.penaltyPercentage || 50}% score)`
    },
    {
      key: 'fiftyFifty',
      icon: FaEye,
      label: '50-50',
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Remove 2 wrong options'
    },
    {
      key: 'extraTime',
      icon: FaClock,
      label: 'Extra Time',
      color: 'bg-purple-500 hover:bg-purple-600',
      description: `Add ${config?.extraTime?.extraSeconds || 10}s to timer`
    }
  ];

  return (
    <div className="flex gap-2 mb-4">
      {tools.map(tool => {
        const toolConfig = config?.[tool.key];
        if (!toolConfig?.enabled) return null;

        const used = usedCounts[tool.key] || 0;
        const maxUses = toolConfig.maxUses;
        const canUse = used < maxUses && !disabled;

        return (
          <button
            key={tool.key}
            onClick={() => canUse && onUseLifeline(tool.key)}
            disabled={!canUse}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium
              transition-all duration-200 min-w-[100px]
              ${canUse ? tool.color : 'bg-gray-400 cursor-not-allowed'}
            `}
            title={tool.description}
          >
            <tool.icon className="text-lg" />
            <span>{tool.label}</span>
            <span className="text-xs opacity-75">
              {used}/{maxUses}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default LifelineTools;