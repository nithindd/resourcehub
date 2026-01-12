import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaFile, FaFilePdf, FaFileImage, FaFileAudio, FaExternalLinkAlt, FaTimes, FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp, FaEdit, FaCheck, FaDownload } from 'react-icons/fa';

export function ResourceFeed({ session }) {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [previewResource, setPreviewResource] = useState(null);

  // Editing State
  const [editingId, setEditingId] = useState(null);
  const [tempCategoryId, setTempCategoryId] = useState(null);
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
  if (editingId) return; // Don't open if editing
  if (res.type === 'link') {
    window.open(res.content_url, '_blank');
  } else {
    setPreviewResource(res);
  }
};

const startEdit = (e, res) => {
  e.stopPropagation();
  setEditingId(res.id);
  setTempCategoryId(res.category_id);
};

const saveCategory = async (e) => {
  e.stopPropagation();
  if (!tempCategoryId) return;

  // Optimistic Update
  const updatedResources = resources.map(r =>
    r.id === editingId
      ? { ...r, category_id: Number(tempCategoryId), categories: categories.find(c => c.id == tempCategoryId) }
      : r
  );
  setResources(updatedResources);

  const idToUpdate = editingId;
  setEditingId(null);

  // API Call
  const { error } = await supabase
    .from('resources')
    .update({ category_id: tempCategoryId })
    .eq('id', idToUpdate);

  if (error) {
    console.error('Error updating category:', error);
  }
};

const cancelEdit = (e) => {
  e.stopPropagation();
  setEditingId(null);
}

const startEditDesc = (e, res) => {
  e.stopPropagation();
  setEditingDescId(res.id);
  setTempDescription(res.description || '');
};

const saveDescription = async (e) => {
  e.stopPropagation();

  // Optimistic Update
  const updatedResources = resources.map(r =>
    r.id === editingDescId
      ? { ...r, description: tempDescription }
      : r
  );
  setResources(updatedResources);

  const idToUpdate = editingDescId;
  setEditingDescId(null);

  // API Call
  const { error } = await supabase
    .from('resources')
    .update({ description: tempDescription })
    .eq('id', idToUpdate);

  if (error) {
    console.error('Error updating description:', error);
  }
};

const cancelEditDesc = (e) => {
  e.stopPropagation();
  setEditingDescId(null);
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

      {editingDescId === res.id ? (
        <div onClick={(e) => e.stopPropagation()} className="desc-edit-box">
          <textarea
            value={tempDescription}
            onChange={(e) => setTempDescription(e.target.value)}
            className="desc-input"
            rows="3"
          />
          <div className="desc-actions">
            <button className="action-btn save" onClick={saveDescription}><FaCheck /></button>
            <button className="action-btn cancel" onClick={cancelEditDesc}><FaTimes /></button>
          </div>
        </div>
      ) : (
        <div className="desc-display-wrapper">
          {res.description && <p className="res-desc">{res.description}</p>}
          {!res.description && <span className="no-desc">No description</span>}
          <button className="edit-desc-btn" onClick={(e) => startEditDesc(e, res)} title="Edit Description">
            <FaEdit />
          </button>
        </div>
      )}

      <div className="bottom-line">
        <div className="meta-left">
          <span className="res-date">
            {new Date(res.created_at).toLocaleDateString()} {new Date(res.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {res.type !== 'link' && (
            <a href={res.content_url} download onClick={(e) => e.stopPropagation()} className="download-icon" title="Download">
              <FaDownload />
            </a>
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          {editingId === res.id ? (
            <div className="edit-mode">
              <select
                value={tempCategoryId}
                onChange={(e) => setTempCategoryId(e.target.value)}
                className="mini-select"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button className="action-btn save" onClick={saveCategory}><FaCheck /></button>
              <button className="action-btn cancel" onClick={cancelEdit}><FaTimes /></button>
            </div>
          ) : (
            <div className="view-mode">
              <span className="category-tag">{res.categories?.name}</span>
              <button className="edit-cat-btn" onClick={(e) => startEdit(e, res)} title="Move Category">
                <FaEdit />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
))}
        </div >
      )
    }

{/* Preview Modal */ }
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
        .view-mode {
             display: flex;
             align-items: center;
             gap: 0.5rem;
        }
        .edit-cat-btn {
            background: none;
            border: none;
            color: var(--color-text-muted);
            cursor: pointer;
            opacity: 0.5;
            transition: opacity 0.2s;
            display: flex;
            align-items: center;
        }
        .edit-cat-btn:hover {
            opacity: 1;
            color: var(--primary);
        }
        .edit-mode {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            background: rgba(0,0,0,0.2);
            padding: 2px 5px;
            border-radius: var(--radius-sm);
        }
        .mini-select {
            background: var(--surface);
            color: white;
            border: none;
            font-size: 0.75rem;
            border-radius: 4px;
            max-width: 100px;
        }
        .action-btn {
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            padding: 2px;
            font-size: 0.8rem;
        }
        .action-btn.save { color: #4caf50; }
        .action-btn.cancel { color: #f44336; }

        .res-desc {
            font-size: 0.85rem;
            color: var(--color-text-muted);
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-align: left; /* Explicitly left aligned */
        }
        .desc-display-wrapper {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            group: desc-group;
        }
        .edit-desc-btn {
            background: none;
            border: none;
            color: var(--color-text-muted);
            opacity: 0;
            cursor: pointer;
            transition: opacity 0.2s;
            font-size: 0.7rem;
            padding: 0;
            margin-top: 2px;
        }
        .resource-card:hover .edit-desc-btn {
            opacity: 0.5;
        }
        .edit-desc-btn:hover {
            opacity: 1 !important;
            color: var(--primary);
        }
        .desc-edit-box {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            width: 100%;
        }
        .desc-input {
            width: 100%;
            background: rgba(0,0,0,0.2);
            border: 1px solid rgba(255,255,255,0.1);
            color: var(--color-text-main);
            border-radius: var(--radius-sm);
            padding: 0.5rem;
            font-size: 0.85rem;
            resize: vertical;
        }
        .no-desc {
            font-size: 0.8rem;
            font-style: italic;
            color: rgba(255,255,255,0.2);
        }

        .meta-left {
            display: flex;
            align-items: center;
            gap: 0.8rem;
        }
        .download-icon {
            background: none;
            border: none;
            color: var(--color-text-muted);
            cursor: pointer;
            opacity: 0.5;
            transition: opacity 0.2s;
            display: flex;
            align-items: center;
            font-size: 0.9rem; /* Slightly larger matching edit-cat-btn (ish) */
        }
        .download-icon:hover {
            opacity: 1;
            color: var(--primary);
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
            <div className="pdf-container">
              <iframe src={url} width="100%" height="500px" title="PDF Preview"></iframe>
              <a href={url} target="_blank" rel="noopener noreferrer" className="mobile-pdf-btn">
                Open PDF in New Tab
              </a>
            </div>
          )}
          {resource.type === 'file' && (
            <div className="pdf-container">
              {/* Try to preview with Google Docs Viewer */}
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
                width="100%"
                height="500px"
                title="Document Preview"
              ></iframe>
              <div className="file-download" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                <p style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Preview not loading?</p>
                <a href={url} download={resource.meta?.name || 'download'}>Download File</a>
              </div>
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
        .pdf-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .mobile-pdf-btn {
            display: block;
            text-align: center;
            background: var(--primary);
            color: black;
            padding: 0.8rem;
            border-radius: var(--radius-sm);
            text-decoration: none;
            font-weight: 500;
            margin-top: 0.5rem;
        }
        /* Hide regular download link in favor of button for consistency if needed, 
           but here we are styling the new button */
      `}</style>
    </div>
  );
}
