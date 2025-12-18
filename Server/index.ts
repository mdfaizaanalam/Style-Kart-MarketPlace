import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';

import { connectDB } from './data/DB';

import rateLimiterMiddleware from './middleware/rateLimit';
import authenticateToken from './middleware/header_auth';

import routes from './routes';
import sellerRoutes from "./routes/seller";
import sellerOrdersRoutes from "./routes/sellerOrders";  // ✅ ADD THIS
import aiChat from "./routes/aiChat";
import returnRoutes from "./routes/returns";
import cancelRoutes from "./routes/cancel";

const app: Express = express();
app.set('trust proxy', true);
const port = process.env.PORT || 3500;

// -----------------------------------------
// ✅ GLOBAL MIDDLEWARE
// -----------------------------------------
app.use(rateLimiterMiddleware);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(helmet());

const origin_url = process.env.FRONTEND_SERVER_ORIGIN as string;

app.use(cors({
  origin: origin_url,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
}));

// -----------------------------------------
// ✅ PUBLIC ROUTES
// -----------------------------------------
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Success" });
});

// ✅ Seller routes (authentication handled inside)
app.use("/api/seller", sellerRoutes);
app.use("/api/seller", sellerOrdersRoutes);  // ✅ ADD THIS LINE

// Mount all order-related routes
app.use("/api/returns", returnRoutes);
app.use("/api/cancel", cancelRoutes);

// AI Chat endpoint (NO AUTH REQUIRED)
app.use("/api/ai-chat", aiChat);

// -----------------------------------------
// ✅ PROTECTED ROUTES
// -----------------------------------------
app.use(authenticateToken);
app.use("/api", routes);

// -----------------------------------------
// 🔥 START SERVER
// -----------------------------------------
const startServer = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`[server]: Server running at port ${port}`);
  });
};

startServer();
