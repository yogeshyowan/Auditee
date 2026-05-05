#!/bin/bash
set -e

echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "🚀 Deploying to Hetzner..."
ssh root@204.168.254.227 "/opt/auditee/deploy.sh"

echo ""
echo "🎉 Live at https://auditee.site"
