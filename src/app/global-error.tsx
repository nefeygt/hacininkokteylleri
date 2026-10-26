"use client";

// The last resort when the root layout itself fails: no theme or fonts can be assumed, so it is self-contained.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d0d0d",
          color: "#e8e6e3",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.25em", color: "#d0453a" }}>RX · 500</div>
          <h1 style={{ fontSize: 28, margin: "12px 0" }}>Bir şeyler ters gitti</h1>
          <p style={{ fontSize: 14, color: "#b4b1ae", marginBottom: 24 }}>Biraz sonra tekrar dene.</p>
          <button
            type="button"
            onClick={reset}
            style={{ background: "#8b1a1a", color: "#fff", border: 0, borderRadius: 4, padding: "10px 20px", fontSize: 14, cursor: "pointer" }}
          >
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  );
}
