import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import SupabaseOwnerAuthGate from "./components/SupabaseOwnerAuthGate";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
<React.StrictMode>
<SupabaseOwnerAuthGate><App /></SupabaseOwnerAuthGate>
</React.StrictMode>
);
