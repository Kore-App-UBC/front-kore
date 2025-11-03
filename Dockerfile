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
# Use a static nginx config file instead of a heredoc so Dockerfile parser
# doesn't see the nginx `server { ... }` block as a separate instruction.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]