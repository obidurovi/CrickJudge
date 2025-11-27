import React from 'react';

const PlayerCard = ({ player }) => {
  // Using semi-transparent backgrounds for roles to blend with glass effect
  const roleColor = {
    'Batsman': 'bg-blue-500/20 text-blue-200 border-blue-500/30',
    'Bowler': 'bg-rose-500/20 text-rose-200 border-rose-500/30',
    'Allrounder': 'bg-purple-500/20 text-purple-200 border-purple-500/30',
    'Wicketkeeper': 'bg-amber-500/20 text-amber-200 border-amber-500/30'
  };

  return (
    // Glassmorphism Card Container
    <div className='bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 h-full flex flex-col group'>
      
      <div className='flex items-start justify-between mb-4'>
        <div className='flex items-center space-x-4'>
            {/* Avatar with gradient */}
            <div className='h-14 w-14 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center text-2xl font-bold text-white border border-white/10 shadow-inner'>
                {player.name.charAt(0)}
            </div>
            <div>
                <h3 className='text-lg font-bold text-white leading-tight line-clamp-1 group-hover:text-blue-300 transition-colors'>
                    {player.name}
                </h3>
                <p className='text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider'>
                    {player.country}
                </p>
            </div>
        </div>
      </div>
      
      <div className='mb-4'>
        <span className={`inline-block text-xs px-3 py-1 rounded-full font-semibold border ${roleColor[player.role] || 'bg-slate-700/50 text-slate-300 border-slate-600'}`}>
            {player.role}
        </span>
      </div>

      {/* Stats Grid - Transparent backgrounds */}
      <div className='mt-auto grid grid-cols-2 gap-3 text-sm'>
        <div className='bg-black/20 p-2.5 rounded-xl border border-white/5'>
            <p className='text-xs text-slate-400 mb-1'>Runs</p>
            <p className='font-bold text-slate-200'>{player.stats.runs.toLocaleString()}</p>
        </div>
        <div className='bg-black/20 p-2.5 rounded-xl border border-white/5'>
            <p className='text-xs text-slate-400 mb-1'>Wickets</p>
            <p className='font-bold text-slate-200'>{player.stats.wickets}</p>
        </div>
        <div className='bg-black/20 p-2.5 rounded-xl border border-white/5'>
            <p className='text-xs text-slate-400 mb-1'>Average</p>
            <p className='font-bold text-slate-200'>{player.stats.average}</p>
        </div>
        <div className='bg-black/20 p-2.5 rounded-xl border border-white/5'>
            <p className='text-xs text-slate-400 mb-1'>Economy</p>
            <p className='font-bold text-slate-200'>{player.stats.economy}</p>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
