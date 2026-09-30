module.exports = {
  apps: [
    {
      name: "csm-backend",
      cwd: "./backend",
      script: "dist/main.js",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
        FRONTEND_URL: "https://csm.mhhcambodia.com",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "400M",
    },
    {
      name: "csm-frontend",
      cwd: "./frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
    },
  ],
};
