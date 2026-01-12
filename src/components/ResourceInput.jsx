import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaPaperclip, FaLink, FaCloudUploadAlt } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

export function ResourceInput({ session }) {
    const [categories, setCategories] = useState([]);
    const [activeTab, setActiveTab] = useState('file');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFiles, setSelectedFiles] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const loadCategories = async () => {
            // RLS policies ensure we only get our own data
            const { data } = await supabase.from('categories').select('*');
            setCategories(data || []);
        };
        loadCategories();
    }, [session]);

    const handleSubmit = async () => {
        if (!selectedCategoryId) {
            alert('Please select a category');
            return;
        }

        setIsUploading(true);
        try {
            if (activeTab === 'link') {
                if (!linkUrl) return;

                const { error } = await supabase.from('resources').insert([{
                    type: 'link',
                    content_url: linkUrl,
                    category_id: Number(selectedCategoryId),
                    description: description.trim(),
                    meta: { title: linkUrl },
                    user_id: session.user.id
                }]);

                if (error) throw error;
                setLinkUrl('');

            } else {
                if (!selectedFiles || selectedFiles.length === 0) return;

                for (let i = 0; i < selectedFiles.length; i++) {
                    const file = selectedFiles[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${uuidv4()}.${fileExt}`;
                    const filePath = `${session.user.id}/${fileName}`; // Organize by user_id

                    // Upload to Storage
                    const { error: uploadError } = await supabase.storage
                        .from('resources')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    // Get Public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('resources')
                        .getPublicUrl(filePath);

                    // Save to Database
                    const { error: dbError } = await supabase.from('resources').insert([{
                        type: file.type.startsWith('image/') ? 'image' :
                            file.type.startsWith('audio/') ? 'audio' :
                                file.type === 'application/pdf' ? 'pdf' : 'file',
                        content_url: publicUrl,
                        category_id: Number(selectedCategoryId),
                        description: description.trim(),
                        meta: { name: file.name, size: file.size, mimeType: file.type, path: filePath },
                        user_id: session.user.id
                    }]);

                    if (dbError) throw dbError;
                }
                setSelectedFiles(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
            setDescription(''); // Reset description
            alert('Saved!');
        } catch (err) {
            console.error('Error saving resource:', err);
            alert('Error saving resource: ' + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="resource-input">
            <h3>Add Resource</h3>

            <div className="input-tabs">
                <button
                    className={activeTab === 'file' ? 'active' : ''}
                    onClick={() => setActiveTab('file')}
                >
                    <FaPaperclip /> File
                </button>
                <button
                    className={activeTab === 'link' ? 'active' : ''}
                    onClick={() => setActiveTab('link')}
                >
                    <FaLink /> Link
                </button>
            </div>

            <div className="input-area">
                {activeTab === 'link' ? (
                    <input
                        type="url"
                        placeholder="https://example.com..."
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="full-width-input"
                    />
                ) : (
                    <div className="file-drop-area" onClick={() => fileInputRef.current.click()}>
                        <input
                            type="file"
                            multiple
                            onChange={(e) => setSelectedFiles(e.target.files)}
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                        />
                        <FaCloudUploadAlt size={30} />
                        <p>{selectedFiles ? `${selectedFiles.length} files selected` : 'Click to select files'}</p>
                    </div>
                )}

                <textarea
                    placeholder="Add a description (optional)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="full-width-input description-area"
                    rows="2"
                />
            </div>

            <div className="actions-row">
                <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="category-select"
                >
                    <option value="">Select Category...</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                <button onClick={handleSubmit} disabled={isUploading} className="btn-submit">
                    {isUploading ? 'Uploading...' : 'Save Resource'}
                </button>
            </div>

            <style>{`
        .resource-input {
          background: var(--surface);
          padding: 1.5rem;
          border-radius: var(--radius-md);
          margin-bottom: 2rem;
        }
        .input-tabs {
          display: flex;
          margin-bottom: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .input-tabs button {
          flex: 1;
          padding: 0.8rem;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .input-tabs button.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }
        .full-width-input {
          width: 100%;
          box-sizing: border-box;
          padding: 1rem;
          margin-bottom: 1rem;
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          border-radius: var(--radius-sm);
        }
        .file-drop-area {
          border: 2px dashed rgba(255,255,255,0.2);
          padding: 2rem;
          text-align: center;
          border-radius: var(--radius-sm);
          cursor: pointer;
          margin-bottom: 1rem;
          transition: background 0.2s;
        }
        .file-drop-area:hover {
          background: rgba(255,255,255,0.05);
        }
        .actions-row {
          display: flex;
          gap: 1rem;
        }
        .category-select {
          flex: 1;
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 0.8rem;
          border-radius: var(--radius-sm);
        }
        .btn-submit {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-weight: bold;
        }
        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
        </div>
    );
}
