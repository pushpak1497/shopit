import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "please enter your name "],
      maxLength: [30, "name should not exceed 30 characters"],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "please enter your email"],
    },
    password: {
      type: String,
      required: [true, "please enter your password"],
      minLength: [8, "password must be larger than 8 characters"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
  },
  { timestamps: true }
);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};
userSchema.methods.comparePassword = async function (password) {
  console.log(password);
  return await bcrypt.compare(password, this.password);
};
userSchema.methods.getResetPasswordToken = async function () {
  // generate reset Token
  const resetToken = crypto.randomBytes(20).toString("hex");
  //   hash and set to resetpasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  // set token exipry time
  this.resetPasswordExpiry = Date.now() + 30 * 60 * 1000;
  return resetToken;
};
export const User = mongoose.model("User", userSchema);
