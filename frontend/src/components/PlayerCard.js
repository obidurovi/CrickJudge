import React from 'react';

const PlayerCard = ({ player }) => {
  const roleColor = {
    'Batsman': 'bg-blue-100 text-blue-800',
    'Bowler': 'bg-red-100 text-red-800',
    'Allrounder': 'bg-purple-100 text-purple-800',
    'Wicketkeeper': 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className='bg-white shadow-md rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-shadow duration-300'>
      <div className='flex items-center space-x-4 mb-4'>
        <div className='h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-600'>
            {player.name.charAt(0)}
        </div>
        <div>
            <h3 className='text-lg font-bold text-gray-800 leading-tight'>{player.name}</h3>
            <div className='flex items-center space-x-2 mt-1'>
                <span className='text-xs text-gray-500'>{player.country}</span>
                <span className={\	ext-xs px-2 py-0.5 rounded-full font-medium \\}>
                    {player.role}
                </span>
            </div>
        </div>
      </div>
      
      <div className='grid grid-cols-2 gap-2 text-sm'>
        <div className='bg-gray-50 p-2 rounded flex justify-between'>
            <span className='text-gray-500'>Runs</span>
            <span className='font-semibold'>{player.stats.runs}</span>
        </div>
        <div className='bg-gray-50 p-2 rounded flex justify-between'>
            <span className='text-gray-500'>Wickets</span>
            <span className='font-semibold'>{player.stats.wickets}</span>
        </div>
        <div className='bg-gray-50 p-2 rounded flex justify-between'>
            <span className='text-gray-500'>Avg</span>
            <span className='font-semibold'>{player.stats.average}</span>
        </div>
        <div className='bg-gray-50 p-2 rounded flex justify-between'>
            <span className='text-gray-500'>Eco</span>
            <span className='font-semibold'>{player.stats.economy}</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
