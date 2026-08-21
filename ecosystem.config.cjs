module.exports = {
  apps: [
    {
      name: "dmhelper-backend",
      script: "server/index.js",
      cwd: __dirname,
      autorestart: true,
      watch: false
    },
    {
      name: "dmhelper-frontend",
      script: "npm",
      args: ["run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"],
      cwd: __dirname + "/web",
      autorestart: true,
      watch: false
    },
    {
      name: "dmhelper-tunnel",
      script: "cloudflared",
      args: "tunnel run dmhelper",
      cwd: __dirname,
      autorestart: true,
      watch: false
    }
  ]
};


