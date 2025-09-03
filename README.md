# Pharmacy-Management

## Frontend Deployment Instructions

### Prerequisites
- Node.js (v16 or above recommended)
- npm (v8 or above recommended)

### Steps to Deploy

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```
   This will run the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

3. **Build for production:**
   ```bash
   npm run build
   ```
   This will create an optimized production build in the `build` folder.

4. **Serve the production build (optional):**
   You can use a static server like `serve` to preview the production build:
   ```bash
   npm install -g serve
   serve -s build
   ```
   Then open [http://localhost:5000](http://localhost:5000) to view the production build.

### Notes
- Make sure you have the correct Node.js and npm versions installed. You can check your versions with:
  ```bash
  node -v
  npm -v
  ```
- For deployment to cloud platforms (Vercel, Netlify, etc.), follow their specific instructions for React apps.
