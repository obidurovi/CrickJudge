import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CrickJudge from './pages/CrickJudge';
import AnalyticsHub from './pages/AnalyticsHub';
import MatchSimulator from './pages/MatchSimulator';
import TeamsPage from './pages/TeamsPage';
import VenueIntelligence from './pages/VenueIntelligence';
import LiveMatches from './pages/LiveMatches';
import PlayerDetail from './pages/PlayerDetail';
import MatchScorecard from './pages/MatchScorecard';
import WatchlistDashboard from './pages/WatchlistDashboard';
import SeriesLeaderboards from './pages/SeriesLeaderboards';
import PlayerFormTracker from './pages/PlayerFormTracker';
import Register from './pages/Register';
import Login from './pages/Login';

const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path
    ? 'bg-gradient-to-r from-blue-600/95 to-cyan-500/90 text-white border border-cyan-300/30 shadow-lg shadow-blue-900/50'
    : 'text-slate-300 hover:text-white border border-transparent hover:bg-white/5 hover:border-white/10';
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const navItemClass = (path) => `group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive(path)}`;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, setMobileMenuOpen]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${mobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={closeMobileMenu}
      ></div>

      <div className={`w-72 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 h-screen fixed left-0 top-0 border-r border-slate-700/60 flex flex-col z-50 transform transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 flex items-center justify-between gap-3 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-900/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">CrickJudge</h1>
            <p className="text-[10px] text-cyan-300/80 uppercase tracking-[0.2em]">Control Panel</p>
          </div>
        </div>

        <button
          onClick={closeMobileMenu}
          className="lg:hidden text-slate-400 hover:text-white"
          aria-label="Close navigation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <nav className="app-scroll flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-2">
        <p className="px-2 pt-1 pb-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">Main</p>
        <Link to="/" onClick={closeMobileMenu} className={navItemClass('/')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
          Dashboard
        </Link>
        <Link to="/live-matches" onClick={closeMobileMenu} className={navItemClass('/live-matches')}>
          <span className="relative flex items-center justify-center w-5 h-5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9.172 15.828a5 5 0 010-7.072m5.656 0a5 5 0 010 7.072M12 12h.01"></path></svg>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </span>
          Live Matches
        </Link>
        <Link to="/series-leaderboards" onClick={closeMobileMenu} className={navItemClass('/series-leaderboards')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 17l6-6 4 4 8-8M14 7h7v7"></path></svg>
          Leaderboards
        </Link>
        <Link to="/player-form-tracker" onClick={closeMobileMenu} className={navItemClass('/player-form-tracker')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 19h16M6 15l3-3 3 2 4-5 2 2"></path></svg>
          Player Form
        </Link>
        <Link to="/watchlist" onClick={closeMobileMenu} className={navItemClass('/watchlist')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l14 0l0 18l-7-5l-7 5z"></path></svg>
          Watchlist
        </Link>
        <Link to="/register" onClick={closeMobileMenu} className={navItemClass('/register')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3M5 5h7a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"></path></svg>
          Create Account
        </Link>

        <p className="px-2 pt-4 pb-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">Analysis Tools</p>
        <Link to="/crickjudge" onClick={closeMobileMenu} className={navItemClass('/crickjudge')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          CrickJudge
        </Link>
        <Link to="/analytics" onClick={closeMobileMenu} className={navItemClass('/analytics')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18M3 12h18M3 21h18"></path></svg>
          Analytics Hub
        </Link>
        <Link to="/simulator" onClick={closeMobileMenu} className={navItemClass('/simulator')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v20m10-10H2"></path></svg>
          Match Simulator
        </Link>
        <Link to="/teams" onClick={closeMobileMenu} className={navItemClass('/teams')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01"></path></svg>
          Teams
        </Link>
        
        <Link to="/venue-intelligence" onClick={closeMobileMenu} className={navItemClass('/venue-intelligence')}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">Venue Intelligence</span>
          </Link>
      </nav>

      <div className="p-4 border-t border-slate-700/60">
        <div className="surface-glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-slate-400">SERVER ONLINE</span>
          </div>
          <p className="text-xs text-slate-400">v2.4.0 Stable</p>
        </div>
      </div>
      </div>
    </>
  );
};

function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
      <div className="flex min-h-screen font-sans text-slate-100">
        <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <div className="flex-1 lg:ml-72 min-w-0">
          <div className="lg:hidden sticky top-0 z-30 h-16 px-4 border-b border-slate-700/60 bg-slate-900/90 backdrop-blur flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-600 text-slate-100 hover:text-white hover:border-cyan-400/50"
              aria-label="Open navigation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <div className="text-sm font-bold text-white tracking-[0.15em] uppercase">CrickJudge</div>
            <div className="w-10"></div>
          </div>

          <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/live-matches" element={<LiveMatches />} />
            <Route path="/live-matches/:id" element={<MatchScorecard />} />
            <Route path="/series-leaderboards" element={<SeriesLeaderboards />} />
            <Route path="/player-form-tracker" element={<PlayerFormTracker />} />
            <Route path="/watchlist" element={<WatchlistDashboard />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/player/:apiId" element={<PlayerDetail />} />
            <Route path="/crickjudge" element={<CrickJudge />} />
            <Route path="/analytics" element={<AnalyticsHub />} />
            <Route path="/simulator" element={<MatchSimulator />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/venue-intelligence" element={<VenueIntelligence />} />
          </Routes>
          </div>
        </div>
      </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
