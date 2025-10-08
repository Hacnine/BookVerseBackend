import jwt from "jsonwebtoken"
import { AppError } from "./error.middleware.js"
import prisma from "../config/prisma.js"

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      throw new AppError("Authentication required", 401)
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, avatar: true },
    })

    if (!user) {
      throw new AppError("User not found", 404)
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      next(new AppError("Invalid token", 401))
    } else if (error.name === "TokenExpiredError") {
      next(new AppError("Token expired", 401))
    } else {
      next(error)
    }
  }
}
