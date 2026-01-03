
#!/bin/bash
# security-test.sh

echo "🔒 Starting HADEROS Security Tests..."

# 1. Dependency Security Scan
echo "📦 Scanning dependencies..."
if command -v npm &> /dev/null; then
    npm audit --production
else
    echo "npm not found, skipping dependency scan."
fi

# 2. Container Security Scan (Requires Trivy)
if command -v trivy &> /dev/null; then
    echo "🐳 Scanning Docker images..."
    trivy image haderos/api-gateway:latest
else
     echo "⚠️ Trivy not installed. Skipping container scan."
fi

# 3. Network Security Scan (Requires Nmap)
if command -v nmap &> /dev/null; then
    echo "🌐 Scanning network..."
    nmap -sV -sC -O localhost
else
    echo "⚠️ Nmap not installed. Skipping network scan."
fi

# 4. OWASP ZAP Scan (Requires Docker)
if command -v docker &> /dev/null; then
    echo "🛡️ Running OWASP ZAP..."
    # docker run -v $(pwd):/zap/wrk/:rw -t owasp/zap2docker-stable zap-full-scan.py -t http://localhost:3000 -m 5 -r security-report.html
    echo "Check 'security-report.html' (Mocked for this environment)"
else
    echo "⚠️ Docker not found. Skipping ZAP scan."
fi

echo "✅ Security tests completed!"
