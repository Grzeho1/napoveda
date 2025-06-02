// === Importy a Firebase ===
import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import {getStorage} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { getAnalytics } from "firebase/analytics";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {db} from "./firebase";
import { renumberSections } from "./utils/renumberSections";
import { labelToSortableNumber } from "./utils/sorting";
import Popup from "./components/popup"; 
import ConfirmDialog from "./components/confirmPopup";


// === Hlavní komponenta ===
export default function App() {
  const [data, setData] = useState<Record<string, { label: string, content: string; parent?: string }>>({});
  const [newLabel, setNewLabel] = useState("");
  const [parentSection, setParentSection] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [isEditable, setIsEditable] = useState(false);
  const [popupMessage, setPopupMessage] = useState<React.ReactNode | null>(null);

  const collapseAll = () => {
    const all = Object.keys(data).reduce((acc, id) => ({ ...acc, [id]: true }), {});
    setCollapsed(all);
  };

  const expandAll = () => {
    const all = Object.keys(data).reduce((acc, id) => ({ ...acc, [id]: false }), {});
    setCollapsed(all);
  };

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

  // const handleDelete = (id: string) => {
  //   const updated = { ...data };
  //   delete updated[id];
  //   Object.keys(updated).forEach((key) => {
  //     if (updated[key].parent === id) delete updated[key];
  //   });
  //   setData(updated);
  //   set(ref(db, "napoveda"), updated);
   
  // };

  const handleDelete = (id: string) => {
    setPopupMessage(
      <ConfirmDialog
        message="Opravdu chcete tuto sekci a její podsekce smazat?"
        onConfirm={() => {
          const updated = { ...data };
          delete updated[id];
          Object.keys(updated).forEach((key) => {
            if (updated[key].parent === id) delete updated[key];
          });
          setData(updated);
          set(ref(db, "napoveda"), updated);
          setPopupMessage(null);
        }}
        onCancel={() => setPopupMessage(null)}
      />
    );
  };
  

  

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
   
  };

  const handleAddSection = () => {
    if (!newLabel.trim()) return;

    const parent = data[parentSection];
    if (parent) {
      const prefix = parent.label.match(/^\d+(\.\d+)?/)?.[0];
      if (prefix && prefix.split(".").length >= 2) {
        setPopupMessage("Nelze vytvořit více než 2 úrovně sekcí.");
        return;
      }
    }

    const id = uuidv4();
    const updated = {
      ...data,
      [id]: {
        label: newLabel.trim(),
        content: "",
        ...(parentSection ? { parent: parentSection } : {})
      }
    };
    const entries = Object.entries(updated);
    renumberSections(entries, undefined);
    const finalData = Object.fromEntries(entries);
    setData(finalData);
    set(ref(db, "napoveda"), finalData);
    setNewLabel("");
    setParentSection("");
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
              <button onClick={() => handleDelete(id)} style={{ marginLeft:20, color: "red" }}>❌</button>
            )}
          </h2>
          {!collapsed[id] && (
            <div style={{
              marginBottom: 10,
              padding: isEditable ? 10 : 0,
              border: isEditable ? "1px solid #ccc" : "none",
              background: isEditable ? "white" : "transparent",
              color: "black",
              paddingLeft: isEditable ? 10: 35
            }}>
              {isEditable ? (
                <ReactQuill
                theme="snow"
                value={s.content}
                onChange={(value) => handleChange(id, value)}
                style={{ background: "white", color: "black" ,paddingLeft:10}}
                
              />
              
              ) : (
                <div
  style={{ padding: 5 }}
  dangerouslySetInnerHTML={{ __html: s.content }}
/>
              )}
              {renderSections(id)}
            </div>
          )}
        </section>
      ));
  };

  /**
   * Exportuje obsah do HTML souboru.
   */
  const exportToHTML = () => {
    const htmlContent = Object.entries(data)
      .sort((a, b) => labelToSortableNumber(a[1].label) - labelToSortableNumber(b[1].label))
      .map(([_, section]) => `<h2>${section.label}</h2>${section.content}`)
      .join("<hr>");
  
    const blob = new Blob([`<html><body>${htmlContent}</body></html>`], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "napoveda.html";
    link.click();
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

  const btnStyle = {
    backgroundColor: "#495057",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    transition: "background-color 0.3s"
  };
  

  return (
    <div style={{ display: "flex", fontFamily: "Arial, sans-serif", backgroundColor: "#fff", color: "#000" }}>
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

        {/* Main kontent */}


      <div
        style={{
          marginLeft: 270,
          padding: "20px 30px 20px 40px",
          width: "calc(100% - 310px)"
        }}
      >
        <h1 style={{ fontSize: "32px", marginBottom: 20 }}>Nápověda</h1>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 20 }}>


    {/* === Vlastní popup === */}
        {popupMessage && (
          <Popup
            message={popupMessage}
            onClose={() => setPopupMessage(null)}
          />
        )}


  {/* Levá */}


      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={collapseAll}
          style={btnStyle}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#6c757d")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#495057")}
        >
          🔽 Sbalit vše
        </button>

        <button
          onClick={expandAll}
          style={btnStyle}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#6c757d")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#495057")}
        >
          🔼 Rozbalit vše
        </button>

        <button
          onClick={exportToHTML}
          style={btnStyle}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#6c757d")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#495057")}
        >
          📄 Exportovat do HTML
        </button>
      </div>

      {/* Pravá strana  */}
      <button
        onClick={() => setIsEditable(!isEditable)}
        style={{
          backgroundColor: isEditable ? "#9d0208" : "#006400",
          color: "#fff",
          padding: "11px 18px",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
          transition: "background-color 0.3s ease",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)"
          
        }}
      >
        {isEditable ? "🔒 Zamknout editaci" : "🔓 Odemknout editaci"}
      </button>
    </div>



        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 30, justifyContent: "space-between"}}>
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
              .filter(([_, s]) => !s.parent) // Jen první úroveň
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