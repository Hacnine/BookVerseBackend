import { validationResult } from "express-validator"
import prisma from "../config/prisma.js"
import { AppError } from "../middleware/error.middleware.js"

// ===== Library Management =====

export const getLibrary = async (req, res, next) => {
  try {
    const libraryItems = await prisma.libraryItem.findMany({
      where: { userId: req.user.id },
      include: {
        book: {
          include: {
            uploader: {
              select: { id: true, name: true, avatar: true },
            },
            _count: {
              select: { reviews: true },
            },
          },
        },
      },
      orderBy: { addedAt: "desc" },
    })

    // Calculate ratings for each book
    const libraryWithRatings = await Promise.all(
      libraryItems.map(async (item) => {
        const reviews = await prisma.review.findMany({
          where: { bookId: item.book.id },
          select: { rating: true },
        })

        const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

        return {
          ...item,
          book: {
            ...item.book,
            rating: Math.round(avgRating * 10) / 10,
            reviewCount: item.book._count.reviews,
          },
        }
      }),
    )

    res.json({
      success: true,
      data: libraryWithRatings,
    })
  } catch (error) {
    next(error)
  }
}

export const addToLibrary = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400)
    }

    const { bookId } = req.body

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    })

    if (!book) {
      throw new AppError("Book not found", 404)
    }

    // Check if already in library
    const existing = await prisma.libraryItem.findUnique({
      where: {
        userId_bookId: {
          userId: req.user.id,
          bookId,
        },
      },
    })

    if (existing) {
      throw new AppError("Book already in library", 400)
    }

    const libraryItem = await prisma.libraryItem.create({
      data: {
        userId: req.user.id,
        bookId,
      },
      include: {
        book: true,
      },
    })

    res.status(201).json({
      success: true,
      data: libraryItem,
    })
  } catch (error) {
    next(error)
  }
}

export const removeFromLibrary = async (req, res, next) => {
  try {
    const { bookId } = req.params

    const libraryItem = await prisma.libraryItem.findUnique({
      where: {
        userId_bookId: {
          userId: req.user.id,
          bookId,
        },
      },
    })

    if (!libraryItem) {
      throw new AppError("Book not found in library", 404)
    }

    await prisma.libraryItem.delete({
      where: {
        userId_bookId: {
          userId: req.user.id,
          bookId,
        },
      },
    })

    res.json({
      success: true,
      message: "Book removed from library",
    })
  } catch (error) {
    next(error)
  }
}

// ===== Bookmarks =====

export const getBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user.id },
      include: {
        book: {
          include: {
            uploader: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    res.json({
      success: true,
      data: bookmarks,
    })
  } catch (error) {
    next(error)
  }
}

export const addBookmark = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400)
    }

    const { bookId, page, note } = req.body

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    })

    if (!book) {
      throw new AppError("Book not found", 404)
    }

    // Check if already bookmarked
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_bookId: {
          userId: req.user.id,
          bookId,
        },
      },
    })

    if (existing) {
      // Update existing bookmark
      const updated = await prisma.bookmark.update({
        where: {
          userId_bookId: {
            userId: req.user.id,
            bookId,
          },
        },
        data: {
          ...(page && { page: Number.parseInt(page) }),
          ...(note && { note }),
        },
        include: {
          book: true,
        },
      })

      return res.json({
        success: true,
        data: updated,
      })
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: req.user.id,
        bookId,
        ...(page && { page: Number.parseInt(page) }),
        ...(note && { note }),
      },
      include: {
        book: true,
      },
    })

    res.status(201).json({
      success: true,
      data: bookmark,
    })
  } catch (error) {
    next(error)
  }
}

export const removeBookmark = async (req, res, next) => {
  try {
    const { bookId } = req.params

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_bookId: {
          userId: req.user.id,
          bookId,
        },
      },
    })

    if (!bookmark) {
      throw new AppError("Bookmark not found", 404)
    }

    await prisma.bookmark.delete({
      where: {
        userId_bookId: {
          userId: req.user.id,
          bookId,
        },
      },
    })

    res.json({
      success: true,
      message: "Bookmark removed",
    })
  } catch (error) {
    next(error)
  }
}

// ===== Reading Progress =====

export const getReadingProgress = async (req, res, next) => {
  try {
    const { bookId } = req.query

    const where = {
      userId: req.user.id,
      ...(bookId && { bookId }),
    }

    const progress = await prisma.readingProgress.findMany({
      where,
      include: {
        book: {
          include: {
            uploader: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
      orderBy: { lastReadAt: "desc" },
    })

    res.json({
      success: true,
      data: bookId && progress.length > 0 ? progress[0] : progress,
    })
  } catch (error) {
    next(error)
  }
}

export const updateReadingProgress = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400)
    }

    const { bookId, currentPage, totalPages } = req.body

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    })

    if (!book) {
      throw new AppError("Book not found", 404)
    }

    const progressPercent = (Number.parseInt(currentPage) / Number.parseInt(totalPages)) * 100

    // Check if progress exists
    const existing = await prisma.readingProgress.findUnique({
      where: {
        userId_bookId: {
          userId: req.user.id,
          bookId,
        },
      },
    })

    if (existing) {
      // Update existing progress
      const updated = await prisma.readingProgress.update({
        where: {
          userId_bookId: {
            userId: req.user.id,
            bookId,
          },
        },
        data: {
          currentPage: Number.parseInt(currentPage),
          totalPages: Number.parseInt(totalPages),
          progressPercent,
          lastReadAt: new Date(),
        },
        include: {
          book: true,
        },
      })

      return res.json({
        success: true,
        data: updated,
      })
    }

    const progress = await prisma.readingProgress.create({
      data: {
        userId: req.user.id,
        bookId,
        currentPage: Number.parseInt(currentPage),
        totalPages: Number.parseInt(totalPages),
        progressPercent,
      },
      include: {
        book: true,
      },
    })

    res.status(201).json({
      success: true,
      data: progress,
    })
  } catch (error) {
    next(error)
  }
}

// ===== Recently Read =====

export const getRecentlyRead = async (req, res, next) => {
  try {
    const recentlyRead = await prisma.recentlyRead.findMany({
      where: { userId: req.user.id },
      include: {
        book: {
          include: {
            uploader: {
              select: { id: true, name: true, avatar: true },
            },
            _count: {
              select: { reviews: true },
            },
          },
        },
      },
      orderBy: { readAt: "desc" },
      take: 20,
    })

    // Calculate ratings
    const recentlyReadWithRatings = await Promise.all(
      recentlyRead.map(async (item) => {
        const reviews = await prisma.review.findMany({
          where: { bookId: item.book.id },
          select: { rating: true },
        })

        const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

        return {
          ...item,
          book: {
            ...item.book,
            rating: Math.round(avgRating * 10) / 10,
            reviewCount: item.book._count.reviews,
          },
        }
      }),
    )

    res.json({
      success: true,
      data: recentlyReadWithRatings,
    })
  } catch (error) {
    next(error)
  }
}

export const addRecentlyRead = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400)
    }

    const { bookId } = req.body

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    })

    if (!book) {
      throw new AppError("Book not found", 404)
    }

    // Check if already in recently read
    const existing = await prisma.recentlyRead.findUnique({
      where: {
        userId_bookId: {
          userId: req.user.id,
          bookId,
        },
      },
    })

    if (existing) {
      // Update timestamp
      const updated = await prisma.recentlyRead.update({
        where: {
          userId_bookId: {
            userId: req.user.id,
            bookId,
          },
        },
        data: {
          readAt: new Date(),
        },
        include: {
          book: true,
        },
      })

      return res.json({
        success: true,
        data: updated,
      })
    }

    const recentlyRead = await prisma.recentlyRead.create({
      data: {
        userId: req.user.id,
        bookId,
      },
      include: {
        book: true,
      },
    })

    res.status(201).json({
      success: true,
      data: recentlyRead,
    })
  } catch (error) {
    next(error)
  }
}

// ===== Downloads =====

export const getDownloads = async (req, res, next) => {
  try {
    const downloads = await prisma.download.findMany({
      where: { userId: req.user.id },
      include: {
        book: {
          include: {
            uploader: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
      orderBy: { downloadedAt: "desc" },
    })

    res.json({
      success: true,
      data: downloads,
    })
  } catch (error) {
    next(error)
  }
}

export const addDownload = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400)
    }

    const { bookId } = req.body

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    })

    if (!book) {
      throw new AppError("Book not found", 404)
    }

    // Check if already downloaded
    const existing = await prisma.download.findUnique({
      where: {
        userId_bookId: {
          userId: req.user.id,
          bookId,
        },
      },
    })

    if (existing) {
      throw new AppError("Book already downloaded", 400)
    }

    const download = await prisma.download.create({
      data: {
        userId: req.user.id,
        bookId,
      },
      include: {
        book: true,
      },
    })

    res.status(201).json({
      success: true,
      data: download,
    })
  } catch (error) {
    next(error)
  }
}

export const removeDownload = async (req, res, next) => {
  try {
    const { bookId } = req.params

    const download = await prisma.download.findUnique({
      where: {
        userId_bookId: {
          userId: req.user.id,
          bookId,
        },
      },
    })

    if (!download) {
      throw new AppError("Download not found", 404)
    }

    await prisma.download.delete({
      where: {
        userId_bookId: {
          userId: req.user.id,
          bookId,
        },
      },
    })

    res.json({
      success: true,
      message: "Download removed",
    })
  } catch (error) {
    next(error)
  }
}
