import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const VENUES = [
    {
        id: 'mcg',
        name: 'Melbourne Cricket Ground',
        location: 'Melbourne, Australia',
        capacity: '100,024',
        image: 'https://resources.pulse.icc-cricket.com/ICC/photo/2022/10/23/8d903706-052d-4020-960f-6b0298a13056/MCG-general-view.jpg',
        paceSpin: { pace: 65, spin: 35 },
        avgScores: { first: 165, second: 148 },
        battingAdvantage: 'High',
        description: 'The MCG is known for its massive boundaries and lively pitches that offer bounce for pacers early on.'
    },
    {
        id: 'eden',
        name: 'Eden Gardens',
        location: 'Kolkata, India',
        capacity: '66,000',
        image: 'https://www.holidify.com/images/cmsuploads/compressed/Eden_Gardens_under_floodlights_20180221123456.jpg',
        paceSpin: { pace: 40, spin: 60 },
        avgScores: { first: 180, second: 165 },
        battingAdvantage: 'Moderate',
        description: 'A spinner’s paradise in later stages, Eden Gardens offers a lightning-fast outfield and electric atmosphere.'
    },
    {
        id: 'lords',
        name: 'Lord\'s Cricket Ground',
        location: 'London, UK',
        capacity: '30,000',
        image: 'https://resources.pulse.icc-cricket.com/ICC/photo/2019/07/14/9d702972-6029-465c-8814-2d331046000c/Lords-General-View.jpg',
        paceSpin: { pace: 75, spin: 25 },
        avgScores: { first: 240, second: 210 },
        battingAdvantage: 'Low',
        description: 'The Home of Cricket. The slope offers unique movement for seamers, making it a challenge for batters.'
    },
    {
        id: 'ahmedabad',
        name: 'Narendra Modi Stadium',
        location: 'Ahmedabad, India',
        capacity: '132,000',
        image: 'https://images.indianexpress.com/2021/02/motera-stadium-1200.jpg',
        paceSpin: { pace: 50, spin: 50 },
        avgScores: { first: 170, second: 160 },
        battingAdvantage: 'Moderate',
        description: 'The world\'s largest cricket stadium. Offers a balanced pitch that assists spinners as the game progresses.'
    }
];

const VenueIntelligence = () => {
    const [selectedVenue, setSelectedVenue] = useState(VENUES[0]);

    return (
        <div className='min-h-screen bg-slate-950 font-sans text-slate-200 flex flex-col'>
             {/* Navbar */}
             <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-3">
                            <Link to="/" className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">Venue Intelligence</h1>
                                <p className="text-xs text-blue-400 font-medium tracking-wide">STADIUM ANALYTICS</p>
                            </div>
                        </div>
                        <Link to="/" className="text-slate-400 hover:text-white transition-colors">Back to Dashboard</Link>
                    </div>
                </div>
            </nav>

            <div className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-8">
                
                {/* Header Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Venue Command Center</h2>
                    <p className="text-slate-400">Strategic pitch reports and stadium analytics.</p>
                </div>

                {/* Venue Selector */}
                <div className="flex gap-4 overflow-x-auto pb-6 mb-6 custom-scrollbar">
                    {VENUES.map(venue => (
                        <button
                            key={venue.id}
                            onClick={() => setSelectedVenue(venue)}
                            className={`px-6 py-3 rounded-full whitespace-nowrap text-sm font-bold transition-all ${
                                selectedVenue.id === venue.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            {venue.name}
                        </button>
                    ))}
                </div>

                {/* Grid Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Card 1: Stadium Info */}
                    <div className="bg-slate-900 rounded-3xl p-1 border border-white/5 shadow-xl overflow-hidden group">
                        <div className="relative h-48 rounded-t-3xl overflow-hidden">
                            <img src={selectedVenue.image} alt={selectedVenue.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                            <div className="absolute bottom-4 left-4">
                                <h3 className="text-xl font-bold text-white">{selectedVenue.name}</h3>
                                <p className="text-sm text-slate-300 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    {selectedVenue.location}
                                </p>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4 bg-slate-800/50 p-3 rounded-xl">
                                <span className="text-xs text-slate-400 uppercase font-bold">Capacity</span>
                                <span className="text-lg font-mono font-bold text-white">{selectedVenue.capacity}</span>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {selectedVenue.description}
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Wicket Distribution (Donut Chart) */}
                    <div className="bg-slate-900 rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col items-center justify-center relative">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 w-full text-left flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            Wicket Distribution
                        </h3>
                        
                        <div className="relative w-48 h-48">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="20" fill="transparent" className="text-blue-900/30" />
                                <circle 
                                    cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="20" fill="transparent" 
                                    className="text-red-500"
                                    strokeDasharray={`${selectedVenue.paceSpin.pace * 5.02} 502`} 
                                />
                                <circle 
                                    cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="20" fill="transparent" 
                                    className="text-blue-500"
                                    strokeDasharray={`${selectedVenue.paceSpin.spin * 5.02} 502`} 
                                    strokeDashoffset={`-${selectedVenue.paceSpin.pace * 5.02}`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-white">{selectedVenue.paceSpin.pace}%</span>
                                <span className="text-xs text-red-400 font-bold uppercase">Pace</span>
                            </div>
                        </div>
                        <div className="flex gap-6 mt-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-sm text-slate-300">Pace</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-sm text-slate-300">Spin</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-4 text-center">Historical Wicket Data (Pace vs Spin)</p>
                    </div>

                    {/* Card 3: Average Scores (Bar Chart) */}
                    <div className="bg-slate-900 rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
                            Average Scores
                        </h3>

                        <div className="flex-1 flex items-end justify-center gap-8 px-4 pb-4 border-b border-white/5 border-dashed">
                            {/* Bar 1 */}
                            <div className="flex flex-col items-center gap-2 w-16 group">
                                <span className="text-lg font-bold text-white mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{selectedVenue.avgScores.first}</span>
                                <div 
                                    className="w-full bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-400"
                                    style={{ height: `${(selectedVenue.avgScores.first / 300) * 200}px` }}
                                ></div>
                                <span className="text-xs text-slate-400 font-medium">1st Inn</span>
                            </div>

                            {/* Bar 2 */}
                            <div className="flex flex-col items-center gap-2 w-16 group">
                                <span className="text-lg font-bold text-white mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{selectedVenue.avgScores.second}</span>
                                <div 
                                    className="w-full bg-purple-500 rounded-t-lg transition-all duration-500 hover:bg-purple-400"
                                    style={{ height: `${(selectedVenue.avgScores.second / 300) * 200}px` }}
                                ></div>
                                <span className="text-xs text-slate-400 font-medium">2nd Inn</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-between items-center">
                            <span className="text-sm text-slate-400">Batting First Advantage</span>
                            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                                selectedVenue.battingAdvantage === 'High' ? 'bg-green-500/20 text-green-400' : 
                                selectedVenue.battingAdvantage === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                                {selectedVenue.battingAdvantage}
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default VenueIntelligence;