# Deploying AgroGuard to a Linux VM (Strettch Cloud)

One small VM runs everything: the FastAPI API (uvicorn) and the built frontend
(served by nginx, which also proxies the API on the same origin). Auth and the
user database are handled by **Supabase** (managed, external), so there is no
database to host here.

**Recommended VM:** Ubuntu 22.04, 2 vCPU, 2 GB RAM, 25 GB SSD (1 vCPU / 1 GB works
but is tight). You need SSH access and `sudo`.

Everything below assumes you are SSHed into the VM. Replace `YOUR_DOMAIN_OR_IP`,
the GitHub URL, and the Supabase values with your own.

---

## 1. System packages

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip nginx git curl
# Node 20 for building the frontend:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 2. Create a service user and clone the repo

```bash
sudo useradd -m -d /opt/agroguard -s /bin/bash agroguard
sudo -u agroguard git clone https://github.com/mgustavy/AgroGuard.git /opt/agroguard/AgroGuard
cd /opt/agroguard/AgroGuard
```

> Deploy from `main` once the app PRs are merged, or `git checkout <branch>` for a
> branch that has the API + dashboard changes. The trained model
> (`models/xgb_risk_model.joblib`) is committed, so nothing extra to upload.

## 3. Python environment for the API

```bash
sudo -u agroguard python3 -m venv .venv
sudo -u agroguard .venv/bin/pip install --upgrade pip
sudo -u agroguard .venv/bin/pip install -r src/api/requirements.txt
```

## 4. Build the frontend (with production env vars)

Vite bakes `VITE_*` values in at build time, so set them before building.
`VITE_API_URL=/api` keeps the frontend same-origin with the proxied API.

```bash
cd src/dashboard
cat > .env <<'EOF'
VITE_SUPABASE_URL=https://YOURREF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
VITE_API_URL=/api
EOF

npm install
npm run build

sudo mkdir -p /var/www/agroguard
sudo cp -r dist/* /var/www/agroguard/
cd /opt/agroguard/AgroGuard
```

## 5. Run the API under systemd

Before copying the unit, edit `AGROGUARD_CORS_ORIGINS` in
`deploy/systemd/agroguard-api.service` to your site origin (e.g.
`http://YOUR_VM_IP` or `https://your-domain`) so only your dashboard can call the API.

```bash
sudo cp deploy/systemd/agroguard-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now agroguard-api
sudo systemctl status agroguard-api        # should be "active (running)"
curl -s http://127.0.0.1:8000/             # health JSON, model_loaded: true
```

## 6. Configure nginx

```bash
sudo cp deploy/nginx/agroguard.conf /etc/nginx/sites-available/agroguard
sudo ln -sf /etc/nginx/sites-available/agroguard /etc/nginx/sites-enabled/agroguard
sudo rm -f /etc/nginx/sites-enabled/default
# Optional: edit server_name in the file to YOUR_DOMAIN
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Open the firewall

Allow inbound **80** (and **443** if you add HTTPS) in the Strettch Cloud security
group / firewall for this VM. If `ufw` is active on the VM:

```bash
sudo ufw allow 'Nginx Full'
```

## 8. Test

- Open `http://YOUR_DOMAIN_OR_IP` -> the sign-in screen loads.
- API health: `curl http://YOUR_DOMAIN_OR_IP/api/` -> JSON with `model_loaded`.
- Register a field officer, confirm you land on the dashboard, and check the row
  in Supabase -> Table Editor -> `profiles`.

## 9. (Optional) HTTPS with a domain

Point an A record at the VM IP. A free DuckDNS subdomain
(`something.duckdns.org`) works too.

Certbot's nginx installer matches the certificate to a server block **by name**,
so set `server_name` to your domain first, then request the certificate:

```bash
sudo sed -i 's/server_name _;/server_name YOUR_DOMAIN;/' /etc/nginx/sites-available/agroguard
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN        # choose "redirect" when prompted
```

Certbot adds the HTTPS server block and sets up auto-renewal. Then add
`https://YOUR_DOMAIN` under Supabase -> Authentication -> URL Configuration.

If you skip the `server_name` step, certbot obtains the certificate but reports
"Could not find a matching server block"; fix `server_name` as above and run
`sudo certbot install --cert-name YOUR_DOMAIN`.

## Supabase notes

- Turn **Confirm email OFF** (Authentication -> Providers -> Email) for immediate
  login, as in local dev.
- Add `http://YOUR_DOMAIN_OR_IP` (and the https URL) under Authentication -> URL
  Configuration -> Site URL / Redirect URLs.

## Redeploying after changes

One command syncs to `origin/main`, rebuilds the frontend, publishes it, and
restarts the API:

```bash
sudo bash /opt/agroguard/AgroGuard/deploy/update.sh
```

If the API's Python dependencies changed, also run:

```bash
sudo -u agroguard /opt/agroguard/AgroGuard/.venv/bin/pip install -r /opt/agroguard/AgroGuard/src/api/requirements.txt
```

## Automated deploys with GitHub Actions

`.github/workflows/deploy.yml` runs `update.sh` on the VM over SSH on every push
to `main` (and via the "Run workflow" button on the Actions tab). `update.sh`
self-elevates with sudo, so the deploy user does not need to be root, but it does
need passwordless sudo for that one script. Set this up once.

### 1. Create a dedicated deploy key

On your own machine, generate a keypair used only for this deploy (no passphrase,
so CI can use it non-interactively):

```bash
ssh-keygen -t ed25519 -C "agroguard-github-actions-deploy" -f agroguard_deploy_key -N ""
```

This writes `agroguard_deploy_key` (private) and `agroguard_deploy_key.pub`
(public).

### 2. Authorise the public key on the VM

Add the public key to the deploy user's `authorized_keys`. Use the same user you
will put in the `VM_USER` secret; the `agroguard` service user works well:

```bash
sudo -u agroguard mkdir -p /opt/agroguard/.ssh
sudo -u agroguard chmod 700 /opt/agroguard/.ssh
cat agroguard_deploy_key.pub | sudo -u agroguard tee -a /opt/agroguard/.ssh/authorized_keys
sudo -u agroguard chmod 600 /opt/agroguard/.ssh/authorized_keys
```

Confirm it works from your machine (no password prompt):

```bash
ssh -i agroguard_deploy_key agroguard@YOUR_VM_IP echo ok
```

### 3. Allow passwordless sudo for the redeploy script

The workflow logs in as the deploy user and runs `bash .../update.sh`, which then
re-runs itself with `sudo -n`. Grant just that one command without a password:

```bash
echo 'agroguard ALL=(ALL) NOPASSWD: /usr/bin/bash /opt/agroguard/AgroGuard/deploy/update.sh' | sudo tee /etc/sudoers.d/agroguard-deploy
sudo chmod 440 /etc/sudoers.d/agroguard-deploy
sudo visudo -c
```

If `which bash` on the VM is not `/usr/bin/bash`, use that path in the rule
instead. As a broader fallback for a single-purpose VM you can use
`NOPASSWD: ALL`, but the scoped rule above is safer.

### 4. Add the repository secrets

In GitHub: repo **Settings -> Secrets and variables -> Actions -> New repository
secret**. Add three:

- `VM_HOST` the VM's public IP or hostname
- `VM_USER` the deploy user (`agroguard`)
- `VM_SSH_KEY` the full contents of the private `agroguard_deploy_key` file,
  including the `BEGIN` and `END` lines

### 5. Trigger and verify

Push to `main` or use "Run workflow" on the Actions tab. Open the run and check
the log: on success you see the `update.sh` output ("Syncing repo", "Building the
frontend", "Done"), and the site reflects the change after a hard refresh. Once
the private key is stored in the `VM_SSH_KEY` secret, delete your local copy of
it.
