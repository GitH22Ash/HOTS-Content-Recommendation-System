import React, { useMemo } from 'react';
import { Home, Flame, Search, Tv, Library, Mic, Settings, UserCircle } from 'lucide-react';
import { ottPlatforms } from '../data/mockData';

// FIX: Added showNotificationModal to props
const Navigation = React.memo(({ currentPage, setCurrentPage, onAppIconClick, onSettingsClick, onProfileClick, showNotificationModal }) => {
  const navItems = useMemo(() => [
    { name: 'Home', icon: <Home size={20} />, page: 'Home' },
    { name: 'Hots', icon: <Flame size={20} />, page: 'HotsPage' }, 
    { name: 'Find', icon: <Search size={20} />, page: 'Find' },
    { name: 'Live TV', icon: <Tv size={20} />, page: 'LiveTV' },
    { name: 'Library', icon: <Library size={20} />, page: 'Library' },
  ], []);

  const appShortcuts = useMemo(() => ottPlatforms.slice(0,4).map(p => ({ 
      name: p.name, logo: p.logoUrl.replace('150x80', '60x30'), page: p.page 
  })), []);

  return (
    <nav className="bg-black bg-opacity-80 p-3 md:p-4 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-4">
          <img src="/logo.png" alt="HOTS Logo" className="h-6 md:h-8 w-auto mr-2 md:mr-4 cursor-pointer" onClick={() => setCurrentPage('Home')} />
          <button onClick={onProfileClick} className="p-1 rounded-full text-red-500 hover:text-red-400 transition-colors" aria-label="User Profile">
            <UserCircle size={28} />
          </button>
          {navItems.map((item) => (
            <button key={item.name} onClick={() => setCurrentPage(item.page)}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs sm:text-sm md:text-base font-medium transition-colors 
                          ${currentPage === item.page ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700/50'}`}
              aria-current={currentPage === item.page ? 'page' : undefined}>
                {item.icon} <span>{item.name}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-1 md:space-x-3">
          {appShortcuts.map((app) => (
            <button key={app.name} onClick={() => onAppIconClick(app.page, app.name)} aria-label={`Open ${app.name}`} className="p-0.5 rounded-sm transition-all hover:opacity-80">
                <img src={app.logo} alt={`${app.name} logo`} className="h-5 md:h-7 w-auto rounded-sm" />
            </button>
          ))}
          {/* FIX: Updated onClick to use the new function */}
          <button 
            className="text-gray-300 hover:text-white p-1 rounded-md hover:bg-gray-700/50" 
            aria-label="Search with voice" 
            onClick={() => showNotificationModal('Voice Search', 'Voice search functionality would be integrated here.')}>
            <Mic size={20} />
          </button>
          <button onClick={onSettingsClick} className="text-gray-300 hover:text-white p-1 rounded-md hover:bg-gray-700/50" aria-label="Settings">
            <Settings size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
});

export default Navigation;
