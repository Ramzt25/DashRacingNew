import { spawn, ChildProcess } from 'child_process';

let backendProcess: ChildProcess | null = null;
let serverStartedByUs = false;

export default async function globalSetup() {
  console.log('🚀 E2E Tests starting...');
  
  // Skip server check for now - assume backend is running
  console.log('⚠️ Skipping backend server check - assuming it is running');
  (global as any).__BACKEND_PROCESS__ = null;
  (global as any).__SERVER_STARTED_BY_US__ = false;
  return;
};