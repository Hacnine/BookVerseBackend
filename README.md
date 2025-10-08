# BookVerse Backend API

A comprehensive Node.js backend with Prisma ORM for the BookVerse eBook platform.

## Features

- **Authentication**: JWT-based auth with bcrypt password hashing
- **Book Management**: CRUD operations with image upload support
- **Reviews & Ratings**: User reviews with star ratings
- **Library Management**: Personal library, bookmarks, reading progress
- **Search & Filtering**: Advanced book search with multiple filters

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Install dependencies:
\`\`\`bash
cd backend
npm install
\`\`\`

2. Configure environment variables:
\`\`\`bash
cp .env.example .env
# Edit .env with your database URL and JWT secret
\`\`\`

3. Run Prisma migrations:
\`\`\`bash
npm run prisma:migrate
\`\`\`

4. Generate Prisma client:
\`\`\`bash
npm run prisma:generate
\`\`\`

5. Start the server:
\`\`\`bash
npm run dev
\`\`\`

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `POST /api/auth/change-password` - Change password (protected)

### Books
- `GET /api/books` - Get all books (with pagination)
- `GET /api/books/search` - Search books
- `GET /api/books/featured` - Get featured books
- `GET /api/books/genre/:genre` - Get books by genre
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Create book (protected, with image upload)
- `PUT /api/books/:id` - Update book (protected)
- `DELETE /api/books/:id` - Delete book (protected)

### Reviews
- `GET /api/reviews/book/:bookId` - Get book reviews
- `GET /api/reviews/user` - Get user reviews (protected)
- `POST /api/reviews` - Create review (protected)
- `PUT /api/reviews/:id` - Update review (protected)
- `DELETE /api/reviews/:id` - Delete review (protected)

### Library
- `GET /api/library` - Get user library (protected)
- `POST /api/library` - Add book to library (protected)
- `DELETE /api/library/:bookId` - Remove from library (protected)
- `GET /api/library/bookmarks` - Get bookmarks (protected)
- `POST /api/library/bookmarks` - Add bookmark (protected)
- `DELETE /api/library/bookmarks/:bookId` - Remove bookmark (protected)
- `GET /api/library/progress` - Get reading progress (protected)
- `POST /api/library/progress` - Update reading progress (protected)
- `GET /api/library/recently-read` - Get recently read (protected)
- `POST /api/library/recently-read` - Add to recently read (protected)
- `GET /api/library/downloads` - Get downloads (protected)
- `POST /api/library/downloads` - Add download (protected)
- `DELETE /api/library/downloads/:bookId` - Remove download (protected)

## Database Schema

The application uses Prisma ORM with PostgreSQL. Key models include:

- **User**: User accounts with authentication
- **Book**: Book catalog with metadata and content
- **Chapter**: Book chapters with subchapters
- **Review**: User reviews and ratings
- **LibraryItem**: User's saved books
- **Bookmark**: User bookmarks
- **ReadingProgress**: Track reading progress
- **RecentlyRead**: Reading history
- **Download**: Offline downloads

## Development

- `npm run dev` - Start development server with nodemon
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:migrate` - Run database migrations

## Production

1. Set `NODE_ENV=production` in `.env`
2. Update `DATABASE_URL` with production database
3. Run migrations: `npm run prisma:migrate`
4. Start server: `npm start`
