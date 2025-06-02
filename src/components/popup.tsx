type PopupProps = {
    message: React.ReactNode;
    onClose: () => void;
  };


  export default function Popup({ message, onClose }: PopupProps) {
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
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              backgroundColor: "#006400",
              color: "white",
              border: "none",
              borderRadius: 5,
              cursor: "pointer"
            }}
          >
            OK
          </button>
        </div>
      </div>
    );
  }


  export {};

  

  
  