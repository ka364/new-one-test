#!/bin/bash

###############################################################################
# HaderOS Platform - Local Development Setup & Run Script
# تشغيل النظام بالكامل محليًا
# For offline development: يعمل بدون إنترنت بعد التثبيت الأول
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/haderos-mvp"

# Configuration
PYTHON_VERSION="3.9"
NODE_VERSION="20"
BACKEND_PORT=8000
FRONTEND_PORT=3000
DB_FILE="$SCRIPT_DIR/haderos_dev.db"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

###############################################################################
# Check Prerequisites
###############################################################################

check_prerequisites() {
    print_header "🔍 التحقق من المتطلبات الأساسية"
    
    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | awk '{print $2}')
        print_success "Python $PYTHON_VERSION موجود"
    else
        print_error "Python 3.9+ غير مثبت"
        echo "تثبيت من: https://www.python.org/downloads/"
        exit 1
    fi
    
    # Check Node
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | sed 's/v//')
        print_success "Node $NODE_VERSION موجود"
    else
        print_error "Node.js 20+ غير مثبت"
        echo "تثبيت من: https://nodejs.org/"
        exit 1
    fi
    
    # Check npm/pnpm
    if command -v pnpm &> /dev/null; then
        PNPM_VERSION=$(pnpm --version)
        print_success "pnpm $PNPM_VERSION موجود"
    elif command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_warning "npm موجود فقط (يفضل pnpm) - النسخة: $NPM_VERSION"
    else
        print_error "npm أو pnpm غير موجود"
        exit 1
    fi
    
    # Check Git
    if command -v git &> /dev/null; then
        print_success "Git موجود"
    else
        print_error "Git غير مثبت"
        exit 1
    fi
}

###############################################################################
# Setup Backend
###############################################################################

setup_backend() {
    print_header "🐍 إعداد Backend (FastAPI)"
    
    cd "$BACKEND_DIR" || exit 1
    
    # Create virtual environment
    if [ ! -d ".venv" ]; then
        print_info "إنشاء Python virtual environment..."
        python3 -m venv .venv
        print_success "تم إنشاء .venv"
    else
        print_success ".venv موجود بالفعل"
    fi
    
    # Activate venv
    source .venv/bin/activate
    print_success "تم تفعيل virtual environment"
    
    # Upgrade pip
    print_info "تحديث pip..."
    python -m pip install --upgrade pip -q
    
    # Install requirements
    if [ -f "requirements.txt" ]; then
        print_info "تثبيت المتطلبات من requirements.txt..."
        pip install -r requirements.txt -q
        print_success "تم تثبيت متطلبات Python"
    else
        print_error "requirements.txt غير موجود"
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
}

###############################################################################
# Setup Frontend
###############################################################################

setup_frontend() {
    print_header "⚛️  إعداد Frontend (React/Vite)"
    
    cd "$FRONTEND_DIR" || exit 1
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_info "تثبيت المكتبات..."
        
        if command -v pnpm &> /dev/null; then
            print_info "استخدام pnpm للتثبيت..."
            pnpm install
        else
            print_info "استخدام npm للتثبيت..."
            npm install
        fi
        
        print_success "تم تثبيت المكتبات"
    else
        print_success "node_modules موجود بالفعل"
    fi
    
    cd "$SCRIPT_DIR"
}

###############################################################################
# Setup Database
###############################################################################

setup_database() {
    print_header "🗄️  إعداد قاعدة البيانات"
    
    if [ -f "$DB_FILE" ]; then
        print_warning "قاعدة البيانات موجودة بالفعل: $DB_FILE"
        print_info "سيتم إعادة استخدام قاعدة البيانات الموجودة"
        print_info "للبدء برفع نظيف: rm $DB_FILE"
    else
        print_info "إنشاء قاعدة بيانات جديدة..."
        print_info "سيتم إنشاء الجداول عند تشغيل FastAPI"
        print_success "جاهزة للإنشاء (سيتم عند البدء)"
    fi
}

###############################################################################
# Setup Configuration
###############################################################################

setup_configuration() {
    print_header "⚙️  إعداد الإعدادات"
    
    # Check if .env exists
    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        print_info "إنشاء ملف .env..."
        
        cat > "$SCRIPT_DIR/.env" << 'EOF'
# Database Configuration
DATABASE_URL=sqlite:///./haderos_dev.db

# API Configuration
DEBUG=True
API_V1_PREFIX=/api/v1
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:8000,http://127.0.0.1:3000,http://127.0.0.1:8000

# Optional: External Services (leave empty if offline)
OPENAI_API_KEY=
KAIA_SERVICE_URL=http://localhost:8080
KAIA_API_KEY=

# Blockchain (Optional for offline development)
ETH_RPC_URL=
POLYGON_RPC_URL=

# Redis (Optional)
REDIS_URL=redis://localhost:6379/0

# Kafka (Optional)
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Monitoring
PROMETHEUS_ENABLED=True
SENTRY_DSN=
EOF
        
        print_success "تم إنشاء .env"
        print_warning "⚠️  غيّر SECRET_KEY في الإنتاج!"
    else
        print_success ".env موجود بالفعل"
    fi
}

###############################################################################
# Run Backend
###############################################################################

run_backend() {
    print_header "🚀 تشغيل Backend (FastAPI)"
    
    cd "$BACKEND_DIR" || exit 1
    
    # Activate venv
    source .venv/bin/activate
    
    print_info "Backend سيعمل على: http://localhost:$BACKEND_PORT"
    print_info "API Docs: http://localhost:$BACKEND_PORT/api/docs"
    print_info "Health Check: http://localhost:$BACKEND_PORT/health"
    print_info "Metrics: http://localhost:$BACKEND_PORT/metrics"
    print_info ""
    print_warning "اضغط Ctrl+C للإيقاف"
    echo ""
    
    export DATABASE_URL="sqlite:///$DB_FILE"
    export DEBUG="1"
    
    uvicorn backend.main:app \
        --host 127.0.0.1 \
        --port "$BACKEND_PORT" \
        --reload \
        --reload-dirs backend
    
    cd "$SCRIPT_DIR"
}

###############################################################################
# Run Frontend
###############################################################################

run_frontend() {
    print_header "⚛️  تشغيل Frontend (Vite)"
    
    cd "$FRONTEND_DIR" || exit 1
    
    print_info "Frontend سيعمل على: http://localhost:$FRONTEND_PORT"
    print_warning "اضغط Ctrl+C للإيقاف"
    echo ""
    
    if command -v pnpm &> /dev/null; then
        pnpm dev
    else
        npm run dev
    fi
    
    cd "$SCRIPT_DIR"
}

###############################################################################
# Run Both Services (Recommended)
###############################################################################

run_both() {
    print_header "🎯 تشغيل النظام الكامل"
    
    print_info "يتم فتح نافذتي terminal..."
    print_info "تأكد من تثبيت tmux أو استخدم نافذتين منفصلتين"
    echo ""
    
    # Try using tmux if available
    if command -v tmux &> /dev/null; then
        print_info "استخدام tmux..."
        
        # Create new session
        tmux new-session -d -s haderos
        
        # Backend window
        tmux new-window -t haderos -n backend
        tmux send-keys -t haderos:backend "cd '$SCRIPT_DIR' && bash run.sh backend" Enter
        
        # Frontend window
        tmux new-window -t haderos -n frontend
        tmux send-keys -t haderos:frontend "cd '$SCRIPT_DIR' && bash run.sh frontend" Enter
        
        print_success "تم البدء في tmux"
        print_info "إدارة الجلسات:"
        print_info "  - عرض الجلسات: tmux ls"
        print_info "  - الدخول للجلسة: tmux attach -t haderos"
        print_info "  - إغلاق: tmux kill-session -t haderos"
        
        tmux attach -t haderos
    else
        print_warning "tmux غير متوفر"
        print_info "يرجى فتح نافذتي terminal منفصلتين:"
        print_info "  النافذة 1: bash run.sh backend"
        print_info "  النافذة 2: bash run.sh frontend"
    fi
}

###############################################################################
# Main Menu
###############################################################################

show_menu() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}HaderOS Platform - Local Development${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "الخيارات:"
    echo "  1) setup        - إعداد النظام (أول مرة فقط)"
    echo "  2) backend      - تشغيل Backend فقط"
    echo "  3) frontend     - تشغيل Frontend فقط"
    echo "  4) both         - تشغيل النظام كاملاً (موصى به)"
    echo "  5) clean        - حذف المكتبات والملفات المؤقتة"
    echo "  6) reset-db     - حذف قاعدة البيانات (ستُعاد إنشاؤها)"
    echo "  7) help         - عرض المساعدة"
    echo ""
}

show_help() {
    print_header "📚 المساعدة والمعلومات"
    
    echo "📁 هيكل المشروع:"
    echo "  ├── backend/              - FastAPI backend"
    echo "  ├── haderos-mvp/          - React + Vite frontend"
    echo "  ├── smart-contracts/      - Solidity contracts"
    echo "  └── .env                  - ملف الإعدادات"
    echo ""
    
    echo "🌐 الروابط بعد التشغيل:"
    echo "  • Frontend:   http://localhost:3000"
    echo "  • Backend:    http://localhost:8000"
    echo "  • API Docs:   http://localhost:8000/api/docs"
    echo "  • Health:     http://localhost:8000/health"
    echo "  • Metrics:    http://localhost:8000/metrics"
    echo ""
    
    echo "💾 ملفات قاعدة البيانات:"
    echo "  • SQLite DB:  $DB_FILE"
    echo "  • Log:        haderos_dev.log"
    echo ""
    
    echo "🔧 حل المشاكل الشائعة:"
    echo ""
    echo "  ❌ خطأ: Port already in use"
    echo "  ✅ الحل: غيّر PORT في الأوامر أو أغلق التطبيق القديم"
    echo ""
    
    echo "  ❌ خطأ: Module not found"
    echo "  ✅ الحل: أعد تشغيل setup: bash run.sh setup"
    echo ""
    
    echo "  ❌ خطأ: Database locked"
    echo "  ✅ الحل: احذف قاعدة البيانات: bash run.sh reset-db"
    echo ""
    
    echo "🌍 العمل بدون إنترنت:"
    echo "  • بعد التثبيت الأول، سيعمل النظام كاملاً بدون إنترنت"
    echo "  • لا تحتاج إلى APIs خارجية للعمل المحلي الأساسي"
    echo "  • جميع البيانات مخزنة محليًا في SQLite"
    echo ""
    
    echo "📝 أوامر مفيدة:"
    echo "  • إعادة تثبيت المكتبات: bash run.sh clean && bash run.sh setup"
    echo "  • بدء جديد: bash run.sh reset-db && bash run.sh setup"
    echo "  • التحقق من الصحة: curl http://localhost:8000/health"
    echo ""
}

###############################################################################
# Main Script Logic
###############################################################################

main() {
    case "${1:-help}" in
        setup)
            check_prerequisites
            setup_backend
            setup_frontend
            setup_database
            setup_configuration
            print_header "✅ تم الإعداد بنجاح!"
            print_info "شغّل النظام بـ: bash run.sh both"
            ;;
        backend)
            run_backend
            ;;
        frontend)
            run_frontend
            ;;
        both)
            check_prerequisites
            setup_backend
            run_both
            ;;
        clean)
            print_header "🧹 تنظيف المشروع"
            
            print_info "حذف node_modules..."
            rm -rf "$FRONTEND_DIR/node_modules"
            print_success "تم"
            
            print_info "حذف Python cache..."
            find "$BACKEND_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
            find "$BACKEND_DIR" -type f -name "*.pyc" -delete
            print_success "تم"
            
            print_info "حذف .venv..."
            rm -rf "$BACKEND_DIR/.venv"
            print_success "تم"
            
            print_success "اكتمل التنظيف"
            ;;
        reset-db)
            print_header "🔄 إعادة تعيين قاعدة البيانات"
            
            if [ -f "$DB_FILE" ]; then
                print_warning "حذف: $DB_FILE"
                rm "$DB_FILE"
                print_success "تم الحذف"
            else
                print_info "قاعدة البيانات غير موجودة"
            fi
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            show_menu
            echo "استخدم: bash run.sh <command>"
            echo ""
            echo "أمثلة:"
            echo "  bash run.sh setup     # إعداد أول مرة"
            echo "  bash run.sh both      # تشغيل النظام كاملاً"
            echo "  bash run.sh backend   # تشغيل Backend فقط"
            echo "  bash run.sh help      # عرض المساعدة"
            ;;
    esac
}

# Run main function with all arguments
main "$@"
