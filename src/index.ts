// Import files common for all pages
import "./script/commonImports";

// Page-specific imports
import "./index.html";
import "./styles/main.css";

// SW
import "./manifest.json";
import * as OfflinePluginRuntime from "offline-plugin/runtime";
OfflinePluginRuntime.install();

// Import and run app
import app from "./script/app";
app();
