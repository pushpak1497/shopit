import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
export const connectDb = async () => {
  console.log(process.env.DB_LOCAL_URI);
  await mongoose
    .connect(process.env.DB_LOCAL_URI)
    .then((con) =>
      console.log(`mongodb connected at host at ${con?.connection?.host}`)
    );
};