// Import files common for all pages
import "./script/commonImports";

// Page-specific imports
import "./index.html";
import "./styles/main.css";

// SW
import "./manifest.json";
import * as OfflinePluginRuntime from "offline-plugin/runtime";
OfflinePluginRuntime.install({
	onUpdateReady: () => {
		// Apply SW update immediately
		OfflinePluginRuntime.applyUpdate();
	},
	onUpdated: () => {
		// Reload the webpage to load into the new version
		window.location.reload();
	}
});

// Import and run app
import app from "./script/app";
app();
