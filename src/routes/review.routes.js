import express from "express"
import { body } from "express-validator"
import {
  createReview,
  updateReview,
  deleteReview,
  getBookReviews,
  getUserReviews,
} from "../controllers/review.controller.js"
import { authenticate } from "../middleware/auth.middleware.js"

const router = express.Router()

// Public routes
router.get("/book/:bookId", getBookReviews)

// Protected routes
router.get("/user", authenticate, getUserReviews)
router.post(
  "/",
  authenticate,
  [
    body("bookId").notEmpty().withMessage("Book ID is required"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("comment").notEmpty().withMessage("Comment is required"),
  ],
  createReview,
)
router.put(
  "/:id",
  authenticate,
  [
    body("rating").optional().isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("comment").optional().notEmpty().withMessage("Comment cannot be empty"),
  ],
  updateReview,
)
router.delete("/:id", authenticate, deleteReview)

export default router
