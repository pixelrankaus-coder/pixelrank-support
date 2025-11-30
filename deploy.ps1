# Deploy script for PixelRank Support
# Run this after pushing changes to GitHub

$SERVER = "root@134.199.165.188"
$PROJECT_PATH = "/var/www/pixelrank-support"

Write-Host "Deploying to server..." -ForegroundColor Cyan

# SSH to server and run deployment commands
ssh $SERVER "cd $PROJECT_PATH && git fetch origin && git reset --hard origin/main && npm run build -- --no-lint && pm2 restart all"

Write-Host "Deployment complete!" -ForegroundColor Green
