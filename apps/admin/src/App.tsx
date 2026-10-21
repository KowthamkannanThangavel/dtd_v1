// Placeholder shell; branded sign-in and sidebar arrive in TASK-DTD-S0-010.
// Colors/type come from @dtd/tokens CSS custom properties (imported once in main.tsx).
export default function App() {
  return (
    <main
      style={{
        minHeight: '100vh',
        margin: 0,
        padding: 'var(--space-6)',
        background: 'var(--color-background-page)',
        color: 'var(--color-content-primary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <h1>DairyToDoor Admin</h1>
    </main>
  );
}
