import mongoose from "mongoose";
import { Product } from "../models/productModel.js";
import products from "./data.js";
const seedProducts = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://pushpakvyas1497:Pu$hpak1497@shopitcluster.9wrkd.mongodb.net/"
    );
    await Product.deleteMany();
    console.log("products are deleted");
    await Product.insertMany(products);
    console.log("products are added");
    process.exit();
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

seedProducts();
