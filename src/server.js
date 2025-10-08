import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.routes.js"
import bookRoutes from "./routes/book.routes.js"
import reviewRoutes from "./routes/review.routes.js"
import libraryRoutes from "./routes/library.routes.js"
import { errorHandler } from "./middleware/error.middleware.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static files for uploads
app.use("/uploads", express.static("uploads"))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/books", bookRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/library", libraryRoutes)

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "BookVerse API is running" })
})

// Error handling
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`[v0] Server running on port ${PORT}`)
})
