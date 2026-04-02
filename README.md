# 🚀 React + TypeScript + Vite Enterprise Starter

![Version](https://img.shields.io/badge/version-v2.4.0-blue.svg?cacheSeconds=2592000)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

> **NexGen UI Framework**: A highly scalable, production-ready, and battle-tested foundation for building enterprise-grade modern web applications.

This repository is not just a boilerplate; it is a comprehensive architectural pattern designed to handle complex business logic, extreme performance requirements, and large-scale team collaboration seamlessly.

---

## 📑 Table of Contents

1. [Core Architecture & Philosophy](#-core-architecture--philosophy)
2. [Ecosystem & Tech Stack](#-ecosystem--tech-stack)
3. [Project Structure](#-project-structure)
4. [Getting Started (Local & Docker)](#-getting-started)
5. [Environment Configuration](#-environment-configuration)
6. [Advanced Configurations](#-advanced-configurations)
7. [Deployment & CI/CD](#-deployment--cicd)
8. [Git Workflow & Contribution](#-git-workflow--contribution)

---

## 🏛 Core Architecture & Philosophy

This template strictly follows the **Feature-Sliced Design (FSD)** architectural pattern, ensuring that modules are decoupled, highly cohesive, and infinitely scalable.

- **Atomic Design System:** UI components are strictly categorized into atoms, molecules, organisms, and templates.
- **Zero-Cost Abstractions:** Utilizing Vite's optimized build pipeline alongside SWC/Oxc for microsecond compilation times.
- **Predictable State Management:** Pre-configured architecture for global states (Zustand/Redux) and server states (React Query).
- **Strict Typing & Safety:** 100% strict mode TypeScript with auto-generated API schema typing.

---

## 📦 Ecosystem & Tech Stack

| Category        | Technology                 | Purpose                                       |
| :-------------- | :------------------------- | :-------------------------------------------- |
| **Core**        | React 18, TypeScript 5     | UI Library & Static Typing                    |
| **Build Tool**  | Vite 5                     | HMR, bundling, and local dev server           |
| **Routing**     | React Router DOM v6        | Data-driven routing and lazy loading          |
| **Styling**     | Tailwind CSS / CSS Modules | Utility-first, responsive, and themeable UI   |
| **Lint/Format** | ESLint, Prettier, Husky    | Code quality enforcement and pre-commit hooks |
| **Testing**     | Vitest, Testing Library    | Unit, Integration, and Component testing      |
| **Container**   | Docker & Docker Compose    | Containerized isolated environments           |

---

## ⚙️ Project Structure

```text
src/
├── 📁 app/               # App-wide configurations (store, router, providers)
├── 📁 assets/            # Static assets (images, fonts, raw icons)
├── 📁 components/        # Shared global components (UI Kit)
│   ├── 📁 ui/            # Base components (Button, Input, Modal)
│   └── 📁 layouts/       # Main wrapper layouts
├── 📁 features/          # Feature-based modules (Auth, Dashboard, User)
├── 📁 hooks/             # Custom global React hooks
├── 📁 lib/               # Pre-configured 3rd party libraries (Axios, Sentry)
├── 📁 pages/             # Route components
├── 📁 services/          # API SDKs and HTTP request layers
├── 📁 store/             # Global state management slices
├── 📁 types/             # Shared TypeScript definitions (.d.ts)
├── 📁 utils/             # Pure helper functions
├── 📄 App.tsx            # Root Application wrapper
└── 📄 main.tsx           # Entry point & React DOM injection
🚀 Getting Started
Prerequisites
Node.js >= 18.17.0 (LTS recommended)

pnpm >= 8.0.0 (Recommended) or npm/yarn

Docker (Optional, for containerized development)

Standard Installation
Clone & Install Dependencies

Bash
git clone [https://github.com/your-org/enterprise-react-vite.git](https://github.com/your-org/enterprise-react-vite.git)
cd enterprise-react-vite
pnpm install
Start the Development Server

Bash
pnpm dev
The server will launch at http://localhost:5173 with HMR enabled.

🐳 Docker Development
For a completely isolated environment matching production:

Bash
# Build and run the development container
docker-compose up --build

# Run in detached mode
docker-compose up -d
🔐 Environment Configuration
Security is prioritized. Ensure you duplicate .env.example to create your local environments.

Bash
cp .env.example .env.local
Required Variables (.env.local):

Đoạn mã
# API Gateways
VITE_API_BASE_URL=[https://api.dev.yourcompany.com/v1](https://api.dev.yourcompany.com/v1)
VITE_GRAPHQL_ENDPOINT=[https://api.dev.yourcompany.com/graphql](https://api.dev.yourcompany.com/graphql)

# Authentication & OAuth
VITE_AUTH_DOMAIN=your-tenant.auth0.com
VITE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx

# Telemetry & Monitoring (Production Only)
VITE_SENTRY_DSN=[https://example@sentry.io/123456](https://example@sentry.io/123456)
VITE_ANALYTICS_ID=UA-XXXXX-Y
🛠 Advanced Configurations
React Compiler (Experimental)
To achieve zero-memoization re-renders, you can opt-in to the new React Compiler.
Warning: May impact dev server build times on low-end machines.
Uncomment the compiler configuration in vite.config.ts and install the babel plugin.

Type-Aware Linting
This template utilizes AST-based type linting.

JavaScript
// eslint.config.js snippet
extends: [
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.strictTypeChecked,
]
Run pnpm lint:strict to enforce rules across the entire CI pipeline.

🚢 Deployment & CI/CD
This project is configured with GitHub Actions for automated testing, building, and deployment.

Build for Production
Bash
pnpm build
This generates optimized, minified, and tree-shaken static files in the /dist directory. We use Vite's chunk splitting strategy to ensure vendor files are cached effectively by the CDN.

Preview Production Build
Bash
pnpm preview
Supported Cloud Providers
Ready to be deployed out-of-the-box to:

Vercel / Netlify (Zero config)

AWS S3 + CloudFront

Kubernetes (using the provided Dockerfile.prod)

🤝 Git Workflow & Contribution
We follow a strict Trunk-Based Development or Git Flow depending on the sprint phase.

Conventional Commits Required: Commit messages must follow the type(scope): subject format (e.g., feat(auth): add JWT rotation).

Branch Naming:

Features: feat/ticket-id-short-desc

Bugs: fix/ticket-id-short-desc

Pre-commit Hooks: Husky will automatically run Prettier and ESLint before allowing a commit.

How to contribute:
Fork the project

Create your feature branch (git checkout -b feat/AmazingFeature)

Commit your changes (git commit -m 'feat(core): add some AmazingFeature')

Push to the branch (git push origin feat/AmazingFeature)

Open a Pull Request requiring at least 2 code reviews.

📄 License
Distributed under the MIT License. See LICENSE for more information.

Architected with ❤️ by the Core Engineering Team.
```
