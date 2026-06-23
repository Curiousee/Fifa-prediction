import React from 'react';

const MEDALS = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];

interface RankBadgeProps {
  rank: number;
}

const RankBadge: React.FC<RankBadgeProps> = ({ rank }) => (
  <div
    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
      rank === 1
        ? 'bg-yellow-500/20 text-yellow-400'
        : rank === 2
        ? 'bg-gray-400/20 text-gray-300'
        : rank === 3
        ? 'bg-orange-700/20 text-orange-400'
        : 'bg-gray-800 text-gray-400'
    }`}
  >
    {rank <= 3 ? MEDALS[rank - 1] : rank}
  </div>
);

export { MEDALS };
export default RankBadge;
