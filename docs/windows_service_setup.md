# Optional Windows Background-Service Setup

This document describes the prototype's original PM2 and Cloudflare Tunnel setup. It is not required for a local portfolio demo; `restart.bat` is the simplest way to run the app.

## Project Root

The project root contains `package.json`, `server/`, `web/`, and `ecosystem.config.cjs`. For example:

```powershell
cd C:\projects\gaming\dnd_dm_helper
```

## Install Dependencies

Run PowerShell as an administrator when installing the Windows service:

```powershell
npm install
cd web
npm install
cd ..
npm install -g pm2 pm2-windows-service
```

## Start with PM2

From the project root:

```powershell
pm2 start ecosystem.config.cjs
pm2 save
```

The configuration starts the Node backend and the optional named Cloudflare tunnel. Review `ecosystem.config.cjs` before enabling the tunnel on another machine.

## Install the Windows Service

```powershell
pm2-service-install
pm2-service-start
```

The service is named `DMHelper` and starts the PM2-managed processes during system startup.

## Common Commands

```powershell
pm2 status
pm2 logs
pm2 restart all
pm2 stop all
pm2 save
```

Service commands:

```powershell
pm2-service-start
pm2-service-stop
pm2-service-uninstall
```

## Troubleshooting

### `cloudflared` is not on PATH

Confirm the installation:

```powershell
cloudflared --version
```

If needed, install it using the official Cloudflare documentation, reopen PowerShell, and check the command again. The optional `tools/cloudflared_fix.ps1` helper can locate an existing Windows installation and update the user PATH.

### Verify the App and Tunnel

1. Open <http://localhost:5174/#/dm> and confirm the frontend works locally.
2. If a tunnel is configured, open its HTTPS domain from another device.
3. Inspect tunnel and application output with `pm2 logs`.

PM2 logs are normally stored under `%USERPROFILE%\.pm2\logs`.

## Security Note

Do not publish `.env`, API keys, Cloudflare credentials, named-tunnel configuration, or PM2 logs. The public repository should contain placeholders only.

