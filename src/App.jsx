import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "notes-app-data";

function App() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Load from localStorage on first render
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch {
        console.error("Failed to parse notes from localStorage");
      }
    }
  }, []);

  // Save to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() && !body.trim()) return;

    const now = new Date().toISOString();

    if (editingId) {
      // Update existing note
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingId
            ? { ...n, title, body, updatedAt: now }
            : n
        )
      );
    } else {
      // Create new note
      const newNote = {
        id: crypto.randomUUID(),
        title: title.trim() || "Untitled",
        body: body.trim(),
        pinned: false,
        favorite: false,           // ⭐ NEW: favorite flag
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => [newNote, ...prev]);
    }

    resetForm();
  };

  const handleDelete = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (editingId === id) resetForm();
  };

  const handleEdit = (note) => {
    setTitle(note.title);
    setBody(note.body);
    setEditingId(note.id);
  };

  const togglePin = (id) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() }
          : n
      )
    );
  };

  // ⭐ NEW: toggle favorite
  const toggleFavorite = (id) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, favorite: !n.favorite, updatedAt: new Date().toISOString() }
          : n
      )
    );
  };

  const filteredNotes = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q)
    );

    // Sort: pinned first, then FAVORITES, then by updatedAt desc
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // ⭐ NEW: favorites next
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;

      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [notes, search]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Notes ✍️</h1>
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </header>

      <main className="app-main">
        {/* Form */}
        <section className="note-form-section">
          <h2>{editingId ? "Edit Note" : "New Note"}</h2>
          <form onSubmit={handleSubmit} className="note-form">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              rows="5"
              placeholder="Write your note here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="form-actions">
              <button type="submit">
                {editingId ? "Update" : "Add"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Notes list */}
        <section className="notes-list-section">
          <h2>All Notes</h2>
          {filteredNotes.length === 0 ? (
            <p className="empty-text">No notes yet. Create one!</p>
          ) : (
            <div className="notes-grid">
              {filteredNotes.map((note) => (
                <article key={note.id} className="note-card">
                  <div className="note-card-header">
                    <h3>{note.title}</h3>

                    {/* ⭐ NEW: Favorite + existing Pin button */}
                    <div style={{ display: "flex", gap: "0.35rem" }}>
                      <button
                        className={`fav-btn ${note.favorite ? "favorited" : ""}`}
                        onClick={() => toggleFavorite(note.id)}
                        title={note.favorite ? "Unfavorite" : "Mark as favorite"}
                      >
                        {note.favorite ? "⭐" : "☆"}
                      </button>

                      <button
                        className={`pin-btn ${note.pinned ? "pinned" : ""}`}
                        onClick={() => togglePin(note.id)}
                        title={note.pinned ? "Unpin" : "Pin"}
                      >
                        {note.pinned ? "📌" : "📍"}
                      </button>
                    </div>
                  </div>

                  <p className="note-body">
                    {note.body || <span className="muted">No content</span>}
                  </p>
                  <div className="note-footer">
                    <span className="timestamp">
                      Updated: {new Date(note.updatedAt).toLocaleString()}
                    </span>
                    <div className="note-actions">
                      <button onClick={() => handleEdit(note)}>Edit</button>
                      <button
                        className="danger"
                        onClick={() => handleDelete(note.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
