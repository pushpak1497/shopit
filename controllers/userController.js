import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userModel.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import sendEmail from "../utils/sendEmail.js";
import sendToken from "../utils/sendToken.js";
import { getResetPasswordTemplate } from "../utils/emailTemplates.js";
import crypto from "crypto";
import { deleteFile, upload_file } from "../cloudinary.js";
// register user route:"/api/v1/users/register"
export const registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;
  const user = await User.create({
    name,
    email,
    password,
  });
  const updatedUser = await User.findById(user._id).select("-password");

  sendToken(updatedUser, 201, res);
});

export const loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  if (!(email || password)) {
    return next(new ErrorHandler("please enter email and password", 401));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Email or password", 400));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Enter valid password", 401));
  }

  const createdUser = await User.findById(user._id).select("-password");
  sendToken(createdUser, 201, res);
});

export const logoutUser = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: true,
  });
  res.status(200).json({
    message: "logged out successfully",
  });
});

// upload user avatar => /api/v1/me/upload_avatar

export const uploadAvatar = catchAsyncErrors(async (req, res, next) => {
  const avatarResponse = await upload_file(req.body.avatar, "shopit/avatars");
  console.log(avatarResponse);

  // remove previous avatar
  if (req?.user?.avatar?.url) {
    await deleteFile(req?.user?.avatar?.public_id);
  }
  const user = await User.findByIdAndUpdate(req?.user?._id, {
    avatar: avatarResponse,
  });
  res.status(200).json({
    user,
  });
});

export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User not found with this email", 404));
  }
  //   get reset password Token
  const resetToken = await user.getResetPasswordToken();
  console.log(resetToken);
  await user.save();
  // create reset password url
  const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
  console.log(resetUrl);
  const message = getResetPasswordTemplate(user?.name, resetUrl);
  try {
    sendEmail({
      email: user.email,
      subject: "shopIT password recovery",
      message,
    });
    return res.status(200).json({ message: `Email sent to ${user.email}` });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();
    return next(new ErrorHandler(error?.message, 500));
  }
});

export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  // hash the Url token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  console.log(resetPasswordToken);
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpiry: { $gt: Date.now() },
  });
  if (!user) {
    return next(
      new ErrorHandler("password reset token is invalid or expired", 400)
    );
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords does not match", 400));
  }
  // set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();
  sendToken(user, 200, res);
});

// get currentuser profile /api/v1/users/me
export const getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("-password");
  res.status(200).json({
    user,
  });
});

// update password /api/v1/users/password/update
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  // console.log(req.body);
  const user = await User.findById(req.user._id).select("+password");
  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
  // console.log(isPasswordMatched);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }
  user.password = req.body.newPassword;
  user.save();
  res.status(200).json({
    success: true,
    user,
  });
});
// update user profile /api/v1/users/me/update
export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };
  const user = await User.findByIdAndUpdate(req.user._id, newUserData, {
    new: true,
  }).select("-password");
  res.status(200).json({
    user,
  });
});

// get all users-ADMIN /api/v1/users/admin/allusers
export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    users,
  });
});

// get specific User details - ADMIN /api/v1/users/admin/:id
export const getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  return res.status(200).json(user);
});

// update user Details - ADMIN /api/v1/users/admin/allusers/:id
export const updateUserDetails = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };
  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
  });
  res.status(200).json({
    user,
  });
});

// delete user -ADMIN 'api/v1/users/admin/allusers/:id'
export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  if (user?.avatar?.public_id) {
    await deleteFile(user?.avatar?.public_id);
  }

  await user.deleteOne();
  res.status(200).json({ message: "user deleted successfully", success: true });
});
