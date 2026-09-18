import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { createCoachApiMiddleware } from "./src/server/coachApi";

function coachApiPlugin(env: Record<string, string>): Plugin {
  const apply = createCoachApiMiddleware(env);
  return {
    name: "moonshots-coach-api",
    configureServer(server) {
      server.middlewares.use(apply);
    },
    configurePreviewServer(server) {
      server.middlewares.use(apply);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), coachApiPlugin(env)],
    server: {
      host: true,
      port: 5173,
    },
    preview: {
      host: true,
      port: 4173,
    },
  };
});
