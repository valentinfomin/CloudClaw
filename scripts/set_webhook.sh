#!/bin/bash
# Usage: ./scripts/set_webhook.sh <TELEGRAM_BOT_TOKEN> <WORKER_URL> <SECRET_TOKEN>
# Example: ./scripts/set_webhook.sh 123456:ABC-DEF https://cloudclaw-agent.apinew.workers.dev mySecret

TOKEN=$1
URL=$2
SECRET=$3

if [ -z "$TOKEN" ] || [ -z "$URL" ]; then
    echo "Usage: $0 <TELEGRAM_BOT_TOKEN> <WORKER_URL> [SECRET_TOKEN]"
    exit 1
fi

curl -F "url=$URL/webhook" -F "secret_token=$SECRET" https://api.telegram.org/bot$TOKEN/setWebhook
