import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaFile, FaFilePdf, FaFileImage, FaFileAudio, FaExternalLinkAlt, FaTimes, FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';

export function ResourceFeed({ session }) {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [previewResource, setPreviewResource] = useState(null);

  // Discovery State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Resources
      const { data: resData, error: resError } = await supabase
        .from('resources')
        .select(`
                *,
                categories ( id, name )
            `)
        .order('created_at', { ascending: false });

      if (resError) console.error('Error fetching resources:', resError);
      else setResources(resData || []);

      // Fetch Categories for Filter
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (catError) console.error('Error fetching categories:', catError);
      else setCategories(catData || []);
    };
    fetchData();
  }, [session, resources.length]); // Re-fetch on mount and length change (simple invalidation)

  const getIcon = (type) => {
    if (type === 'image') return <FaFileImage />;
    if (type === 'pdf') return <FaFilePdf />;
    if (type === 'audio') return <FaFileAudio />;
    if (type === 'link') return <FaExternalLinkAlt />;
    return <FaFile />;
  };

  const getTypeBadgeClass = (type) => {
    if (type === 'image') return 'badge-image';
    if (type === 'pdf') return 'badge-pdf';
    if (type === 'audio') return 'badge-audio';
    if (type === 'link') return 'badge-link';
    return 'badge-file';
  };

  const openPreview = (res) => {
    if (res.type === 'link') {
      window.open(res.content_url, '_blank');
    } else {
      setPreviewResource(res);
    }
  };

  // Filter and Sort Logic
  const filteredResources = resources
    .filter(res => {
      const matchesSearch = (res.meta?.name || res.meta?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (res.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory ? res.category_id === Number(filterCategory) : true;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="resource-feed">
      {/* App Summary & Stats */}
      <div className="app-summary">
        <h4>Dashboard Overview</h4>
        <table className="summary-table">
          <tbody>
            <tr>
              <td colSpan="2" style={{ paddingBottom: '1rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                Centralized storage for links, files, and documents across Google accounts.
              </td>
            </tr>
            <tr>
              <td><strong>Total Resources</strong></td>
              <td>{resources.length}</td>
            </tr>
            <tr>
              <td><strong>Categories</strong></td>
              <td>{categories.length}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Your Resources</h3>

      {/* Discovery Controls */}
      <div className="discovery-bar">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-wrapper">
          <FaFilter className="filter-icon" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <button
          className="sort-btn"
          onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
          title="Toggle Sort Order"
        >
          {sortOrder === 'newest' ? <FaSortAmountDown /> : <FaSortAmountUp />}
        </button>
      </div>

      {
        !filteredResources || filteredResources.length === 0 ? (
          <p className="empty-state">No resources match your filters.</p>
        ) : (
          <div className="feed-list">
            {filteredResources.map(res => (
              <div key={res.id} className="resource-card" onClick={() => openPreview(res)}>
                <div className="icon-wrapper">
                  {getIcon(res.type)}
                </div>
                <div className="details">
                  <div className="top-line">
                    <span className="res-name">
                      {res.meta?.name || res.meta?.title || res.content_url.substring(0, 30)}
                    </span>
                    <div className="badges">
                      <span className={`type-badge ${getTypeBadgeClass(res.type)}`}>{res.type.toUpperCase()}</span>
                    </div>
                  </div>

                  {res.description && <p className="res-desc">{res.description}</p>}

                  <div className="bottom-line">
                    <span className="res-date">
                      {new Date(res.created_at).toLocaleDateString()} {new Date(res.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="category-tag">{res.categories?.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Preview Modal */}
      {
        previewResource && (
          <PreviewModal
            resource={previewResource}
            onClose={() => setPreviewResource(null)}
          />
        )
      }

      <style>{`
        .discovery-bar {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            background: rgba(255,255,255,0.05);
            padding: 0.8rem;
            border-radius: var(--radius-md);
            flex-wrap: wrap;
        }
        .search-wrapper, .filter-wrapper {
            display: flex;
            align-items: center;
            background: rgba(0,0,0,0.2);
            border-radius: var(--radius-sm);
            padding: 0 0.5rem;
            flex: 1;
            min-width: 120px;
        }
        .search-wrapper input, .filter-wrapper select {
            background: none;
            border: none;
            color: white;
            padding: 0.5rem;
            width: 100%;
            outline: none;
        }
        .filter-wrapper select option {
            background-color: var(--surface);
            color: white;
        }
        .search-icon, .filter-icon {
            color: var(--color-text-muted);
            margin-right: 0.5rem;
        }
        .sort-btn {
            background: rgba(0,0,0,0.2);
            border: none;
            color: var(--primary);
            width: 40px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .empty-state {
          text-align: center;
          color: var(--color-text-muted);
          padding: 2rem;
        }
        .feed-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .resource-card {
          display: flex;
          align-items: flex-start; /* Changed to align items to top */
          padding: 1rem;
          background: var(--surface);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
        }
        .resource-card:active {
          transform: scale(0.98);
        }
        .resource-card:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .icon-wrapper {
          font-size: 1.5rem;
          margin-right: 1rem;
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 50%;
          flex-shrink: 0;
        }
        .details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          min-width: 0; /* Fix flex text overflow */
        }
        .top-line {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .res-name {
          font-weight: 500;
          word-break: break-all;
          line-height: 1.2;
        }
        .res-desc {
            font-size: 0.85rem;
            color: var(--color-text-muted);
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .bottom-line {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 0.2rem;
        }
        .res-date {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }
        .badges {
            display: flex;
            gap: 0.3rem;
        }
        .type-badge {
            font-size: 0.6rem;
            padding: 0.1rem 0.3rem;
            border-radius: 3px;
            font-weight: bold;
            color: #1a1a1a;
        }
        .badge-pdf { background: #ff9999; }
        .badge-image { background: #99ccff; }
        .badge-audio { background: #cc99ff; }
        .badge-link { background: #99ff99; }
        .badge-file { background: #e0e0e0; }

        .category-tag {
          font-size: 0.7rem;
          background: rgba(var(--color-primary-h), 50%, 50%, 0.2);
          color: var(--primary);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
        }

        .app-summary {
            background: rgba(255,255,255,0.03);
            border-radius: var(--radius-md);
            padding: 1rem;
            margin-bottom: 2rem;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .app-summary h4 {
            margin-top: 0;
            margin-bottom: 0.8rem;
            color: var(--primary);
        }
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
        }
        .summary-table td {
            padding: 0.5rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .summary-table tr:last-child td {
            border-bottom: none;
        }
        .summary-table td:first-child {
            color: var(--color-text-muted);
            width: 140px;
        }
      `}</style>
    </div >
  );
}

function PreviewModal({ resource, onClose }) {
  const url = resource.content_url;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><FaTimes /></button>
        <h3>Preview</h3>
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>{resource.meta?.name || resource.meta?.title}</p>
        <div className="preview-body">
          {resource.type === 'image' && <img src={url} alt="preview" />}
          {resource.type === 'audio' && <audio controls src={url} />}
          {resource.type === 'pdf' && (
            <iframe src={url} width="100%" height="500px"></iframe>
          )}
          {resource.type === 'file' && (
            <div className="file-download">
              <p>Cannot preview this file type.</p>
              <a href={url} download={resource.meta?.name || 'download'}>Download File</a>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-content {
          background: var(--bg);
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.2rem;
          color: var(--color-text-main);
          cursor: pointer;
        }
        .preview-body img {
          max-width: 100%;
          border-radius: var(--radius-md);
        }
        .preview-body audio {
          width: 100%;
        }
        .file-download {
          text-align: center;
          padding: 2rem;
          background: var(--surface);
          border-radius: var(--radius-md);
        }
        .file-download a {
          color: var(--primary);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
