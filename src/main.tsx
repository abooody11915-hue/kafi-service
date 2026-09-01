import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Theme is bootstrapped inline in index.html before first paint to prevent FOUC.
createRoot(document.getElementById("root")!).render(<App />);
