# 🛒 StyleKart - AI-Powered E-Commerce Marketplace

[![StackHack 3.0](https://img.shields.io/badge/StackHack-3.0-blue)](https://xathon.mettl.com/event/stackhack-3)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

>Production-ready full-stack marketplace application enabling customers to discover, compare, and purchase products from multiple sellers with **real-time Stripe payments**, AI-powered customer support, comprehensive order tracking, and complete return/cancellation management.

**Built for StackHack 3.0 Hackathon by Mercer | Mettl**

---

## 🌐 Live Demo

🚀 **Live Application**: [https://stylekarts.netlify.app](YOUR_LIVE_LINK_HERE)

***

## 📋 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Local Development Setup](#-local-development-setup)
- [Production Deployment](#-production-deployment)
  - [Database Deployment (Supabase)](#1-database-deployment-supabase)
  - [Backend Deployment (Render)](#2-backend-deployment-render)
  - [Frontend Deployment (Netlify)](#3-frontend-deployment-netlify)
- [Additional Resources](#-additional-resources)

***

## 🎯 Overview

StyleKart is a modern, production-grade e-commerce marketplace that connects customers with multiple sellers across diverse product categories. Built with **Next.js 14**, **TypeScript**, **Node.js**, and **PostgreSQL**, it delivers a seamless end-to-end shopping experience featuring:

- 💳 **Live Stripe Payment Integration** (Card + COD)
- 🤖 **OpenAI-Powered Customer Support Chatbot**
- 📦 **Real-Time Order Tracking with Email Notifications**
- 🔄 **7-Day Return Window with Approval Workflow**
- ⭐ **Verified Product Reviews & Ratings**
- 🏪 **Comprehensive Seller Dashboard**
- 🔐 **JWT-Based Authentication with Role Management**

### 🏆 Hackathon Context

Developed for **StackHack 3.0**, Mercer | Mettl's premier full-stack coding hackathon, this project showcases innovation in marketplace applications, AI integration, payment processing, and modern development practices.

***

## 💡 Problem Statement

**Challenge**: Build a marketplace application that allows customers to discover, compare, and purchase digital or physical products from multiple sellers, with complete order management and real-time delivery tracking.

**Solution**: StyleKart addresses this challenge by providing:
- Multi-seller product listings with comparison features
- Secure payment processing with multiple payment methods
- Complete order lifecycle management from placement to delivery
- AI-powered customer assistance available 24/7
- Comprehensive seller tools for inventory and order management

***

## ✨ Key Features

### 🛍️ Customer Experience

#### Shopping & Discovery
- **Advanced Product Search**: Fuzzy search across product names, descriptions, and tags
- **Smart Filtering**: Filter by category, price range, ratings, and availability
- **Product Comparison**: Side-by-side comparison of products from different sellers
- **AI Recommendations**: Personalized product suggestions based on browsing behavior
- **Wishlist Management**: Save products for later purchase
- **Dynamic Cart**: Real-time cart updates with quantity management

#### Payment System (Live & Working)
- 💳 **Stripe Card Payments**: Real-time payment processing with Payment Intent API
- 💵 **Cash on Delivery (COD)**: Option for customers preferring offline payment
- 🔒 **Secure Checkout**: PCI-compliant payment handling
- 📧 **Payment Confirmation**: Instant email notifications with payment receipts
- 💰 **Order Summary**: Clear breakdown of pricing, taxes, and discounts

#### Order Management & Tracking
- **Real-Time Status Updates**: Visual timeline tracking order progression
- **Order Lifecycle**: `Placed → Confirmed → Shipped → Out for Delivery → Delivered`
- **Order History**: Complete purchase history with detailed information
- **Email Notifications**: Automated updates at each order stage
- **Delivery Tracking**: Estimated delivery dates and real-time status

#### Return & Cancellation System
- **Order Cancellation**: Cancel eligible orders before shipment begins
- **7-Day Return Window**: Request returns within 7 days after delivery
- **Return Workflow**: 
  - Customer initiates return request with reason
  - Seller reviews and approves/rejects request
  - Status tracking: `Return Requested → Approved/Rejected → Returned`
- **Refund Processing**: Automated refund initiation for approved returns
- **Separate Views**: Dedicated pages for cancelled and returned orders

#### Reviews & Ratings
- ⭐ **5-Star Rating System**: Rate products from 1 to 5 stars
- ✅ **Verified Reviews Only**: Only customers with delivered, non-returned orders can review
- 📝 **Detailed Reviews**: Write comprehensive product feedback
- ✏️ **Edit/Delete Reviews**: Manage your own reviews anytime
- 📊 **Average Ratings**: Overall product ratings visible on product pages

#### AI Customer Support
- 🤖 **OpenAI GPT-4 Integration**: Intelligent chatbot for customer assistance
- 🌐 **24/7 Availability**: Instant responses without waiting for human support
- 🎯 **Context-Aware Responses**: Handles queries about:
  - Product information and recommendations
  - Order status and tracking
  - Payment, cancellation, and return policies
  - Account management and shipping
- 💬 **Natural Conversations**: Human-like interaction for better user experience

***

### 🏪 Seller Features

#### Seller Dashboard
- 🔐 **Secure Authentication**: JWT-based login with email/password
- 📊 **Dashboard Overview**: Quick stats on products, orders, and revenue
- 🛒 **Product Management**:
  - Add new products with images, descriptions, pricing, and inventory
  - Update existing product details and stock levels
  - Remove products from marketplace
  - Bulk inventory updates
- 📦 **Order Management**:
  - View all customer orders with filtering options
  - Update order status (Confirmed, Shipped, Delivered)
  - Process cancellation requests
  - Handle return requests (Approve/Reject)
- 🏪 **Marketplace View**: Browse competitor products to analyze pricing and trends
- 📈 **Sales Analytics**: Track revenue generated and order statistics

***

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 14+** | React framework with App Router for server-side rendering |
| **TypeScript** | Type-safe development with enhanced IDE support |
| **Tailwind CSS** | Utility-first CSS framework for responsive design |
| **Redux Toolkit** | State management for cart, user, and order data |
| **Framer Motion** | Smooth animations and transitions |
| **Axios** | HTTP client for API communication |
| **Stripe.js** | Client-side payment processing |
| **Deployed on** | **Netlify** with automatic deployments |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js 18+** | JavaScript runtime for server-side execution |
| **Express.js** | Web framework for RESTful API development |
| **TypeScript** | Type-safe server-side code |
| **JWT + bcrypt** | Authentication and password hashing |
| **Stripe API** | Payment processing integration |
| **OpenAI API** | AI chatbot integration |
| **Nodemailer** | SMTP email service for notifications |
| **Deployed on** | **Render** with continuous deployment |

### Database
| Technology | Purpose |
|------------|---------|
| **PostgreSQL 14+** | Relational database for data persistence |
| **pg (node-postgres)** | PostgreSQL client for Node.js |
| **Hosted on** | **Supabase** with automatic backups |

***

## 🏗️ Architecture

### Production Deployment Architecture
```
┌─────────────────────┐         ┌──────────────────────┐         ┌─────────────────────┐
│   Netlify CDN       │         │    Render Server     │         │   Supabase          │
│   (Next.js App)     │◄───────►│   (Express API)      │◄───────►│   (PostgreSQL)      │
│   Static Hosting    │         │   Auto-scaling       │         │   Managed Database  │
└─────────────────────┘         └──────────────────────┘         └─────────────────────┘
         │                               │                                │
         │                               │                                │
         ▼                               ▼                                ▼
┌─────────────────────┐         ┌──────────────────────┐         ┌─────────────────────┐
│   Stripe API        │         │   OpenAI API         │         │   Email (SMTP)      │
│   Payment Gateway   │         │   AI Chatbot         │         │   Notifications     │
└─────────────────────┘         └──────────────────────┘         └─────────────────────┘
```

***

## 🚀 Local Development Setup

### Prerequisites

Before you begin, ensure you have:
- **Node.js** 18+ and npm
- **PostgreSQL** 14+ (for local development)
- **Git** for version control

You'll also need accounts for:
- **Stripe** (for payment processing)
- **OpenAI** (for AI chatbot)
- **Gmail/SMTP** (for email notifications)

### Quick Start

1. **Clone Repository**:
```bash
git clone https://github.com/mdfaizaanalam/Sell.git
cd Sell
```

2. **Database Setup**:
```bash
# Create database
createdb stylekart

# Import schema
psql -U your_username -d stylekart -f schema.sql
psql -U your_username -d stylekart -f ecommerce.sql
```

3. **Backend Setup**:
```bash
cd Server
npm install
cp .env.example .env  # Create and configure .env
npm run dev  # Runs on http://localhost:3500
```

4. **Frontend Setup**:
```bash
cd Client
npm install
cp .env.local.example .env.local  # Create and configure .env.local
npm run dev  # Runs on http://localhost:3000
```

For detailed local setup instructions, see the [Local Development Guide](#local-development-guide) section below.

***

## 🌐 Production Deployment

Deploy your StyleKart marketplace to production using this modern cloud stack:

- **Database**: Supabase (Managed PostgreSQL)
- **Backend API**: Render (Express.js server)
- **Frontend**: Netlify (Next.js static site)

***

## 1. Database Deployment (Supabase)

[Supabase](https://supabase.com) provides managed PostgreSQL with automatic backups and scaling.

### Step 1: Create Supabase Project

1. **Sign up** at [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Configure project:
   - **Name**: `stylekart-db`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for development

### Step 2: Get Database Connection Details

1. Go to **Project Settings** → **Database**
2. Copy the **Connection String** (URI format):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
3. Note individual connection details:
   - **Host**: `db.xxx.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: Your project password

### Step 3: Import Database Schema

**Option A: Using Supabase SQL Editor** (Recommended)
1. Go to **SQL Editor** in Supabase dashboard
2. Click **"New Query"**
3. Copy entire content from `schema.sql`
4. Click **"Run"** to execute
5. Repeat for `ecommerce.sql` (sample data)

**Option B: Using psql CLI**
```bash
# Set connection string as environment variable
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"

# Import schema
psql $DATABASE_URL -f schema.sql
psql $DATABASE_URL -f ecommerce.sql
```

### Step 4: Configure Connection Pooling (Important for Render)

1. Go to **Project Settings** → **Database**
2. Find **Connection Pooling** section
3. Enable **"Transaction"** mode
4. Copy the **Pooler Connection String** (use this for Render):
   ```
   postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

✅ **Supabase Setup Complete!** Your database is now live and ready.

***

## 2. Backend Deployment (Render)

[Render](https://render.com) provides free hosting for backend services with automatic deployments.

--- 

### Step 1: Create Render Web Service

1. **Sign up** at [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your **GitHub repository**
4. Configure service:
   - **Name**: `stylekart-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `Server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (sufficient for hackathons)

### Step 2: Configure Environment Variables

In Render dashboard, add these environment variables:

```env
# Database (Use Supabase Pooler Connection String)
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres

# Or use individual variables
DB_USER=postgres
DB_PASS=your_supabase_password
DB_HOST=db.xxx.supabase.co
DB_PORT=6543
DB_NAME=postgres

# Server Configuration
PORT=3500
NODE_ENV=production
FRONTEND_SERVER_ORIGIN=https://your-app.netlify.app

# JWT Secret (Generate strong key)
JWT_ENCRYPTION_KEY=your_super_secret_jwt_key_minimum_32_characters_long
JWT_AUTH_KEY=secret_key (Authorization key for Secure Frontend & Backend Communication)

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key

# SMTP Email Configuration
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SUPPORT=support@yourdomain.com
SMTP_SENDERNAME=StyleKart Support

# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Step 3: Deploy Backend

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build TypeScript code
   - Start the server
3. Wait for deployment (3-5 minutes)
4. Note your backend URL: `https://stylekart-api.onrender.com`
---

## 3. Frontend Deployment (Netlify)

[Netlify](https://netlify.com) provides free hosting for Next.js applications with automatic deployments.
---

### Step 1: Create Netlify Site

1. **Sign up** at [netlify.com](https://netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your **GitHub repository**
4. Configure build settings:
   - **Base directory**: `Client`
   - **Build command**: `npm run build`
   - **Publish directory**: `Client/.next`
   - **Node version**: `18`

### Step 3: Configure Environment Variables

In Netlify dashboard (**Site settings** → **Environment variables**):

```env
# Backend API URL (Your Render backend URL)
NEXT_PUBLIC_BACKEND_URL=https://stylekart-api.onrender.com

# Internal Backend URL
BACKEND_URL=https://stylekart-api.onrender.com

# JWT Secret (Must match backend)
JWT_ENCRYPTION_KEY=your_super_secret_jwt_key_minimum_32_characters_long
JWT_AUTH_KEY=secret_key (Authorization key for Secure Frontend & Backend Communication)

# Stripe Public Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

```

### Step 5: Deploy Frontend


### Step 8: Test Complete Application

1. Visit your Netlify URL
2. Test key features:
   - ✅ Product browsing
   - ✅ Seller login
   - ✅ Add products to cart
   - ✅ Checkout with Stripe
   - ✅ AI chatbot
   - ✅ Order tracking


***


## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Render Documentation](https://render.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Stripe Integration Guide](https://stripe.com/docs)

***

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

***

## 👨‍💻 Author

**MD Faizaan Alam**

- 🌐 GitHub: [@mdfaizaanalam](https://github.com/mdfaizaanalam)
- 💼 LinkedIn: [Connect with me](https://linkedin.com/in/yourprofile)

***

## 🙏 Acknowledgments

- **StackHack 3.0** - Mercer | Mettl for organizing the hackathon
- **Supabase** - For managed PostgreSQL database hosting
- **Render** - For free backend hosting with continuous deployment
- **Netlify** - For blazing-fast frontend hosting and CDN
- **Stripe** - For seamless payment processing API
- **OpenAI** - For GPT-powered chatbot integration

***

**⭐ If you find this project helpful, please star it on GitHub!**