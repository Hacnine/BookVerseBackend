import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { validationResult } from "express-validator"
import prisma from "../config/prisma.js"
import { AppError } from "../middleware/error.middleware.js"

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  })
}

// Register new user
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400)
    }

    const { email, password, name } = req.body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new AppError("Email already registered", 400)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    })

    // Generate token
    const token = generateToken(user.id)

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Login user
export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400)
    }

    const { email, password } = req.body

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new AppError("Invalid email or password", 401)
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401)
    }

    // Generate token
    const token = generateToken(user.id)

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Get user profile
export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            uploadedBooks: true,
            library: true,
            bookmarks: true,
            reviews: true,
          },
        },
      },
    })

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

// Update user profile
export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(avatar && { avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    })

    res.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    next(error)
  }
}

// Change password
export const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400)
    }

    const { currentPassword, newPassword } = req.body

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    })

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isPasswordValid) {
      throw new AppError("Current password is incorrect", 401)
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    })

    res.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    next(error)
  }
}
