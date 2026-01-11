import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import testRoutes from "./routes/test.routes.js";

const app = express();
app.use(express.json());

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "X-Api-Key", "X-Api-Secret"],
}));

app.use("/api/v1/payments", paymentRoutes);

app.use(healthRoutes);
app.use(orderRoutes);
app.use(paymentRoutes);
app.use(testRoutes);

export default app;
