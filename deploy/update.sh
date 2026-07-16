#!/usr/bin/env bash
#
# AgroGuard one-command redeploy. Run on the VM:
#
#   sudo bash /opt/agroguard/AgroGuard/deploy/update.sh
#
# It syncs the repo to origin/main, rebuilds the frontend, publishes it, and
# restarts the API. Your local .env is untracked, so it is never touched.
#
# The script needs root (it writes to the web root and restarts a service). If
# it is started without root, for example by the GitHub Actions SSH deploy, it
# re-runs itself with sudo. That needs passwordless sudo for the deploy user;
# see deploy/README.md, "Automated deploys with GitHub Actions".

set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  exec sudo -n bash "$0" "$@"
fi

REPO=/opt/agroguard/AgroGuard
OWNER=agroguard
WEBROOT=/var/www/agroguard

echo "==> Syncing repo to origin/main"
sudo -u "$OWNER" git -C "$REPO" fetch --quiet origin
sudo -u "$OWNER" git -C "$REPO" reset --hard origin/main

echo "==> Building the frontend"
sudo -u "$OWNER" bash -c "cd '$REPO/src/dashboard' && npm install --silent && npm run build"

echo "==> Publishing the build"
cp -r "$REPO/src/dashboard/dist/." "$WEBROOT/"

echo "==> Restarting the API"
systemctl restart agroguard-api

echo "==> Done. Live at your site URL (hard-refresh the browser)."
