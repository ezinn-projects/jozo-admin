# Build stage
FROM node:20 AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --include=dev

# Copy source code
COPY . .

# Build argument cho file .env nếu cần
ARG ENV_FILE=.env.develop
COPY ${ENV_FILE} .env

# Build app với đúng mode (nếu dùng Vite)
RUN npm run build -- --mode $(echo ${ENV_FILE} | cut -d. -f3)

# Production stage - serve bằng vite preview
FROM node:20

WORKDIR /app

# Copy built files và cài vite global
COPY --from=build /app/dist ./dist
RUN npm install -g vite

# Chạy vite preview (mặc định chạy cổng 4173, bạn sẽ đổi sang 3002)
EXPOSE 3002

CMD ["vite", "preview", "--port", "3002", "--host"]
