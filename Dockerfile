# Build static assets
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps first for better caching
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .

# Vite env vars are baked at build time
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

RUN npm run build

# Serve with nginx
FROM nginx:1.27-alpine

# SPA routing support
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Static dist
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
