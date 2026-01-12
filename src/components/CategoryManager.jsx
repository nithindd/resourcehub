import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaTrash, FaEdit, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';

export function CategoryManager({ session }) {
    const [categories, setCategories] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    // Fetch Categories
    const fetchCategories = async () => {
        // RLS policies ensure we only get our own data
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) console.error('Error fetching categories:', error);
        else setCategories(data || []);
    };

    useEffect(() => {
        fetchCategories();
    }, [session]);

    const handleAdd = async () => {
        if (!newCategoryName.trim()) return;

        const { error } = await supabase
            .from('categories')
            .insert([{
                name: newCategoryName.trim(),
                user_id: session?.user?.id
            }]);

        if (error) {
            console.error('Error adding category:', error);
            alert('Failed to add category');
        } else {
            setNewCategoryName('');
            setIsAdding(false);
            fetchCategories();
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this category? Resources will not be deleted but will lose their category association.')) {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting:', error);
                alert('Failed to delete');
            } else {
                fetchCategories();
            }
        }
    };

    const startEdit = (cat) => {
        setEditingId(cat.id);
        setEditName(cat.name);
    };

    const saveEdit = async () => {
        if (editName.trim()) {
            const { error } = await supabase
                .from('categories')
                .update({ name: editName })
                .eq('id', editingId);

            if (error) {
                alert('Failed to update');
            } else {
                fetchCategories();
            }
        }
        setEditingId(null);
    };

    return (
        <div className="category-manager">
            <div className="header-row">
                <h3>Categories</h3>
                <button className="btn-icon" onClick={() => setIsAdding(!isAdding)}>
                    <FaPlus />
                </button>
            </div>

            {isAdding && (
                <div className="add-row">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New Category Name"
                        autoFocus
                    />
                    <button onClick={handleAdd} className="btn-primary">Add</button>
                </div>
            )}

            <ul className="category-list">
                {categories.map(cat => (
                    <li key={cat.id} className="category-item">
                        {editingId === cat.id ? (
                            <div className="edit-row">
                                <input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                                <button onClick={saveEdit}><FaCheck /></button>
                                <button onClick={() => setEditingId(null)}><FaTimes /></button>
                            </div>
                        ) : (
                            <>
                                <span className="cat-name">{cat.name}</span>
                                <div className="actions">
                                    <button onClick={() => startEdit(cat)}><FaEdit /></button>
                                    <button onClick={() => handleDelete(cat.id)} className="btn-danger"><FaTrash /></button>
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ul>

            <style>{`
        .category-manager {
          background: var(--surface);
          padding: 1.5rem;
          border-radius: var(--radius-md);
          margin-bottom: 2rem;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .category-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .category-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          background: rgba(255,255,255,0.05);
          margin-bottom: 0.5rem;
          border-radius: var(--radius-sm);
          align-items: center;
        }
        .actions button {
          margin-left: 0.5rem;
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
        }
        .actions button:hover {
          color: var(--color-text-main);
        }
        .btn-danger:hover {
          color: #ff4d4d !important;
        }
        .add-row, .edit-row {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        input {
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          flex: 1;
        }
        .btn-primary {
          background: var(--primary);
          border: none;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }
      `}</style>
        </div>
    );
}
