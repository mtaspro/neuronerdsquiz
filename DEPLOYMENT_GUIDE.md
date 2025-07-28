# 🚀 Neuronerds Quiz - Deployment Guide

## 📋 Overview
This project contains both **frontend (React + Vite)** and **backend (Node.js + Express)** in a single repository. Here's how to deploy them separately:

## 🔧 Deployment Strategy

### 1. **Render (Backend Deployment)**
Deploy the Node.js backend to Render.

#### Steps:
1. **Connect Repository to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Backend Service:**
   ```
   Name: neuronerds-quiz-backend
   Runtime: Node
   Build Command: npm install
   Start Command: node server.js
   ```

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=10000
   ```

4. **Deploy:**
   - Render will automatically deploy your backend
   - Note the deployed URL (e.g., `https://neuronerds-quiz-backend.onrender.com`)

### 2. **Vercel (Frontend Deployment)**
Deploy the React frontend to Vercel.

#### Steps:
1. **Connect Repository to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Frontend Build:**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Set Environment Variables:**
   ```
   VITE_API_URL=https://your-render-backend-url.onrender.com
   ```
   ⚠️ **Important:** Replace with your actual Render backend URL

4. **Deploy:**
   - Vercel will automatically build and deploy your frontend

## 🔗 Configuration Files

### `render.yaml` (Backend Configuration)
```yaml
services:
  - type: web
    name: neuronerds-quiz-backend
    runtime: node
    plan: free
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: PORT
        value: 10000
```

### `vercel.json` (Frontend Configuration)
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "routes": [
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot))",
      "dest": "/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## ⚙️ Important Notes

### **Environment Variables Setup:**

#### Render (Backend):
- `MONGO_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: A secure random string for JWT tokens
- `NODE_ENV`: Set to "production"
- `PORT`: Will be automatically set by Render

#### Vercel (Frontend):
- `VITE_API_URL`: Your Render backend URL (must start with `VITE_`)

### **Deployment Order:**
1. **Deploy Backend First** (Render) - Get the backend URL
2. **Update Frontend Config** - Set `VITE_API_URL` to backend URL
3. **Deploy Frontend** (Vercel) - Frontend will connect to backend

## 🔍 Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Ensure your backend has CORS configured for your frontend domain
   - Check that `VITE_API_URL` is correctly set

2. **Environment Variables:**
   - Frontend env vars must start with `VITE_`
   - Backend env vars are set in Render dashboard

3. **Build Failures:**
   - Ensure `package.json` has correct build scripts
   - Check that all dependencies are listed

4. **API Connection Issues:**
   - Verify backend is deployed and accessible
   - Check network requests in browser dev tools
   - Ensure API endpoints match between frontend and backend

## ✅ Verification Steps

After deployment:

1. **Backend Check:**
   - Visit `https://your-backend-url.onrender.com`
   - Should see: "Express + MongoDB Atlas backend is running!"

2. **Frontend Check:**
   - Visit your Vercel frontend URL
   - Navigate to Leaderboard page
   - Should load data from your backend

3. **Full Integration:**
   - Test adding scores through the frontend
   - Verify data persists in MongoDB
   - Check that leaderboard updates in real-time

## 🎯 Success Indicators

- ✅ Backend responds at Render URL
- ✅ Frontend loads at Vercel URL
- ✅ Leaderboard fetches data from backend
- ✅ No CORS errors in browser console
- ✅ Data persists in MongoDB Atlas

Your Neuronerds Quiz is now fully deployed with backend on Render and frontend on Vercel! 🎉