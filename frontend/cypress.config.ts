import { defineConfig } from 'cypress';
import 'dotenv/config';

const FRONTEND_PORT = process.env.FRONTEND_PORT || process.env.PORT || 3000;
const API_HOST = process.env.REACT_APP_SERVER_URL || 'http://localhost';
const API_PORT = process.env.REACT_APP_SERVER_PORT || process.env.SERVER_PORT || 3001;

export default defineConfig({
  e2e: {
    setupNodeEvents() {
      // node event listeners
    },
    baseUrl: `http://localhost:${FRONTEND_PORT}`,
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 10000,
    env: {
      apiBaseUrl: `${API_HOST}:${API_PORT}/api`,
      test_email: process.env.TEST_EMAIL || 'cypress@test.local',
      test_password: process.env.TEST_PASSWORD || 'secret',
      useRealApi: process.env.CYPRESS_USE_REAL_API === 'true',
    },
  },
});
