import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDb } from "./config/dbConnect.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
// import { fileURLToPath } from "url";
// import path from "path";

// handle uncaught exceptions
// process.on("uncaughtException", (err) => {
//   console.log(`Error:${err}`);
//   console.log("shutting down server due to uncaught exception");
//   process.exit(1);
// });

const app = express();
dotenv.config({ path: "config/config.env" });
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

connectDb();

app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// app.use(express.static(path.join(__dirname, "../frontend/build")));
// app.get("*", (req, res) => {
//   res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
// });

import productRouter from "./routes/productRoute.js";
import userRouter from "./routes/userRoute.js";
import orderRouter from "./routes/orderRoute.js";
import paymentRouter from "./routes/paymentRoute.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/", productRouter, orderRouter);
app.use("/api/v1/", paymentRouter);

app.use(errorMiddleware);

const server = app.listen(process.env.PORT || 4000, () => {
  console.log(`server started on http://localhost:${process.env.PORT || 4000}`);
});

// handling unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error:${err}`);
  console.log("shutting down server due to uncaught exception");
  process.exit(1);
});
