# TLS certificates

Mount or copy your TLS certificate and private key here so the nginx container can pick them up:

| File | Purpose |
| --- | --- |
| `cert.pem` | Full-chain certificate (`fullchain.pem` from Let's Encrypt / certbot) |
| `key.pem` | Private key (`privkey.pem` from Let's Encrypt / certbot) |

These files are gitignored. When both are present the `web` container serves HTTPS on
port 443 and redirects port 80 to it. When they are absent the container falls back to
HTTP-only mode (development).

### Let's Encrypt with certbot

```bash
sudo certbot certonly --standalone -d example.com -d www.example.com
sudo cp /etc/letsencrypt/live/example.com/fullchain.pem ./client/deploy/certs/cert.pem
sudo cp /etc/letsencrypt/live/example.com/privkey.pem  ./client/deploy/certs/key.pem
sudo chmod 644 ./client/deploy/certs/*.pem
docker compose --profile app up -d web
```

Renew certificates with a cron job that re-runs the copy and restarts `web`:

```bash
0 0 1 * * certbot renew --quiet && \
  cp /etc/letsencrypt/live/example.com/fullchain.pem /path/to/Portfolio/client/deploy/certs/cert.pem && \
  cp /etc/letsencrypt/live/example.com/privkey.pem  /path/to/Portfolio/client/deploy/certs/key.pem && \
  docker compose --profile app restart web
```