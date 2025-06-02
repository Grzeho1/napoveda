
import React from "react";


type ConfirmDialogProps = {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "white",
        padding: 30,
        borderRadius: 10,
        boxShadow: "0 0 10px rgba(0,0,0,0.3)",
        maxWidth: 400,
        textAlign: "center"
      }}>
        <p style={{ marginBottom: 20 }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              backgroundColor: "#9d0208",
              color: "white",
              border: "none",
              borderRadius: 5,
              cursor: "pointer"
            }}
          >
            Ano
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ccc",
              color: "black",
              border: "none",
              borderRadius: 5,
              cursor: "pointer"
            }}
          >
            Zrušit
          </button>
        </div>
      </div>
    </div>
  );
}
export {};
