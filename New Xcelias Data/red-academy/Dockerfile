# Persistent, single-server application. Node 22.16+ is required.
# Deploy only behind HTTPS. Bind-mount the imported ./data directory; never bake personal records into an image.
FROM node:22-bookworm-slim
WORKDIR /app
COPY --chown=node:node . .
RUN mkdir -p /app/data /app/backups && chown -R node:node /app/data /app/backups
ENV HOST=0.0.0.0 PORT=3000 DATABASE_MODE=sqlite DATABASE_PATH=/app/data/red-academy.db
USER node
EXPOSE 3000
VOLUME ["/app/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:3000/api/session').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","server.mjs"]
