import React from "react";
import ReactDOM from "react-dom/client";
import App from "./AppNew";
import { initPostHog } from "./lib/posthog";
import "./index.css";
import "./landing.css";
import "./responsive-polish.css";
import "./career/career.css";

initPostHog();

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
