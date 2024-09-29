import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "please Enter product Name"],
      maxLength: [200, "length of name shouldnot be more than 200 characters"],
    },
    price: { type: Number, required: [true, "please enter product price"] },
    description: {
      type: String,
      required: [true, "please Enter product Description"],
    },
    rating: { type: Number, default: 0 },
    images: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    category: {
      type: String,
      required: [true, "Please enter product category"],
      enum: {
        values: [
          "Laptops",
          "Electronics",
          "Cameras",
          "Accessories",
          "Headphones",
          "Food",
          "Books",
          "Sports",
          "Outdoor",
          "Home",
        ],
        message: "Please Enter correct category",
      },
    },
    seller: {
      type: String,
      required: [true, "Please enter product seller name"],
    },
    stock: {
      type: Number,
      required: [true, "please enter the stock"],
    },
    noOfReviews: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: {
          type: Number,
          required: true,
        },
        comment: {
          type: String,
          required: true,
        },
      },
    ],
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
