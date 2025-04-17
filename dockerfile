# Build stage
FROM node:20 as build

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --include=dev

# Copy source code
COPY . .

# Build argument for environment file
ARG ENV_FILE=.env.develop

# Copy the appropriate env file
COPY ${ENV_FILE} .env

# Build the application with the correct mode
RUN npm run build -- --mode $(echo ${ENV_FILE} | cut -d. -f3)

# Production stage
FROM nginx:alpine

# Copy the built files to Nginx serve directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx configuration (if you have custom config)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
