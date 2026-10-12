#!/bin/sh
# Render the server block before nginx starts.
# When certificates are mounted under /etc/nginx/ssl, serve HTTPS and redirect HTTP.
# Otherwise fall back to plain HTTP (dev-only).
set -e

SSL_CERT=${SSL_CERT:-/etc/nginx/ssl/cert.pem}
SSL_KEY=${SSL_KEY:-/etc/nginx/ssl/key.pem}
SSL_CONF=${SSL_CONF:-/etc/nginx/conf.d/ssl.conf}

cat > "$SSL_CONF" <<'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 25m;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;
    gzip_min_length 1024;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    location /api/ {
        proxy_pass http://api_server;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location /uploads/ {
        proxy_pass http://api_server;
        proxy_set_header Host $host;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location = /metrics {
        return 404;
    }

    location /healthz {
        proxy_pass http://api_server/healthz;
    }

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;

        location ~* \.(js|css|svg|woff2?)$ {
            expires 365d;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

if [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
  cat > "$SSL_CONF" <<'EOF'
server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    client_max_body_size 25m;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location /api/ {
        proxy_pass http://api_server;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location /uploads/ {
        proxy_pass http://api_server;
        proxy_set_header Host $host;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location = /metrics {
        return 404;
    }

    location /healthz {
        proxy_pass http://api_server/healthz;
    }

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;

        location ~* \.(js|css|svg|woff2?)$ {
            expires 365d;
            add_header Cache-Control "public, immutable";
        }
    }
}

server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}
EOF
  echo "TLS enabled."
else
  echo "No TLS certificate found; HTTP-only mode."
fi
