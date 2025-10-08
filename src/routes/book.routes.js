import express from "express"
import { body } from "express-validator"
import multer from "multer"
import path from "path"
import {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  searchBooks,
  getFeaturedBooks,
  getBooksByGenre,
} from "../controllers/book.controller.js"
import { authenticate } from "../middleware/auth.middleware.js"

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"))
    }
  },
})

// Public routes
router.get("/", getAllBooks)
router.get("/search", searchBooks)
router.get("/featured", getFeaturedBooks)
router.get("/genre/:genre", getBooksByGenre)
router.get("/:id", getBookById)

// Protected routes
router.post(
  "/",
  authenticate,
  upload.single("coverImage"),
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("author").notEmpty().withMessage("Author is required"),
    body("genre").notEmpty().withMessage("Genre is required"),
    body("language").notEmpty().withMessage("Language is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("content").notEmpty().withMessage("Content is required"),
  ],
  createBook,
)

router.put("/:id", authenticate, upload.single("coverImage"), updateBook)
router.delete("/:id", authenticate, deleteBook)

export default router
