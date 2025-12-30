#!/bin/bash
# HaderOS Platform - DigitalOcean Deployment Script

set -e

echo "🚀 HaderOS Platform - DigitalOcean Deployment"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# 1. Update system
echo -e "\n${YELLOW}📦 Updating system...${NC}"
apt-get update && apt-get upgrade -y

# 2. Install Docker
echo -e "\n${YELLOW}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# 3. Install Docker Compose
echo -e "\n${YELLOW}📦 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

# 4. Install Git
echo -e "\n${YELLOW}📦 Installing Git...${NC}"
if ! command -v git &> /dev/null; then
    apt-get install -y git
    echo -e "${GREEN}✅ Git installed${NC}"
else
    echo -e "${GREEN}✅ Git already installed${NC}"
fi

# 5. Clone repository (if not exists)
APP_DIR="/opt/haderos-platform"
if [ ! -d "$APP_DIR" ]; then
    echo -e "\n${YELLOW}📥 Cloning repository...${NC}"
    read -p "Enter GitHub repository URL: " REPO_URL
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
else
    echo -e "\n${YELLOW}🔄 Updating repository...${NC}"
    cd $APP_DIR
    git pull
fi

# 6. Setup environment
echo -e "\n${YELLOW}⚙️  Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.production .env
    echo -e "${YELLOW}⚠️  Please edit .env file with your configuration${NC}"
    echo -e "${YELLOW}   Run: nano .env${NC}"
    read -p "Press enter when ready..."
fi

# 7. Generate strong secrets
echo -e "\n${YELLOW}🔐 Generating secrets...${NC}"
DB_PASSWORD=$(openssl rand -base64 32)
SECRET_KEY=$(openssl rand -base64 64)

sed -i "s/CHANGE_THIS_STRONG_PASSWORD/$DB_PASSWORD/g" .env
sed -i "s/CHANGE_THIS_TO_RANDOM_64_CHAR_STRING/$SECRET_KEY/g" .env

echo -e "${GREEN}✅ Secrets generated${NC}"

# 8. Setup firewall
echo -e "\n${YELLOW}🔥 Configuring firewall...${NC}"
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
echo -e "${GREEN}✅ Firewall configured${NC}"

# 9. Build and start containers
echo -e "\n${YELLOW}🏗️  Building containers...${NC}"
docker-compose build

echo -e "\n${YELLOW}🚀 Starting services...${NC}"
docker-compose up -d

# 10. Wait for services to be ready
echo -e "\n${YELLOW}⏳ Waiting for services...${NC}"
sleep 10

# 11. Check health
echo -e "\n${YELLOW}🏥 Checking health...${NC}"
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    docker-compose logs backend
    exit 1
fi

# 12. Show status
echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo -e "\n📊 Service Status:"
docker-compose ps

echo -e "\n🌐 Access URLs:"
echo -e "   API: http://$(curl -s ifconfig.me)/api"
echo -e "   Health: http://$(curl -s ifconfig.me)/health"
echo -e "   Docs: http://$(curl -s ifconfig.me)/api/docs"

echo -e "\n📝 Next Steps:"
echo -e "   1. Configure your domain DNS to point to: $(curl -s ifconfig.me)"
echo -e "   2. Setup SSL certificate (certbot)"
echo -e "   3. Update CORS_ORIGINS in .env"
echo -e "   4. Monitor logs: docker-compose logs -f"

echo -e "\n💡 Useful Commands:"
echo -e "   View logs:     docker-compose logs -f"
echo -e "   Restart:       docker-compose restart"
echo -e "   Stop:          docker-compose down"
echo -e "   Update:        git pull && docker-compose up -d --build"
