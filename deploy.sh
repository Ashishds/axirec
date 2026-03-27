#!/bin/bash

# HireAI Deployment Script for Ubuntu EC2
# Simplest way to launch the full stack for a client demo.

echo "🚀 Starting HireAI Deployment..."

# 1. Update and Install Docker
if ! [ -x "$(command -v docker)" ]; then
    echo "📦 Installing Docker..."
    export DEBIAN_FRONTEND=noninteractive
    sudo -E apt-get update
    sudo -E apt-get install -y ca-certificates curl gnupg lsb-release
    sudo mkdir -p /etc/apt/keyrings
    sudo rm -f /etc/apt/keyrings/docker.gpg
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --yes --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo -E apt-get update
    sudo -E apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

# 2. Check for .env files
if [ ! -f "backend/.env" ]; then
    echo "⚠️ Warning: backend/.env not found. Please create it before running docker-compose."
    exit 1
fi

# 3. Detect Public IP or Use Domain
# If you are using a domain like ashishai.in/HireAI, set it here
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
    export NEXT_PUBLIC_API_URL="http://$PUBLIC_IP:8000"
    echo "🌐 Detected Public IP: $PUBLIC_IP"
else
    echo "🔗 Using custom API URL: $NEXT_PUBLIC_API_URL"
fi
echo "🔗 Setting Frontend API URL to: $NEXT_PUBLIC_API_URL"

# 5. Build and Launch
echo "🏗️ Building and launching containers..."
sudo docker compose up -d --build

echo "✅ Deployment Complete!"
echo "📡 UI: http://$PUBLIC_IP:3000"
echo "🔌 API: http://$PUBLIC_IP:8000"
