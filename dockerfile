# Use Node.js 20 (latest LTS version) as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json into the container
COPY package*.json ./

# Install dependencies (including devDependencies for Vite)
RUN npm install --include=dev

# Copy all the source code into the container
COPY . .

# Build the application
RUN npm run build --verbose

# Expose the new port (adjust if you are using a different port)
EXPOSE 3002

# Start the app using Vite's preview mode
CMD ["npm", "run", "preview", "--", "--host", "--port", "3002"]
