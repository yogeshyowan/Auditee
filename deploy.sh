#!/bin/bash
set -e

if [ -z "$GITHUB_PAT" ]; then
  echo "❌ GITHUB_PAT env var not set. Cannot push to GitHub."
  exit 1
fi

echo "📤 Pushing to GitHub..."
git push "https://x-access-token:${GITHUB_PAT}@github.com/yogeshyowan/Eltegra-Rebuild" main

echo ""
echo "🚀 Deploying to Hetzner..."
ssh -o StrictHostKeyChecking=accept-new root@204.168.254.227 "/opt/auditee/deploy.sh"

echo ""
echo "🎉 Live at https://auditee.site"
