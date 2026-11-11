"use client";

/** Erreur dans la mise en page racine elle-même : page autonome, sans dépendances. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#f6f4ec",
          color: "#111",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>Oups, un souci</h1>
          <p style={{ color: "#4a4a4a" }}>Quelque chose s&apos;est mal passé. Réessaie.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "12px 24px",
              borderRadius: 999,
              border: "2px solid #111",
              background: "#ffd23f",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
