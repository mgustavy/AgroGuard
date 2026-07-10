#!/usr/bin/env bash
#
# AgroGuard one-command redeploy. Run on the VM as root:
#
#   sudo bash /opt/agroguard/AgroGuard/deploy/update.sh
#
# It syncs the repo to origin/main, rebuilds the frontend, publishes it, and
# restarts the API. Your local .env is untracked, so it is never touched.

set -euo pipefail

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
