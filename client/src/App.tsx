import { Home } from "./pages/Home";

export function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <main className="flex-1">
        <Home />
      </main>
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>
          Powered by Microsoft Edge TTS • Built with React, Vite, Express & TypeScript
        </p>
      </footer>
    </div>
  );
}

export default App;
