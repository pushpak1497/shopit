import { User } from "../models/userModel.js";
export default async (user, statusCode, res) => {
  // create jwt Token
  const token = user.getJwtToken();
  //   options for cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRY * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: true,
  };
  const createdUser = await User.findById(user._id).select("-password");
  res.status(statusCode).cookie("token", token, options).json({
    token,
    createdUser,
  });
};
