import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from './services/supabase';

// Components
import Navigation from './components/Navigation';
import Modal from './components/Modal';

// Pages
import HomePage from './pages/HomePage';
import LiveTVPage from './pages/LiveTVPage';
import FindPage from './pages/FindPage';
import LibraryPage from './pages/LibraryPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import NetflixPage from './pages/NetflixPage';
import YouTubePage from './pages/YouTubePage';
import GenericOttPage from './pages/GenericOttPage';
import HotsPage from './pages/HotsPage';

// Data
import { getMovies, featuredContentDefault } from './data/mockData';

// --- localStorage helpers for view history persistence ---
const HISTORY_STORAGE_KEY = 'fire_tv_view_history';
const getStoredHistory = () => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};
const storeHistory = (history) => {
  try {
    // Keep only the last 100 entries in localStorage
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 100)));
  } catch { /* localStorage might be full */ }
};

function App() {
  const [currentPage, setCurrentPage] = useState('Home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Notification');
  const [modalMessage, setModalMessage] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [viewHistory, setViewHistory] = useState(() => getStoredHistory());

  // Movie data state
  const [mockMovies, setMockMovies] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Load movie data on startup
  useEffect(() => {
    getMovies()
      .then(data => {
        setMockMovies(data);
        setIsDataLoading(false);
      })
      .catch(error => {
        console.error("Failed to load movie data:", error);
        setIsDataLoading(false);
      });
  }, []);

  // Persist view history to localStorage whenever it changes
  useEffect(() => {
    storeHistory(viewHistory);
  }, [viewHistory]);

  // --- Supabase Auth State Listener ---
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // No Supabase configured — run in offline/guest mode
      setCurrentUserId('guest-' + Date.now());
      setIsAuthReady(true);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        setUserEmail(session.user.email || null);
      } else {
        // Sign in anonymously for guest users
        supabase.auth.signInAnonymously().catch(err => {
          console.error("Anonymous sign-in failed:", err);
        });
      }
      setIsAuthReady(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        setUserEmail(session.user.email || null);
        if (currentPage === 'Login' && session.user.email) {
          setCurrentPage('Home');
        }
      } else {
        setCurrentUserId(null);
        setUserEmail(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, [currentPage]);

  const likedItems = useMemo(
    () => new Set(viewHistory.filter(item => item.isLiked).map(item => item.contentId)),
    [viewHistory]
  );

  const showNotificationModal = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleInteraction = useCallback(async (item, action = 'viewed', extraData = {}) => {
    if (!currentUserId || !item?.id) return;
    if (action === 'viewed_hot') return;

    try {
      const interactionData = {
        userId: currentUserId,
        contentId: String(item.id),
        contentType: item.type || 'unknown',
        title: item.title,
        action: action,
        timestamp: new Date().toISOString(),
        ...extraData,
      };

      // Store to Supabase if configured
      if (isSupabaseConfigured()) {
        supabase.from('view_history').insert([{
          user_id: currentUserId,
          content_id: String(item.id),
          content_type: item.type || 'unknown',
          title: item.title,
          action: action,
          metadata: extraData,
        }]).then(({ error }) => {
          if (error) console.warn("Failed to save to Supabase:", error.message);
        });
      }

      // Always update local state + localStorage
      setViewHistory(prev => [interactionData, ...prev]);
    } catch (error) {
      console.error("Failed to save interaction:", error);
    }
  }, [currentUserId]);

  const handleItemClick = useCallback((item, action = 'details') => {
    if (!item || !item.title) {
      showNotificationModal("Error", "Cannot display details for this item.");
      return;
    }
    if (action === 'comment_hot') {
      showNotificationModal("Coming Soon!", "Comments are not yet implemented.");
      return;
    }
    setSelectedItem(item);
    setModalMessage(`Description: ${item.description}\nCast: ${item.cast}`);
    setModalTitle(item.title);
    setIsModalOpen(true);
    handleInteraction(item, action);
  }, [handleInteraction]);

  const handleAppIconClick = useCallback((page, appName) => {
    if (page) {
      setCurrentPage(page);
    } else {
      showNotificationModal(appName, `This app page for ${appName} is not yet implemented.`);
    }
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const featuredContent = useMemo(() => {
    if (mockMovies.length === 0) return featuredContentDefault;
    if (viewHistory.length > 0 && viewHistory[0].contentId) {
      const lastWatched = mockMovies.find(m => m.id === viewHistory[0].contentId);
      if (lastWatched) return lastWatched;
    }
    return mockMovies.find(m => m.id === '693134') || mockMovies[0] || featuredContentDefault;
  }, [viewHistory, mockMovies]);

  const renderPage = () => {
    const pageProps = { mockMovies, onItemClick: handleItemClick, setCurrentPage };

    switch (currentPage) {
      case 'Home': return <HomePage viewHistory={viewHistory} onItemClick={handleItemClick} featuredContent={featuredContent} onPlatformClick={handleAppIconClick} mockMovies={mockMovies} />;
      case 'LiveTV': return <LiveTVPage {...pageProps} />;
      case 'Find': return <FindPage {...pageProps} />;
      case 'Library': return <LibraryPage {...pageProps} />;
      case 'Login': return <LoginPage setCurrentPage={setCurrentPage} showNotificationModal={showNotificationModal} />;
      case 'SettingsPage': return <SettingsPage viewHistory={viewHistory} currentUserId={currentUserId} userEmail={userEmail} />;
      case 'NetflixPage': return <NetflixPage {...pageProps} />;
      case 'YouTubePage': return <YouTubePage {...pageProps} />;
      case 'HuluPage': return <GenericOttPage {...pageProps} platformName="Hulu" />;
      case 'PrimePage': return <GenericOttPage {...pageProps} platformName="Prime Video" />;
      case 'DisneyPlusPage': return <GenericOttPage {...pageProps} platformName="Disney+" />;
      case 'HotstarPage': return <GenericOttPage {...pageProps} platformName="Hotstar" />;
      case 'HotsPage': return <HotsPage onItemClick={handleItemClick} handleInteraction={handleInteraction} setCurrentPage={setCurrentPage} likedItems={likedItems} mockMovies={mockMovies} />;
      default: return <HomePage viewHistory={viewHistory} onItemClick={handleItemClick} featuredContent={featuredContent} onPlatformClick={handleAppIconClick} mockMovies={mockMovies} />;
    }
  };

  if (!isAuthReady || isDataLoading) {
    return (
      <div className="bg-black min-h-screen flex flex-col items-center justify-center text-white">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-red-500 animate-spin"></div>
        </div>
        <p className="text-xl font-medium text-gray-300">Loading Fire TV</p>
        <p className="text-sm text-gray-500 mt-2">Preparing your personalized experience...</p>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-gray-100 font-sans">
      <Navigation
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onAppIconClick={handleAppIconClick}
        onSettingsClick={() => setCurrentPage('SettingsPage')}
        onProfileClick={() => setCurrentPage('Login')}
        showNotificationModal={showNotificationModal}
      />
      <main className="pb-12">
        {renderPage()}
      </main>
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalTitle}
        selectedItem={selectedItem}
      >
        {modalMessage}
      </Modal>
      <footer className="text-center p-6 text-gray-500 text-sm border-t border-gray-800">
        HOTS-Content Recommendation System
      </footer>
    </div>
  );
}

export default App;
