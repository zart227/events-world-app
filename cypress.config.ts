import { defineConfig } from "cypress";
import "dotenv/config";

const SERVER_PORT = process.env.SERVER_PORT || 3001;

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: `http://localhost:${SERVER_PORT}`,
    env: {
      test_email: process.env.TEST_EMAIL,
      test_password: process.env.TEST_PASSWORD,
    },
  },
});
