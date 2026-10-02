const { spawn } = require('child_process');

console.log('🚀 Starting CSM Monorepo: Backend API (:4000) & Frontend Web (:3000)...\n');

const api = spawn('npm', ['run', 'dev:backend'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

const web = spawn('npm', ['run', 'dev:frontend'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

function cleanup() {
  console.log('\n🛑 Shutting down CSM services...');
  try { api.kill(); } catch {}
  try { web.kill(); } catch {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
