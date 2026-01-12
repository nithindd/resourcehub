import { supabase } from '../supabaseClient';
import { FaGoogle, FaMicrosoft, FaGlobe } from 'react-icons/fa';

export function Login() {
    const handleLogin = async (provider) => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                // Redirect to the current page after login
                redirectTo: window.location.origin
            }
        });
        if (error) alert(error.message);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="icon">
                    <FaGlobe size={50} />
                </div>
                <h1>Welcome Back</h1>
                <p>Sign in to access your resource capture.</p>

                <div className="login-actions">
                    <button className="btn-login google" onClick={() => handleLogin('google')}>
                        <FaGoogle /> Sign in with Google
                    </button>

                    <button className="btn-login microsoft" onClick={() => handleLogin('azure')}>
                        <FaMicrosoft /> Sign in with Microsoft
                    </button>
                </div>
            </div>

            <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--bg) 0%, #000 100%);
        }
        .login-card {
          background: var(--surface);
          padding: 3rem;
          border-radius: var(--radius-lg);
          text-align: center;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .icon {
          color: var(--primary);
          margin-bottom: 1rem;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        p {
          color: var(--color-text-muted);
          margin-bottom: 2rem;
        }
        .login-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .btn-login {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 1rem;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 1rem;
          cursor: pointer;
          font-weight: 500;
          transition: transform 0.2s, opacity 0.2s;
          color: white;
        }
        .btn-login:active {
          transform: scale(0.98);
        }
        .btn-login:hover {
          opacity: 0.9;
        }
        .btn-login.google {
          background: #DB4437;
        }
        .btn-login.microsoft {
          background: #2F2F2F; /* Microsoft Dark */
          border: 1px solid rgba(255,255,255,0.1);
        }
      `}</style>
        </div>
    );
}
