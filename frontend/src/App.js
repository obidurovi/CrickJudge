import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CrickJudge from './pages/CrickJudge'; // Import the new page

// Sidebar Component
const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white';

  return (
    <div className="w-64 bg-slate-900 h-screen fixed left-0 top-0 border-r border-slate-800 flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">CrickJudge</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/')}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
          Dashboard
        </Link>
        {/* Updated Link */}
        <Link to="/crickjudge" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/crickjudge')}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          CrickJudge
        </Link>
      </nav>

      <div className="p-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-slate-400">SERVER ONLINE</span>
          </div>
          <p className="text-xs text-slate-500">v2.4.0 Stable</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="flex bg-slate-950 min-h-screen font-sans">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {/* Updated Route */}
            <Route path="/crickjudge" element={<CrickJudge />} /> {/* Add this line */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
