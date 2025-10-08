import express from "express"
import { body } from "express-validator"
import { register, login, getProfile, updateProfile, changePassword } from "../controllers/auth.controller.js"
import { authenticate } from "../middleware/auth.middleware.js"

const router = express.Router()

// Public routes
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("name").notEmpty().withMessage("Name is required"),
  ],
  register,
)

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login,
)

// Protected routes
router.get("/profile", authenticate, getProfile)
router.put("/profile", authenticate, updateProfile)
router.post(
  "/change-password",
  authenticate,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
  ],
  changePassword,
)

export default router
