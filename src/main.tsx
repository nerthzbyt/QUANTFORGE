import React from "react";
import ReactDOM from "react-dom/client";
import { AppProvider } from "./lib/AppProvider";
import { DashboardView } from "./views/DashboardView";
import "./index.css";

function App() {
  return (
    <AppProvider>
      <DashboardView />
    </AppProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
