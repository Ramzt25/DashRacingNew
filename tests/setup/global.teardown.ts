import { ChildProcess } from 'child_process';

export default async function globalTeardown() {
  console.log('🧹 Cleaning up test servers...');
  
  const backendProcess = (global as any).__BACKEND_PROCESS__ as ChildProcess;
  const serverStartedByUs = (global as any).__SERVER_STARTED_BY_US__ as boolean;
  
  // Only kill servers that we started
  if (backendProcess && serverStartedByUs) {
    backendProcess.kill('SIGTERM');
    console.log('✅ Backend server stopped (started by tests)');
  } else if (!serverStartedByUs) {
    console.log('ℹ️  Backend server left running (was already running)');
  }
  
  // Give processes time to cleanup
  await new Promise(resolve => setTimeout(resolve, 1000));
};