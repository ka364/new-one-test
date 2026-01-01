# HADEROS SIEM Stack
## Security Information and Event Management

---

## Overview

This directory contains the complete SIEM (Security Information and Event Management) infrastructure for HADEROS, built on the ELK Stack (Elasticsearch, Logstash, Kibana) with Elastalert2 for real-time security alerting.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      HADEROS SIEM Stack                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │  HADEROS    │     │   Nginx     │     │  PostgreSQL │       │
│  │    App      │     │   Logs      │     │    Logs     │       │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘       │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             │                                   │
│                    ┌────────▼────────┐                         │
│                    │    Filebeat     │                         │
│                    │  (Log Shipper)  │                         │
│                    └────────┬────────┘                         │
│                             │                                   │
│                    ┌────────▼────────┐                         │
│                    │    Logstash     │                         │
│                    │   (Processing)  │                         │
│                    └────────┬────────┘                         │
│                             │                                   │
│                    ┌────────▼────────┐                         │
│                    │  Elasticsearch  │                         │
│                    │   (Storage)     │                         │
│                    └────────┬────────┘                         │
│                             │                                   │
│              ┌──────────────┼──────────────┐                   │
│              │              │              │                   │
│     ┌────────▼────────┐    ┌▼─────────────┐                   │
│     │     Kibana      │    │  Elastalert  │                   │
│     │  (Dashboard)    │    │  (Alerting)  │                   │
│     └─────────────────┘    └──────────────┘                   │
│                                    │                           │
│                             ┌──────▼──────┐                   │
│                             │   Alerts    │                   │
│                             │ Email/Slack │                   │
│                             └─────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- 8GB+ RAM available
- 50GB+ disk space

### 1. Set Environment Variables

```bash
# Create .env file
cat > .env << EOF
ELASTIC_PASSWORD=HaderosSecure2025!
KIBANA_PASSWORD=HaderosKibana2025!
KIBANA_ENCRYPTION_KEY=$(openssl rand -base64 32)
HADEROS_ENV=production
EOF
```

### 2. Start the Stack

```bash
cd infrastructure/siem
docker-compose up -d
```

### 3. Verify Services

```bash
# Check all services are running
docker-compose ps

# Check Elasticsearch health
curl -u elastic:HaderosSecure2025! http://localhost:9200/_cluster/health

# Access Kibana
open http://localhost:5601
```

---

## Components

### Elasticsearch (Port 9200)
- Search and analytics engine
- Stores all security logs
- Provides fast querying

### Logstash (Ports 5044, 5000)
- Data processing pipeline
- Parses and enriches logs
- Detects security events

### Kibana (Port 5601)
- Visualization dashboard
- Security event monitoring
- Alert management

### Filebeat
- Lightweight log shipper
- Collects from multiple sources
- Ships to Logstash

### Elastalert2
- Real-time alerting
- Rule-based detection
- Email/Slack notifications

---

## Security Detection Rules

### Pre-configured Alerts

| Alert Name | Severity | Description |
|------------|----------|-------------|
| SQL Injection | Critical | Detects SQL injection patterns |
| Failed Auth | Medium | 5+ failed logins in 10 minutes |
| XSS Attempt | High | Cross-site scripting patterns |
| Path Traversal | High | Directory traversal attempts |
| Secret Exposure | Critical | API keys in logs |
| Privilege Escalation | High | Unauthorized admin access |

---

## Configuration Files

```
infrastructure/siem/
├── docker-compose.yml          # Main orchestration
├── .env                        # Environment variables
├── README.md                   # This file
└── config/
    ├── elasticsearch.yml       # ES configuration
    ├── logstash.conf          # Processing pipeline
    ├── logstash.yml           # Logstash settings
    ├── filebeat.yml           # Log collection
    ├── kibana.yml             # Dashboard settings
    └── elastalert/
        ├── config.yaml        # Alerting config
        └── rules/
            ├── critical-security-alerts.yaml
            ├── failed-auth-alert.yaml
            └── sql-injection-alert.yaml
```

---

## Integrating HADEROS Application

### Send Logs via TCP (Recommended)

```typescript
// apps/haderos-web/server/_core/siem-logger.ts
import net from 'net';

const SIEM_HOST = process.env.SIEM_HOST || 'localhost';
const SIEM_PORT = parseInt(process.env.SIEM_PORT || '5000');

export function sendToSIEM(logEntry: object): void {
  const client = new net.Socket();

  client.connect(SIEM_PORT, SIEM_HOST, () => {
    client.write(JSON.stringify(logEntry) + '\n');
    client.destroy();
  });

  client.on('error', (err) => {
    console.error('SIEM connection error:', err);
  });
}

// Usage
sendToSIEM({
  timestamp: new Date().toISOString(),
  level: 'info',
  app: 'haderos',
  message: 'User login successful',
  userId: 'user123',
  client_ip: '192.168.1.100'
});
```

### Winston Transport

```typescript
// Add to existing logger
import { transports } from 'winston';

const siemTransport = new transports.Http({
  host: 'localhost',
  port: 5000,
  path: '/',
  ssl: false
});

logger.add(siemTransport);
```

---

## Kibana Dashboards

After starting the stack, import these dashboards:

1. **Security Overview**
   - Total events by severity
   - Top attacking IPs
   - Attack type distribution

2. **Authentication Monitor**
   - Login success/failure rate
   - Failed login heatmap
   - User activity timeline

3. **API Security**
   - Request rate by endpoint
   - Error rate trends
   - Response time percentiles

---

## Maintenance

### Backup Elasticsearch Data

```bash
# Create snapshot repository
curl -X PUT "localhost:9200/_snapshot/haderos_backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/backup"
  }
}'

# Create snapshot
curl -X PUT "localhost:9200/_snapshot/haderos_backup/snapshot_1?wait_for_completion=true"
```

### Index Lifecycle Management

Data retention is configured via ILM policies:
- Hot phase: 7 days (SSD storage)
- Warm phase: 30 days (standard storage)
- Delete: After 90 days

### Scaling

For production, consider:
- 3-node Elasticsearch cluster
- Dedicated Logstash instances
- Load balancer for Kibana

---

## Troubleshooting

### Elasticsearch Not Starting

```bash
# Check logs
docker logs haderos-elasticsearch

# Common fix: increase vm.max_map_count
sudo sysctl -w vm.max_map_count=262144
```

### Logstash Connection Issues

```bash
# Check Logstash logs
docker logs haderos-logstash

# Test Elasticsearch connection
docker exec haderos-logstash curl -u elastic:password http://elasticsearch:9200
```

### Kibana Access Denied

```bash
# Reset kibana_system password
docker exec haderos-elasticsearch bin/elasticsearch-reset-password -u kibana_system
```

---

## Security Hardening

For production deployment:

1. **Enable TLS/SSL** for all components
2. **Network isolation** - internal network only
3. **Strong passwords** - use secrets manager
4. **RBAC** - create specific roles for users
5. **Audit logging** - enable in Elasticsearch
6. **IP whitelisting** - restrict Kibana access

---

## Support

- **Documentation**: `/docs/governance/`
- **Security Team**: security@haderos.io
- **On-call**: Refer to IRP for escalation

---

**Version**: 1.0.0
**Last Updated**: 2025-01-01
**Owner**: HADEROS Security Team
