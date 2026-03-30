import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Home, Flame, Search, Tv, Library, Mic, Settings, UserCircle, X } from 'lucide-react';
import { ottPlatforms } from '../data/mockData';
import gsap from 'gsap';

const Navigation = React.memo(({ currentPage, setCurrentPage, onAppIconClick, onSettingsClick, onProfileClick, showNotificationModal }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  const navRef = useRef(null);

  const navItems = useMemo(() => [
    { name: 'Home', icon: <Home size={18} />, page: 'Home' },
    { name: 'Hots', icon: <Flame size={18} />, page: 'HotsPage' },
    { name: 'Find', icon: <Search size={18} />, page: 'Find' },
    { name: 'Live TV', icon: <Tv size={18} />, page: 'LiveTV' },
    { name: 'Library', icon: <Library size={18} />, page: 'Library' },
  ], []);

  const appShortcuts = useMemo(() => ottPlatforms.slice(0, 4).map(p => ({
    name: p.name, logo: p.logoUrl.replace('150x80', '60x30'), page: p.page
  })), []);

  // Animate nav on mount
  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(navRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
    }
  }, []);

  const toggleSearch = useCallback(() => {
    if (searchOpen) {
      setSearchTerm('');
    }
    setSearchOpen(prev => !prev);
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  return (
    <nav ref={navRef} className="nav-bar">
      <div className="nav-container">
        {/* Left section: Logo + Nav links */}
        <div className="nav-left">
          <img 
            src="/logo.png" 
            alt="HOTS Logo" 
            className="nav-logo"
            onClick={() => setCurrentPage('Home')}
          />
          {navItems.map((item) => (
            <button 
              key={item.name} 
              onClick={() => setCurrentPage(item.page)}
              className={`nav-item ${currentPage === item.page ? 'nav-item--active' : ''}`}
              aria-current={currentPage === item.page ? 'page' : undefined}
            >
              {item.icon} <span>{item.name}</span>
            </button>
          ))}
        </div>

        {/* Right section: App shortcuts + Voice + Settings + Profile */}
        <div className="nav-right">
          {appShortcuts.map((app) => (
            <button 
              key={app.name} 
              onClick={() => onAppIconClick(app.page, app.name)} 
              aria-label={`Open ${app.name}`} 
              className="nav-app-shortcut"
            >
              <img src={app.logo} alt={`${app.name} logo`} />
            </button>
          ))}
          <button
            className="nav-icon-btn"
            aria-label="Search with voice"
            onClick={() => showNotificationModal('Voice Search', 'Voice search functionality would be integrated here.')}
          >
            <Mic size={18} />
          </button>
          <button onClick={onSettingsClick} className="nav-icon-btn" aria-label="Settings">
            <Settings size={18} />
          </button>
          <button onClick={onProfileClick} className="nav-profile-btn" aria-label="User Profile">
            <UserCircle size={26} />
          </button>
        </div>
      </div>
    </nav>
  );
});

export default Navigation;
