FROM alpine:3.20
RUN apk add --no-cache bash mariadb-client curl coreutils tzdata
ENV BACKUP_INTERVAL_SECONDS=14400
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]