import { defineConfig } from "orval";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

/**
 * Orval Configuration - Multi-Spec Support
 *
 * Structure allows multiple API specs to coexist:
 * - Each spec gets its own project key
 * - Each generates to its own folder: src/lib/api/generated/{spec-name}/
 * - Each has its own wrappers: src/lib/api/hooks/{spec-name}/
 *
 * Adding a new spec:
 * 1. Add new project object below
 * 2. Set input.target to new spec URL
 * 3. Set output.target to ./src/lib/api/generated/{spec-name}/
 * 4. Create wrapper folder: src/lib/api/hooks/{spec-name}/
 * 5. Run: pnpm generate:api
 */
export default defineConfig({
  // K2 Tax API (Primary - Currently in use)
  k2TaxApi: {
    input: {
      target: `${process.env.NEXT_PUBLIC_API_URL}swagger/v1/swagger.json`,
    },
    output: {
      mode: "tags-split",
      target: "./src/lib/api/generated/k2-tax-api/", // ← Namespaced by spec
      client: "react-query",
      httpClient: "axios",
      baseUrl: "", // ← Leave empty, will use global axios defaults at runtime
      allParamsOptional: false,
      clean: true,
    },
  },
});
