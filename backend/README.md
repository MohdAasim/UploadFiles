# UploadFiles Backend

A robust file management backend built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Tech Stack & Features

### Core Technologies
- [Node.js](https://nodejs.org/) v20.x - Runtime Environment
- [Express](https://expressjs.com/) v5.1.0 - Web Framework
- [TypeScript](https://www.typescriptlang.org/) v5.8.3 - Type Safety
- [MongoDB](https://www.mongodb.com/) v8.15.1 - Database (via Mongoose)
- [Socket.IO](https://socket.io/) v4.8.1 - Real-time Communication

### Authentication & Security
- [JWT](https://jwt.io/) v9.0.2 - Authentication
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) v6.0.0 - Password Hashing
- [Joi](https://joi.dev/) v17.13.3 - Validation

### File Handling & Utilities
- [Multer](https://github.com/expressjs/multer) v2.0.1 - File Upload
- [Winston](https://github.com/winstonjs/winston) v3.17.0 - Logging
- [CORS](https://github.com/expressjs/cors) v2.8.5 - Cross-Origin Resource Sharing

### Development & Testing
- [Jest](https://jestjs.io/) v30.0.0 - Testing Framework
- [Supertest](https://github.com/visionmedia/supertest) v7.1.1 - HTTP Testing
- [ESLint](https://eslint.org/) v9.29.0 - Linting
- [Prettier](https://prettier.io/) v3.5.3 - Code Formatting
- [Nodemon](https://nodemon.io/) v3.1.10 - Development Server
- [Husky](https://typicode.github.io/husky/) v9.1.7 - Git Hooks
- [lint-staged](https://github.com/okonet/lint-staged) v16.1.2 - Pre-commit Linting

## 📁 Project Structure

```
backend/
├── src/
│   ├── __tests__/
│   │   ├── integration/
│   │   │   ├── authRoutes.test.ts
│   │   │   ├── fileRoutes.test.ts
│   │   │   ├── folderRoutes.test.ts
│   │   │   └── searchRoutes.test.ts
│   │   └── unit/
│   ├── config/
│   │   └── db.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── bulkController.ts
│   │   ├── fileController.ts
│   │   ├── folderController.ts
│   │   ├── realtimeController.ts
│   │   ├── searchController.ts
│   │   ├── shareController.ts
│   │   └── versionController.ts
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── permission.ts
│   │   ├── upload.ts
│   │   └── validateRequest.ts
│   ├── models/
│   │   ├── FileMeta.ts
│   │   ├── Folder.ts
│   │   └── User.ts
│   ├── repository/
│   │   ├── auth.repo.ts
│   │   ├── filemeta.repo.ts
│   │   └── folder.repo.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── fileRoutes.ts
│   │   ├── folderRoutes.ts
│   │   └── shareRoutes.ts
│   ├── services/
│   ├── socket/
│   ├── types/
│   ├── utils/
│   └── app.ts
├── logs/
├── uploads/
└── dist/
```

## 🔨 Key Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control
   - Password hashing with bcrypt
   - Request validation with Joi

2. **File Management**
   - File upload with Multer
   - Version control
   - File metadata tracking
   - Bulk operations support

3. **Real-time Features**
   - Socket.IO integration
   - Real-time notifications
   - File collaboration status
   - Online user tracking

4. **Advanced Search**
   - Full-text search
   - Filter by file type
   - Date range filtering
   - Combined folder/file search

5. **Logging & Monitoring**
   - Winston logger integration
   - Error tracking
   - Request logging
   - Performance monitoring

## 📋 Prerequisites

- Node.js >= 20.x
- MongoDB >= 6.0
- npm >= 9.x
- TypeScript knowledge
- Docker (optional)

## 🛠️ Installation

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment files:
   - `.env.dev` for development
   - `.env.prod` for production
   - `.env.test` for testing

Example `.env.dev`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/uploadfiles
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

4. Start development server:
```bash
npm run dev
```

### Docker Development

```bash
docker compose up
```

## 📜 Available Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "format": "prettier --write \"src/**/*.{ts,js,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,js,json}\"",
    "type-check": "tsc --noEmit"
  }
}
```

## 🧪 Testing

We use Jest and Supertest for testing. Tests are organized in:
- `__tests__/integration/` - API/v1 endpoint tests
- `__tests__/unit/` - Unit tests for controllers, services, etc.

Run tests:
```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

## 🔒 Environment Variables

### Development (.env.dev)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/uploadfiles
JWT_SECRET=dev_secret
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Production (.env.prod)
```env
PORT=5000
MONGODB_URI=mongodb://prod-db:27017/uploadfiles
JWT_SECRET=prod_secret
CORS_ORIGIN=https://your-frontend-domain.com
NODE_ENV=production
```

## 🤝 Collaboration Strategy

1. **Branch Strategy**
   - `main` - Production code
   - `develop` - Development branch
   - `feature/*` - New features
   - `bugfix/*` - Bug fixes
   - `hotfix/*` - Production hotfixes

2. **Code Review Process**
   - Create feature branch
   - Write tests
   - Update documentation
   - Create PR
   - Get 2 approvals
   - Squash and merge

3. **Quality Gates**
   - ESLint rules
   - Prettier formatting
   - Test coverage > 80%
   - TypeScript strict mode
   - Husky pre-commit hooks

## 📝 API/v1 Documentation

### Postman Collection
[View Complete API/v1 Documentation](https://orange-trinity-404277.postman.co/workspace/My-Workspace~2535fc12-6ff7-4987-882e-bc4aee5b7e88/collection/44751520-92009403-3e2e-4bc7-8850-dc83fff5fadf?action=share&source=copy-link&creator=44751520)

### API Endpoints Overview

#### Authentication
```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh-token
GET /api/v1/auth/profile
```

#### File Management
```http
POST /api/v1/files/upload
GET /api/v1/files
GET /api/v1/files/:id
PUT /api/v1/files/:id
DELETE /api/v1/files/:id
POST /api/v1/files/bulk-upload
POST /api/v1/files/bulk-delete
```

#### Folder Operations
```http
POST /api/v1/folders
GET /api/v1/folders
GET /api/v1/folders/:id
PUT /api/v1/folders/:id
DELETE /api/v1/folders/:id
```

#### Sharing & Collaboration
```http
POST /api/v1/share
GET /api/v1/share/:id
PUT /api/v1/share/:id/permissions
DELETE /api/v1/share/:id
```

#### Search Operations
```http
GET /api/v1/search?q=:query
GET /api/v1/search/advanced
```

## 🔧 Troubleshooting

### Common Issues & Solutions

1. **MongoDB Connection Issues**
```bash
# Check MongoDB service status
sudo systemctl status mongodb

# Restart MongoDB
sudo systemctl restart mongodb

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

2. **Node.js Version Conflicts**
```bash
# Check Node version
node -v

# Use correct version with nvm
nvm use 20

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

3. **TypeScript Compilation Errors**
```bash
# Clear TypeScript cache
rm -rf dist
npm run type-check
npm run build
```

4. **Jest Testing Issues**
```bash
# Clear Jest cache
jest --clearCache

# Run tests in verbose mode
npm test -- --verbose

# Check test coverage
npm run test:coverage
```

5. **File Upload Issues**
```bash
# Check upload directory permissions
sudo chown -R $USER:$USER uploads/
chmod 755 uploads/

# Check Multer configuration
cat src/middlewares/upload.ts
```

### Git Hooks & Pre-commit Setup

1. **Husky Configuration**
```bash
# Install husky
npm install husky --save-dev

# Initialize husky
npm run prepare
```

2. **Pre-commit Hook Setup**
`````.husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm run type-check
npm test
```

3. **lint-staged Configuration**
```json
// filepath: package.json
{
  "lint-staged": {
    "*.{ts,js}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### Environment Issues

1. **Missing Environment Variables**
   - Copy example env file:
   ```bash
   cp .env.example .env.dev
   ```
   - Verify all required variables are set:
   ```bash
   grep -v '^#' .env.dev
   ```

2. **Port Conflicts**
   ```bash
   # Find process using port 5000
   sudo lsof -i :5000
   
   # Kill process
   kill -9 <PID>
   ```

### Debug Mode

Enable debug logging:
```bash
# Development
DEBUG=app:* npm run dev

# Testing
DEBUG=app:* npm test
```

### Getting Help

1. **Logging**
   - Application logs: `logs/app.log`
   - Error logs: `logs/error.log`
   - Access logs: `logs/access.log`

2. **Debugging Tools**
   - VS Code Debugger configuration:
   ```json
   // filepath: .vscode/launch.json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "type": "node",
         "request": "launch",
         "name": "Debug API/v1",
         "program": "${workspaceFolder}/src/app.ts",
         "preLaunchTask": "tsc: build - tsconfig.json",
         "outFiles": ["${workspaceFolder}/dist/**/*.js"]
       }
     ]
   }
   ```

3. **Support Resources**
   - GitHub Issues
   - Project Wiki
   - Team Discord Channel