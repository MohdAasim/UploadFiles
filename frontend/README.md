# UploadFiles Frontend

A modern file management web application built with React, TypeScript, Vite, Material-UI, and Tailwind CSS.

## 🚀 Tech Stack & Features

### Core Technologies

- [React](https://reactjs.org/) v19.1.0 - UI Library
- [TypeScript](https://www.typescriptlang.org/) v5.8.3 - Type Safety
- [Vite](https://vitejs.dev/) v6.3.5 - Build Tool
- [Material-UI](https://mui.com/) v7.1.1 - Component Library
- [Tailwind CSS](https://tailwindcss.com/) v4.1.10 - Utility-first CSS

### State Management & Data Fetching

- [@tanstack/react-query](https://tanstack.com/query/latest) v5.80.7 - Server State Management
- [Socket.IO](https://socket.io/) v4.8.1 - Real-time Communication
- [Axios](https://axios-http.com/) v1.9.0 - HTTP Client

### Form Handling & Validation

- [React Hook Form](https://react-hook-form.com/) v7.57.0 - Form Management
- [Yup](https://github.com/jquense/yup) v1.6.1 - Form Validation
- [@hookform/resolvers](https://github.com/react-hook-form/resolvers) v5.1.1 - Form Validation Integration

### UI/UX Enhancements

- [React Hot Toast](https://react-hot-toast.com/) v2.5.2 - Toast Notifications
- [SweetAlert2](https://sweetalert2.github.io/) v11.22.0 - Beautiful Modal Dialogs
- [@mui/x-data-grid](https://mui.com/x/react-data-grid/) v8.5.2 - Advanced Data Tables
- [React Dropzone](https://react-dropzone.js.org/) v14.3.8 - File Upload Interface
- [date-fns](https://date-fns.org/) v4.1.0 - Date Formatting

### Routing & Navigation

- [React Router DOM](https://reactrouter.com/) v7.6.2 - Application Routing

### Development & Quality Tools

- [ESLint](https://eslint.org/) v9.25.0 - Code Linting
- [Prettier](https://prettier.io/) v3.5.3 - Code Formatting
- [Jest](https://jestjs.io/) v30.0.0 - Testing Framework
- [React Testing Library](https://testing-library.com/react) v16.3.0 - React Testing
- [Husky](https://typicode.github.io/husky/) v9.1.7 - Git Hooks
- [lint-staged](https://github.com/okonet/lint-staged) v16.1.2 - Pre-commit Linting

## 📁 Enhanced Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Breadcrumb.tsx
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── dialogs/
│   │   ├── files/
│   │   ├── folders/
│   │   ├── layout/
│   │   └── search/
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── UploadContext.tsx
│   │   └── ViewingContext.tsx
│   ├── hooks/
│   │   ├── useBulkActions.ts
│   │   ├── useDebounce.ts
│   │   ├── useFiles.ts
│   │   ├── useSearch.ts
│   │   ├── useSharing.ts
│   │   └── useVersions.ts
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── FilesPage.tsx
│   │   ├── FoldersPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── SharedPage.tsx
│   ├── services/
│   │   ├── api/
│   │   └── socketService.ts
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── public/
├── tests/
└── docker/
```

## 🔨 Key Features

1. **File Management**

   - Drag-and-drop file uploads
   - File version control
   - Bulk actions (upload, delete, move)
   - File preview support
   - Real-time progress tracking

2. **Folder Organization**

   - Hierarchical folder structure
   - Folder templates
   - Nested folder support
   - Quick folder actions

3. **Sharing & Collaboration**

   - File/folder sharing
   - Permission management
   - Real-time collaboration
   - User presence indicators

4. **Security & Authentication**

   - JWT-based authentication
   - Role-based access control
   - Secure file transfer
   - Environment-based configuration

5. **User Interface**
   - Responsive material design
   - Dark/light theme support
   - Toast notifications
   - Interactive modals
   - Loading states & error handling

## 📋 Prerequisites

- Node.js >= 20.x
- npm >= 9.x
- Docker and Docker Compose (for containerized development)

## 🛠️ Installation

### Local Development

1. Clone the repository:

```bash
git clone <repository-url>
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment files:
   - `.env` for development
   - `.env.prod` for production

Example `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SOCKET_URL=ws://localhost:5000
```

4. Start development server:

```bash
npm run dev
```

### Docker Development

Run the entire application stack using Docker Compose:

```bash
docker compose up
```

For production build:

```bash
docker compose -f docker-compose.prod.yml up
```

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix lint issues
- `npm run format` - Format code with Prettier

## 🧪 Testing

We use Jest and React Testing Library for testing. Tests are located in `__tests__` directories next to the components they test.

Run tests:

```bash
npm run test
```

## 🤝 Collaboration Strategy

1. **Branch Strategy**

   - `main` - Production code
   - `develop` - Development branch
   - `feature/*` - New features
   - `bugfix/*` - Bug fixes
   - `hotfix/*` - Production hotfixes

2. **Pull Request Process**

   - Create feature branch from `develop`
   - Write tests for new features
   - Update documentation
   - Create PR with description
   - Get 2 approvals minimum
   - Squash and merge

3. **Code Quality**
   - ESLint for code quality
   - Prettier for formatting
   - Husky for pre-commit hooks
   - Jest for testing

## 📝 Changelog

### [0.1.0] - 2024-03-XX

- Initial release
- Basic file management features
- User authentication
- Real-time file sharing
- File preview support

## 🔒 Environment Variables

### Development (.env)

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SOCKET_URL=ws://localhost:5000
NODE_ENV=development
```

### Production (.env.prod)

```env
VITE_API_BASE_URL=https://api.yourproduction.com
VITE_SOCKET_URL=wss://api.yourproduction.com
NODE_ENV=production
```

## 🔧 Troubleshooting

### Common Issues & Solutions

1. **Build Failures**

   ```bash
   # If build fails due to TypeScript errors
   npm run lint:fix
   # Clear build cache
   rm -rf dist
   npm run build
   ```

2. **Development Server Issues**

   ```bash
   # If development server won't start
   # Kill existing processes on port 5173
   sudo lsof -i :5173
   kill -9 <PID>
   # Clear vite cache
   rm -rf node_modules/.vite
   ```

3. **Docker Issues**

   ```bash
   # If containers won't start
   docker compose down
   docker system prune -f
   docker compose up --build

   # If volume issues persist
   docker compose down -v
   ```

4. **Testing Environment**

   ```bash
   # If tests are failing due to environment
   rm -rf node_modules/.cache
   npm install
   npm run test:clear
   ```

5. **ESLint/Prettier Conflicts**

   - Reset ESLint cache:
     ```bash
     npm run lint -- --cache-clear
     ```
   - Fix Prettier formatting:
     ```bash
     npm run format
     ```

6. **Node Version Conflicts**
   ```bash
   # Check current version
   node -v
   # Use correct version with nvm
   nvm use 20
   # Reinstall dependencies
   rm -rf node_modules
   npm install
   ```

### Environment Setup Issues

1. **Missing Environment Variables**

   - Ensure all required variables are set in `.env`:

   ```env
   VITE_API_BASE_URL=
   VITE_SOCKET_URL=
   NODE_ENV=
   ```

   - Copy from example:

   ```bash
   cp .env.example .env
   ```

2. **Port Conflicts**
   - Default ports used:
     - Frontend: 5173
     - Backend: 5000
     - Socket: 5000

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Development
DEBUG=true npm run dev

# Testing
DEBUG=true npm run test
```

### Known Issues

1. **File Upload Limitations**

   - Maximum file size: 100MB
   - Supported formats: PDF, DOCX, XLSX, JPG, PNG
   - Solution: Check file size and type before upload

2. **Socket Connection**

   - Symptom: Real-time updates not working
   - Solution: Check WebSocket connection in browser console

   ```javascript
   // Browser console
   localStorage.debug = '*';
   ```

3. **Performance Issues**
   - Clear browser cache
   - Disable browser extensions
   - Check network tab for slow requests

### Getting Help

1. **Error Logs**

   - Check browser console
   - Review application logs:

   ```bash
   tail -f logs/app.log
   ```

2. **Reporting Issues**

   - Include:
     - Node.js version
     - npm version
     - Error messages
     - Steps to reproduce
     - Environment details

3. **Support Channels**
   - GitHub Issues
   - Documentation Wiki
   - Developer Discord Channel

## 🔄 CI/CD

- GitHub Actions for CI/CD
- Automated testing on PR
- Automated deployment to staging
- Manual approval for production

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
