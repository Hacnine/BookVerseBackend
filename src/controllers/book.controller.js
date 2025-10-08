import { validationResult } from "express-validator"
import prisma from "../config/prisma.js"
import { AppError } from "../middleware/error.middleware.js"

// Get all books with pagination
export const getAllBooks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, language, genre } = req.query

    const where = {
      isPublic: true,
      ...(language && { language }),
      ...(genre && { genre }),
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number.parseInt(limit),
        include: {
          uploader: {
            select: { id: true, name: true, avatar: true },
          },
          _count: {
            select: { reviews: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.book.count({ where }),
    ])

    // Calculate average rating for each book
    const booksWithRatings = await Promise.all(
      books.map(async (book) => {
        const reviews = await prisma.review.findMany({
          where: { bookId: book.id },
          select: { rating: true },
        })

        const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

        return {
          ...book,
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: book._count.reviews,
        }
      }),
    )

    res.json({
      success: true,
      data: {
        books: booksWithRatings,
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

// Search books
export const searchBooks = async (req, res, next) => {
  try {
    const { q, genre, language, rating } = req.query

    const where = {
      isPublic: true,
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { author: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      }),
      ...(genre && { genre }),
      ...(language && { language }),
    }

    const books = await prisma.book.findMany({
      where,
      include: {
        uploader: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { reviews: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate ratings and filter if needed
    let booksWithRatings = await Promise.all(
      books.map(async (book) => {
        const reviews = await prisma.review.findMany({
          where: { bookId: book.id },
          select: { rating: true },
        })

        const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

        return {
          ...book,
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: book._count.reviews,
        }
      }),
    )

    // Filter by rating if specified
    if (rating) {
      booksWithRatings = booksWithRatings.filter((book) => book.rating >= Number.parseFloat(rating))
    }

    res.json({
      success: true,
      data: booksWithRatings,
    })
  } catch (error) {
    next(error)
  }
}

// Get featured books
export const getFeaturedBooks = async (req, res, next) => {
  try {
    const books = await prisma.book.findMany({
      where: { isPublic: true },
      take: 10,
      include: {
        uploader: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { reviews: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const booksWithRatings = await Promise.all(
      books.map(async (book) => {
        const reviews = await prisma.review.findMany({
          where: { bookId: book.id },
          select: { rating: true },
        })

        const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

        return {
          ...book,
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: book._count.reviews,
        }
      }),
    )

    res.json({
      success: true,
      data: booksWithRatings,
    })
  } catch (error) {
    next(error)
  }
}

// Get books by genre
export const getBooksByGenre = async (req, res, next) => {
  try {
    const { genre } = req.params
    const { limit = 10 } = req.query

    const books = await prisma.book.findMany({
      where: {
        isPublic: true,
        genre,
      },
      take: Number.parseInt(limit),
      include: {
        uploader: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { reviews: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const booksWithRatings = await Promise.all(
      books.map(async (book) => {
        const reviews = await prisma.review.findMany({
          where: { bookId: book.id },
          select: { rating: true },
        })

        const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

        return {
          ...book,
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: book._count.reviews,
        }
      }),
    )

    res.json({
      success: true,
      data: booksWithRatings,
    })
  } catch (error) {
    next(error)
  }
}

// Get book by ID
export const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        uploader: {
          select: { id: true, name: true, avatar: true },
        },
        chapters: {
          include: {
            subchapters: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: { reviews: true },
        },
      },
    })

    if (!book) {
      throw new AppError("Book not found", 404)
    }

    // Calculate average rating
    const reviews = await prisma.review.findMany({
      where: { bookId: book.id },
      select: { rating: true },
    })

    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

    res.json({
      success: true,
      data: {
        ...book,
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: book._count.reviews,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Create new book
export const createBook = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400)
    }

    const { title, author, description, genre, language, content, isPublic, chapters } = req.body

    const coverImage = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : "/placeholder.svg?height=400&width=300"

    // Calculate page count (rough estimate: 250 words per page)
    const wordCount = content.split(/\s+/).length
    const pageCount = Math.ceil(wordCount / 250)

    const book = await prisma.book.create({
      data: {
        title,
        author,
        description,
        genre,
        language,
        content,
        coverImage,
        pageCount,
        isPublic: isPublic === "true" || isPublic === true,
        uploadedBy: req.user.id,
        ...(chapters && {
          chapters: {
            create: JSON.parse(chapters).map((chapter, index) => ({
              title: chapter.title,
              startPage: chapter.startPage,
              endPage: chapter.endPage,
              order: index + 1,
              ...(chapter.subchapters && {
                subchapters: {
                  create: chapter.subchapters.map((sub, subIndex) => ({
                    title: sub.title,
                    page: sub.page,
                    order: subIndex + 1,
                  })),
                },
              }),
            })),
          },
        }),
      },
      include: {
        uploader: {
          select: { id: true, name: true, avatar: true },
        },
        chapters: {
          include: {
            subchapters: true,
          },
        },
      },
    })

    res.status(201).json({
      success: true,
      data: book,
    })
  } catch (error) {
    next(error)
  }
}

// Update book
export const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if book exists and user owns it
    const existingBook = await prisma.book.findUnique({
      where: { id },
    })

    if (!existingBook) {
      throw new AppError("Book not found", 404)
    }

    if (existingBook.uploadedBy !== req.user.id) {
      throw new AppError("You can only update your own books", 403)
    }

    const { title, author, description, genre, language, content, isPublic } = req.body

    const coverImage = req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : undefined

    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(author && { author }),
        ...(description && { description }),
        ...(genre && { genre }),
        ...(language && { language }),
        ...(content && { content }),
        ...(coverImage && { coverImage }),
        ...(isPublic !== undefined && { isPublic: isPublic === "true" || isPublic === true }),
      },
      include: {
        uploader: {
          select: { id: true, name: true, avatar: true },
        },
        chapters: {
          include: {
            subchapters: true,
          },
        },
      },
    })

    res.json({
      success: true,
      data: updatedBook,
    })
  } catch (error) {
    next(error)
  }
}

// Delete book
export const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if book exists and user owns it
    const book = await prisma.book.findUnique({
      where: { id },
    })

    if (!book) {
      throw new AppError("Book not found", 404)
    }

    if (book.uploadedBy !== req.user.id) {
      throw new AppError("You can only delete your own books", 403)
    }

    await prisma.book.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: "Book deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}
