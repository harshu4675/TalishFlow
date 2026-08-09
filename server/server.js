import { startApp } from "./src/app.js";

startApp().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exit(1);
});
