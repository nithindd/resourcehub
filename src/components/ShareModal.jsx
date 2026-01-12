import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaTimes, FaCopy, FaUserPlus, FaTrash, FaGlobe, FaLock, FaEnvelope } from 'react-icons/fa';

export function ShareModal({ resource, onClose }) {
    const [isPublic, setIsPublic] = useState(resource.is_public || false);
    const [shares, setShares] = useState([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [copySuccess, setCopySuccess] = useState('');

    const shareUrl = `${window.location.origin}/?share=${resource.id}`;

    useEffect(() => {
        fetchShares();
    }, [resource.id]);

    const fetchShares = async () => {
        const { data, error } = await supabase
            .from('resource_shares')
            .select('*')
            .eq('resource_id', resource.id);

        if (!error) setShares(data || []);
    };

    const togglePublic = async () => {
        const newValue = !isPublic;
        setIsPublic(newValue);

        const { error } = await supabase
            .from('resources')
            .update({ is_public: newValue })
            .eq('id', resource.id);

        if (error) {
            console.error('Error updating public status:', error);
            setIsPublic(!newValue); // Revert on error
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
    };

    const inviteUser = async (e) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setLoading(true);

        // Check if already shared
        if (shares.some(s => s.user_email === inviteEmail)) {
            alert('User already has access');
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('resource_shares')
            .insert({
                resource_id: resource.id,
                user_email: inviteEmail
            })
            .select();

        if (error) {
            console.error('Error inviting user:', error);
            alert('Failed to invite user');
        } else {
            setShares([...shares, ...data]);
            setInviteEmail('');
        }
        setLoading(false);
    };

    const removeShare = async (id) => {
        const { error } = await supabase
            .from('resource_shares')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error removing share:', error);
        } else {
            setShares(shares.filter(s => s.id !== id));
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content share-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}><FaTimes /></button>

                <h3>Share "{resource.meta?.title || 'Resource'}"</h3>

                {/* Public Link Section */}
                <div className="share-section">
                    <div className="section-header">
                        <div className="icon-label">
                            {isPublic ? <FaGlobe className="icon-public" /> : <FaLock className="icon-private" />}
                            <span>{isPublic ? 'Public access is ON' : 'Private - Only invited people can access'}</span>
                        </div>
                        <label className="switch">
                            <input type="checkbox" checked={isPublic} onChange={togglePublic} />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    {isPublic && (
                        <div className="link-copy-box">
                            <input type="text" value={shareUrl} readOnly />
                            <button onClick={handleCopy}>
                                {copySuccess || <FaCopy />}
                            </button>
                        </div>
                    )}
                </div>

                <hr className="divider" />

                {/* Invite Section */}
                <div className="share-section">
                    <h4>Invite People</h4>
                    <form onSubmit={inviteUser} className="invite-form">
                        <div className="input-group">
                            <FaEnvelope className="input-icon" />
                            <input
                                type="email"
                                placeholder="Enter email address"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} className="invite-btn">
                            {loading ? 'Adding...' : <><FaUserPlus /> Add</>}
                        </button>
                    </form>
                </div>

                {/* Access List */}
                <div className="share-section access-list-section">
                    <h4>Who has access</h4>
                    <div className="access-list">
                        <div className="access-item owner">
                            <div className="user-info">
                                <div className="avatar-placeholder">You</div>
                                <span>You (Owner)</span>
                            </div>
                        </div>
                        {shares.map(share => (
                            <div key={share.id} className="access-item">
                                <div className="user-info">
                                    <div className="avatar-placeholder">{share.user_email[0].toUpperCase()}</div>
                                    <span>{share.user_email}</span>
                                </div>
                                <button className="remove-btn" onClick={() => removeShare(share.id)} title="Remove Access">
                                    <FaTrash />
                                </button>
                            </div>
                        ))}
                        {shares.length === 0 && (
                            <p className="no-shares">No one else has access yet.</p>
                        )}
                    </div>
                </div>

            </div>

            <style>{`
        .share-modal {
            max-width: 500px;
        }
        .share-section {
            margin-bottom: 1.5rem;
        }
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        .icon-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
        }
        .icon-public { color: #4caf50; }
        .icon-private { color: var(--color-text-muted); }

        /* Toggle Switch */
        .switch {
            position: relative;
            display: inline-block;
            width: 40px;
            height: 24px;
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: #333;
            transition: .4s;
            border-radius: 24px;
        }
        .slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        input:checked + .slider {
            background-color: var(--primary);
        }
        input:checked + .slider:before {
            transform: translateX(16px);
        }

        /* Link Box */
        .link-copy-box {
            display: flex;
            gap: 0.5rem;
            background: rgba(0,0,0,0.2);
            padding: 0.5rem;
            border-radius: var(--radius-sm);
        }
        .link-copy-box input {
            flex: 1;
            background: none;
            border: none;
            color: var(--color-text-muted);
            font-size: 0.85rem;
            outline: none;
        }
        .link-copy-box button {
            background: none;
            border: none;
            color: var(--primary);
            cursor: pointer;
            font-weight: bold;
        }

        .divider {
            border: 0;
            border-top: 1px solid rgba(255,255,255,0.1);
            margin: 1.5rem 0;
        }

        /* Invite Form */
        .invite-form {
            display: flex;
            gap: 0.5rem;
        }
        .input-group {
            flex: 1;
            display: flex;
            align-items: center;
            background: var(--bg);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: var(--radius-sm);
            padding: 0 0.8rem;
        }
        .input-icon { color: var(--color-text-muted); margin-right: 0.5rem; }
        .input-group input {
            flex: 1;
            background: none;
            border: none;
            padding: 0.8rem 0;
            color: white;
            outline: none;
        }
        .invite-btn {
            background: var(--primary);
            color: black;
            border: none;
            border-radius: var(--radius-sm);
            padding: 0 1rem;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .invite-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        /* Access List */
        .access-list {
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            max-height: 200px;
            overflow-y: auto;
        }
        .access-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem;
            background: rgba(255,255,255,0.02);
            border-radius: var(--radius-sm);
        }
        .user-info {
            display: flex;
            align-items: center;
            gap: 0.8rem;
        }
        .avatar-placeholder {
            width: 30px;
            height: 30px;
            background: var(--primary);
            color: black;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 0.8rem;
        }
        .remove-btn {
            background: none;
            border: none;
            color: var(--color-text-muted);
            cursor: pointer;
            transition: color 0.2s;
        }
        .remove-btn:hover { color: #f44336; }
        .no-shares {
            font-size: 0.85rem;
            color: var(--color-text-muted);
            font-style: italic;
            text-align: center;
            padding: 1rem;
        }
      `}</style>
        </div>
    );
}
