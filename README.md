# 🚀 API Management Panel - Turborepo Monorepo

A modern, high-performance monorepo for the API Management Panel built with Turborepo, Next.js 15, TypeScript, Tailwind CSS, and Supabase.

[![Turborepo](https://img.shields.io/badge/Turborepo-2.5-blue)](https://turbo.build/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Green)](https://supabase.com/)

## 📦 What's Inside?

This Turborepo includes the following packages and apps:

### Apps

- `web`: The main Next.js application for API management

### Packages

- `@repo/typescript-config`: Shared TypeScript configuration files

## 🛠️ Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with your Supabase credentials
```

## 🚀 Development

```bash
# Start all apps in development mode
npm run dev

# Start only the web app
npm run dev --filter=web
```

The web app will be available at http://localhost:3000

## 🏗️ Build

```bash
# Build all apps
npm run build

# Build only the web app
npm run build --filter=web
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run CI tests (lint + type-check + build)
npm run test:ci
```

## 📝 Scripts

- `npm run dev` - Start all apps in development mode
- `npm run build` - Build all apps for production
- `npm run start` - Start all apps in production mode
- `npm run lint` - Lint all apps
- `npm run lint:fix` - Fix linting issues
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run all tests
- `npm run test:ci` - Run CI tests
- `npm run clean` - Clean all build artifacts and node_modules
- `npm run format` - Format code with Prettier

## 🔧 Turborepo Features

### Remote Caching

Turborepo can use a technique known as Remote Caching to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need to authenticate with Vercel:

```bash
npx turbo login
```

Then link your Turborepo to your Remote Cache:

```bash
npx turbo link
```

### Filtering

Run commands for specific apps or packages:

```bash
# Run dev only for web app
npm run dev --filter=web

# Run build for all apps except web
npm run build --filter=!web
```

## 📚 Learn More

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## 📄 License

This project is private and proprietary.
