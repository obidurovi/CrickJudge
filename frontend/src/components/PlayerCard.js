import React from 'react';

const PlayerCard = ({ player }) => {
  const roleColor = {
    'Batsman': 'bg-blue-50 text-blue-700 border-blue-100',
    'Bowler': 'bg-rose-50 text-rose-700 border-rose-100',
    'Allrounder': 'bg-purple-50 text-purple-700 border-purple-100',
    'Wicketkeeper': 'bg-amber-50 text-amber-700 border-amber-100'
  };

  return (
    <div className='bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col'>
      <div className='flex items-start justify-between mb-4'>
        <div className='flex items-center space-x-4'>
            <div className='h-14 w-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center text-2xl font-bold text-slate-600 shadow-inner'>
                {player.name.charAt(0)}
            </div>
            <div>
                <h3 className='text-lg font-bold text-slate-800 leading-tight line-clamp-1'>{player.name}</h3>
                <p className='text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider'>{player.country}</p>
            </div>
        </div>
      </div>
      
      <div className='mb-4'>
        <span className={`inline-block text-xs px-3 py-1 rounded-full font-semibold border ${roleColor[player.role] || 'bg-gray-100 text-gray-600'}`}>
            {player.role}
        </span>
      </div>

      <div className='mt-auto grid grid-cols-2 gap-3 text-sm'>
        <div className='bg-slate-50 p-2.5 rounded-xl border border-slate-100'>
            <p className='text-xs text-slate-400 mb-1'>Runs</p>
            <p className='font-bold text-slate-700'>{player.stats.runs.toLocaleString()}</p>
        </div>
        <div className='bg-slate-50 p-2.5 rounded-xl border border-slate-100'>
            <p className='text-xs text-slate-400 mb-1'>Wickets</p>
            <p className='font-bold text-slate-700'>{player.stats.wickets}</p>
        </div>
        <div className='bg-slate-50 p-2.5 rounded-xl border border-slate-100'>
            <p className='text-xs text-slate-400 mb-1'>Average</p>
            <p className='font-bold text-slate-700'>{player.stats.average}</p>
        </div>
        <div className='bg-slate-50 p-2.5 rounded-xl border border-slate-100'>
            <p className='text-xs text-slate-400 mb-1'>Economy</p>
            <p className='font-bold text-slate-700'>{player.stats.economy}</p>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
