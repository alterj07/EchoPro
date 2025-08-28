# EchoPro Deployment Guide

## 🚀 Quick Fix for Current CORS Issue

Your Vercel frontend is trying to call `localhost:3000` which causes CORS errors. 

### **Immediate Solution - Set Environment Variable in Vercel:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your EchoPro project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.render.com/api` (your Render backend URL)
5. **Redeploy** your frontend

---

## 🎯 Backend Deployment to Render

### **Step 1: Prepare Backend**
```bash
cd backend
npm install
```

### **Step 2: Deploy to Render**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Sign in with GitHub
3. Click **New** → **Web Service**
4. Connect your `EchoPro` repository
5. Set **Root Directory** to `backend`
6. Set **Build Command**: `npm install`
7. Set **Start Command**: `npm start`
8. Click **Create Web Service**

### **Step 3: Configure Environment Variables in Render**
1. In your Render web service, go to **Environment** tab
2. Add these environment variables:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   NODE_ENV=production
   PORT=3000
   ```

### **Step 4: Get Your Backend URL**
1. Render will give you a URL like: `https://your-app-name.onrender.com`
2. Your API base URL will be: `https://your-app-name.onrender.com/api`

---

## 🔧 Frontend Configuration

### **Update Vercel Environment Variable:**
- **Name**: `VITE_API_URL`
- **Value**: `https://your-app-name.onrender.com/api`

### **Redeploy Frontend:**
1. In Vercel, go to **Deployments**
2. Click **Redeploy** on your latest deployment
3. Or push a new commit to trigger auto-deploy

---

## 🌐 Alternative Backend Hosting

### **Railway (Recommended)**
- ✅ Free tier available
- ✅ Easy MongoDB integration
- ✅ Automatic HTTPS
- ✅ Good performance

### **Heroku**
- ✅ Free tier (limited)
- ✅ Easy deployment
- ✅ Good documentation

### **Render**
- ✅ Free tier available
- ✅ Good performance
- ✅ Easy setup

### **DigitalOcean App Platform**
- ✅ Reliable
- ✅ Good performance
- ⚠️ Paid only

---

## 🔒 Security Checklist

- [ ] Backend deployed to production
- [ ] MongoDB connection string secured
- [ ] CORS properly configured
- [ ] Environment variables set in Vercel
- [ ] Frontend redeployed with new config

---

## 🧪 Testing Production

1. **Test Backend Health**: Visit `https://your-backend.railway.app/health`
2. **Test Frontend**: Visit your Vercel URL
3. **Test Signup/Login**: Should work without CORS errors
4. **Test API Calls**: Check browser console for successful requests

---

## 🆘 Troubleshooting

### **CORS Still Failing?**
- Check that `VITE_API_URL` is set correctly in Vercel
- Ensure backend URL is accessible
- Verify backend CORS configuration

### **Backend Not Starting?**
- Check Railway logs
- Verify environment variables
- Ensure MongoDB connection string is correct

### **Frontend Not Updating?**
- Force redeploy in Vercel
- Clear browser cache
- Check environment variable is set correctly

---

## 📞 Need Help?

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com) 