import { env } from "../config/env";

// Mock environment variables if needed
process.env.NODE_ENV = "test";

// Silence console logs during tests if desired
// global.console = { ...global.console, log: jest.fn(), error: jest.fn() };
