import { Router } from "express";
import {
  deleteUser,
  forgotPassword,
  getAllUsers,
  getUserDetails,
  getUserProfile,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  updatePassword,
  updateProfile,
  updateUserDetails,
  uploadAvatar,
} from "../controllers/userController.js";
import {
  authorizeRoles,
  isAuthenticatedUser,
} from "../middlewares/authMiddleware.js";

const router = Router();
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(logoutUser);
router.route("/forgot/password").post(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);
router.route("/me").get(isAuthenticatedUser, getUserProfile);
router.route("/password/update").put(isAuthenticatedUser, updatePassword);
router.route("/me/update").put(isAuthenticatedUser, updateProfile);
router.route("/me/upload_avatar").put(isAuthenticatedUser, uploadAvatar);
router
  .route("/admin/allusers")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAllUsers);
router
  .route("/admin/:id")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getUserDetails)
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserDetails)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

export default router;
