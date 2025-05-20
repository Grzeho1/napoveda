import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {
  apiKey: "AIzaSyATOd1zv1yjTgZuxoj1hIJq4v2fjsbcMZ8",
  authDomain: "coalios-napoveda.firebaseapp.com",
  databaseURL: "https://coalios-napoveda-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "coalios-napoveda",
  storageBucket: "coalios-napoveda.firebasestorage.app",
  messagingSenderId: "592933271316",
  appId: "1:592933271316:web:8c0c64155aa20f8955b401",
  measurementId: "G-X8M20GY8MG"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function App() {
  const [data, setData] = useState<Record<string, { label: string, content: string; parent?: string }>>({});
  const [newLabel, setNewLabel] = useState("");
  const [parentSection, setParentSection] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    const dataRef = ref(db, "napoveda");
    onValue(dataRef, (snapshot) => {
      const val = snapshot.val();
      if (val) setData(val);
    });
  }, []);

  const handleChange = (id: string, value: string) => {
    const updated = { ...data, [id]: { ...data[id], content: value } };
    setData(updated);
    set(ref(db, "napoveda"), updated);
  };

  const handleDelete = (id: string) => {
    const updated = { ...data };
    delete updated[id];
    Object.keys(updated).forEach((key) => {
      if (updated[key].parent === id) delete updated[key];
    });
    setData(updated);
    set(ref(db, "napoveda"), updated);
  };

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getFullLabel = (base: string, parentId?: string) => {
    const siblings = Object.values(data).filter(d => d.parent === parentId);
    const index = siblings.length + 1;
    if (!parentId) return `${index}. ${base}`;
    const parentLabel = data[parentId]?.label.match(/^\d+(\.\d+)*/)?.[0] || "0";
    return `${parentLabel}.${index} ${base}`;
  };

  const handleAddSection = () => {
    if (!newLabel.trim()) return;
    const id = uuidv4();
    const finalLabel = getFullLabel(newLabel.trim(), parentSection || undefined);
    const updated = {
      ...data,
      [id]: {
        label: finalLabel,
        content: "",
        ...(parentSection ? { parent: parentSection } : {})
      }
    };
    setData(updated);
    set(ref(db, "napoveda"), updated);
    setNewLabel("");
    setParentSection("");
  };

  const labelToSortableNumber = (label: string) => {
    const match = label.match(/^\d+(\.\d+)*/);
    if (!match) return Number.MAX_VALUE;
    return match[0].split(".").reduce((acc, val, i) => acc + parseInt(val) / Math.pow(10, i * 2), 0);
  };

  const matchesSearch = (entry: { label: string; content: string }) =>
    entry.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchTerm.toLowerCase());

  const collectMatchingWithParents = () => {
    const result: Record<string, true> = {};
    const addWithParents = (id: string) => {
      if (!data[id]) return;
      if (result[id]) return;
      result[id] = true;
      const parent = data[id].parent;
      if (parent) addWithParents(parent);
    };
    for (const [id, entry] of Object.entries(data)) {
      if (matchesSearch(entry)) {
        addWithParents(id);
      }
    }
    return result;
  };

  const visibleIds = searchTerm ? collectMatchingWithParents() : null;

  const filteredAndSortedEntries = Object.entries(data)
    .filter(([id]) => !visibleIds || visibleIds[id])
    .sort((a, b) => labelToSortableNumber(a[1].label) - labelToSortableNumber(b[1].label));

  const renderSections = (parentId?: string) => {
    return filteredAndSortedEntries
      .filter(([_, s]) => s.parent === parentId)
      .map(([id, s]) => (
        <section key={id} id={id} style={{ marginBottom: 30, paddingLeft: parentId ? 20 : 0 }}>
          <h2 style={{ fontSize: 20, marginBottom: 5 }}>
            <button onClick={() => toggleCollapse(id)} style={{ marginRight: 10 }}>
              {collapsed[id] ? "+" : "−"}
            </button>
            {s.label}
            {isEditable && (
              <button onClick={() => handleDelete(id)} style={{ marginLeft: 10, color: "red" }}>🗑️</button>
            )}
          </h2>
          {!collapsed[id] && (
            <div style={{
              marginBottom: 10,
              padding: isEditable ? 10 : 0,
              border: isEditable ? "1px solid #ccc" : "none",
              background: isEditable ? "white" : "transparent"
            }}>
              {isEditable ? (
              <textarea
              value={s.content}
              onChange={(e) => handleChange(id, e.target.value)}
              style={{ width: "100%", height: 100, padding: 10, border: "none", resize: "vertical" }}
            />
              ) : (
                <div style={{ whiteSpace: "pre-wrap", padding: 5 }}>{s.content}</div>
              )}
              {renderSections(id)}
            </div>
          )}
        </section>
      ));
  };

  const renderOutline = (parentId?: string, depth = 0) => {
    return filteredAndSortedEntries
      .filter(([_, s]) => s.parent === parentId)
      .map(([id, s]) => (
        <li key={id} style={{ marginBottom: 5, marginLeft: depth * 15 }}>
          <a href={`#${id}`} style={{ color: "#333", textDecoration: "none" }}>
            {s.label}
          </a>
          <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
            {renderOutline(id, depth + 1)}
          </ul>
        </li>
      ));
  };

  return (
    <div style={{ display: "flex", fontFamily: "Arial, sans-serif" }}>
      <div
        style={{
          width: 250,
          position: "fixed",
          height: "100vh",
          backgroundColor: "#f4f4f4",
          padding: 20,
          overflowY: "auto",
          borderRight: "1px solid #ccc"
        }}
      >
        <h2 style={{ fontSize: "20px", marginBottom: 10 }}>Osnova</h2>
        <input
          type="text"
          placeholder="Vyhledat..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 20 }}
        />
        <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
          {renderOutline()}
        </ul>
      </div>

      <div
        style={{
          marginLeft: 270,
          padding: "20px 30px 20px 40px",
          width: "calc(100% - 310px)"
        }}
      >
        <h1 style={{ fontSize: "32px", marginBottom: 20 }}>Nápověda</h1>
        <button onClick={() => setIsEditable(!isEditable)} style={{ marginBottom: 20 }}>
          {isEditable ? "🔒 Zamknout editaci" : "🔓 Odemknout editaci"}
        </button>

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 30 }}>
          <input
            type="text"
            placeholder="Název nové sekce"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 5, flex: 2 }}
            disabled={!isEditable}
          />
          <select
            value={parentSection}
            onChange={(e) => setParentSection(e.target.value)}
            style={{ padding: 10, borderRadius: 5, flex: 1 }}
            disabled={!isEditable}
          >
            <option value="">(Bez nadřazené sekce)</option>
            {Object.entries(data)
              .sort((a, b) => labelToSortableNumber(a[1].label) - labelToSortableNumber(b[1].label))
              .map(([id, s]) => (
                <option key={id} value={id}>{s.label}</option>
              ))}
          </select>
          <button
            onClick={handleAddSection}
            style={{ padding: "10px 20px", borderRadius: 5 }}
            disabled={!isEditable}
          >
            ➕ Přidat sekci
          </button>
        </div>

        {renderSections()}
      </div>
    </div>
  );
}
