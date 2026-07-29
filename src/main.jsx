import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./app/router";
import SupabaseOwnerAuthGate from "./components/SupabaseOwnerAuthGate";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
<StrictMode>
<SupabaseOwnerAuthGate><AppRouter /></SupabaseOwnerAuthGate>
</StrictMode>
);
