import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Login } from './components/Login';
import { CategoryManager } from './components/CategoryManager';
import { ResourceInput } from './components/ResourceInput';
import { ResourceFeed } from './components/ResourceFeed';
import { FaList, FaPlusCircle, FaTags, FaSignOutAlt } from 'react-icons/fa';

function App() {
  const [session, setSession] = useState(null);
  const [activeView, setActiveView] = useState('feed'); // feed, add, categories

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Resource Capture</h1>
        <button className="logout-btn" onClick={handleLogout} title="Sign Out">
          <FaSignOutAlt />
        </button>
      </header>

      <main className="app-content">
        {activeView === 'feed' && <ResourceFeed key={session.user.id} session={session} />}
        {activeView === 'add' && <ResourceInput key={session.user.id} session={session} />}
        {activeView === 'categories' && <CategoryManager key={session.user.id} session={session} />}
      </main>

      <nav className="bottom-nav">
        <button
          className={activeView === 'feed' ? 'active' : ''}
          onClick={() => setActiveView('feed')}
        >
          <FaList />
          <span>Feed</span>
        </button>
        <button
          className={activeView === 'add' ? 'active' : ''}
          onClick={() => setActiveView('add')}
        >
          <FaPlusCircle size={24} />
          <span>Add</span>
        </button>
        <button
          className={activeView === 'categories' ? 'active' : ''}
          onClick={() => setActiveView('categories')}
        >
          <FaTags />
          <span>Categories</span>
        </button>
      </nav>

      <style>{`
        .app-container {
          padding-bottom: 80px; /* Space for bottom nav */
        }
        .app-header {
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .app-header h1 {
          font-size: 1.5rem;
          margin: 0;
          background: linear-gradient(135deg, #fff 0%, #aaa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .logout-btn {
            background: rgba(255,255,255,0.1);
            border: none;
            color: white;
            padding: 0.5rem;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 60px;
          background: rgba(20, 20, 30, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          border-top: 1px solid rgba(255,255,255,0.1);
          justify-content: space-around;
          align-items: center;
          z-index: 100;
        }
        .bottom-nav button {
          background: none;
          border: none;
          color: var(--color-text-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 0.75rem;
          gap: 4px;
          cursor: pointer;
          width: 100%;
          height: 100%;
          justify-content: center;
        }
        .bottom-nav button.active {
          color: var(--primary);
        }
        .bottom-nav button svg {
          font-size: 1.2rem;
        }
        
        /* Desktop tweaks */
        @media (min-width: 768px) {
          .app-container {
            max-width: 600px; /* Constrain width on desktop to mimic mobile app feel */
            margin: 0 auto;
            border-left: 1px solid rgba(255,255,255,0.05);
            border-right: 1px solid rgba(255,255,255,0.05);
            min-height: 100vh;
            padding: 2rem;
            padding-bottom: 80px; 
          }
          .bottom-nav {
            max-width: 600px;
            left: 50%;
            transform: translateX(-50%);
            border-left: 1px solid rgba(255,255,255,0.05);
            border-right: 1px solid rgba(255,255,255,0.05);
          }
        }
      `}</style>
    </div>
  )
}

export default App
