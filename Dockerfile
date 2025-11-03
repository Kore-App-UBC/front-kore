FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies (we need dev deps for the export step)
COPY package*.json ./
RUN npm install --silent

# Copy project files
COPY . .
COPY .env.production .env

# Export web build (output -> web-build)
RUN npx expo export --platform web --output-dir web-build --non-interactive

# Serve with nginx
FROM nginx:stable-alpine AS runner

# Copy exported site
COPY --from=builder /app/web-build /usr/share/nginx/html

# SPA fallback and caching for static assets
RUN rm /etc/nginx/conf.d/default.conf \
 && cat > /etc/nginx/conf.d/default.conf <<'NGINX_CONF'
server {
  listen 80;
  server_name localhost;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /static/ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }
}
NGINX_CONF

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]