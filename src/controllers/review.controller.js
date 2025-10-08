import { validationResult } from "express-validator"
import prisma from "../config/prisma.js"
import { AppError } from "../middleware/error.middleware.js"

// Get all reviews for a book
export const getBookReviews = async (req, res, next) => {
  try {
    const { bookId } = req.params
    const { page = 1, limit = 10 } = req.query

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { bookId },
        skip: (page - 1) * limit,
        take: Number.parseInt(limit),
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where: { bookId } }),
    ])

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

// Get all reviews by a user
export const getUserReviews = async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: req.user.id },
      include: {
        book: {
          select: { id: true, title: true, author: true, coverImage: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    res.json({
      success: true,
      data: reviews,
    })
  } catch (error) {
    next(error)
  }
}

// Create a new review
export const createReview = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400)
    }

    const { bookId, rating, comment } = req.body

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    })

    if (!book) {
      throw new AppError("Book not found", 404)
    }

    // Check if user already reviewed this book
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_bookId: {
          userId: req.user.id,
          bookId,
        },
      },
    })

    if (existingReview) {
      throw new AppError("You have already reviewed this book", 400)
    }

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        bookId,
        rating: Number.parseInt(rating),
        comment,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        book: {
          select: { id: true, title: true, author: true },
        },
      },
    })

    res.status(201).json({
      success: true,
      data: review,
    })
  } catch (error) {
    next(error)
  }
}

// Update a review
export const updateReview = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400)
    }

    const { id } = req.params
    const { rating, comment } = req.body

    // Check if review exists and user owns it
    const existingReview = await prisma.review.findUnique({
      where: { id },
    })

    if (!existingReview) {
      throw new AppError("Review not found", 404)
    }

    if (existingReview.userId !== req.user.id) {
      throw new AppError("You can only update your own reviews", 403)
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        ...(rating && { rating: Number.parseInt(rating) }),
        ...(comment && { comment }),
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        book: {
          select: { id: true, title: true, author: true },
        },
      },
    })

    res.json({
      success: true,
      data: updatedReview,
    })
  } catch (error) {
    next(error)
  }
}

// Delete a review
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if review exists and user owns it
    const review = await prisma.review.findUnique({
      where: { id },
    })

    if (!review) {
      throw new AppError("Review not found", 404)
    }

    if (review.userId !== req.user.id) {
      throw new AppError("You can only delete your own reviews", 403)
    }

    await prisma.review.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: "Review deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}
