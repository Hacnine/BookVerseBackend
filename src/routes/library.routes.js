import express from "express"
import { body } from "express-validator"
import {
  getLibrary,
  addToLibrary,
  removeFromLibrary,
  getBookmarks,
  addBookmark,
  removeBookmark,
  getReadingProgress,
  updateReadingProgress,
  getRecentlyRead,
  addRecentlyRead,
  getDownloads,
  addDownload,
  removeDownload,
} from "../controllers/library.controller.js"
import { authenticate } from "../middleware/auth.middleware.js"

const router = express.Router()

// All routes are protected
router.use(authenticate)

// Library routes
router.get("/", getLibrary)
router.post("/", [body("bookId").notEmpty().withMessage("Book ID is required")], addToLibrary)
router.delete("/:bookId", removeFromLibrary)

// Bookmark routes
router.get("/bookmarks", getBookmarks)
router.post("/bookmarks", [body("bookId").notEmpty().withMessage("Book ID is required")], addBookmark)
router.delete("/bookmarks/:bookId", removeBookmark)

// Reading progress routes
router.get("/progress", getReadingProgress)
router.post(
  "/progress",
  [
    body("bookId").notEmpty().withMessage("Book ID is required"),
    body("currentPage").isInt({ min: 1 }).withMessage("Current page must be a positive integer"),
    body("totalPages").isInt({ min: 1 }).withMessage("Total pages must be a positive integer"),
  ],
  updateReadingProgress,
)

// Recently read routes
router.get("/recently-read", getRecentlyRead)
router.post("/recently-read", [body("bookId").notEmpty().withMessage("Book ID is required")], addRecentlyRead)

// Download routes
router.get("/downloads", getDownloads)
router.post("/downloads", [body("bookId").notEmpty().withMessage("Book ID is required")], addDownload)
router.delete("/downloads/:bookId", removeDownload)

export default router
