# Contributing to MoroJS Examples

Thank you for your interest in contributing to the MoroJS Examples repository! This document outlines the contribution process and requirements.

## 📋 Prerequisites

Before contributing, ensure you have:

- Node.js >= 18.0.0
- npm >= 8.0.0
- Git

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/MoroJS-Examples.git
   cd MoroJS-Examples
   ```
3. **Install dependencies**:
   ```bash
   npm ci
   npm run install:all
   ```

## 🔍 Status Checks

All pull requests must pass the following status checks before they can be merged:

### 1. **lint-and-format** ✨
- **ESLint**: Code must pass linting with no warnings
- **Prettier**: Code must be properly formatted
- **Run locally**:
  ```bash
  npm run lint        # Check for linting issues
  npm run lint:fix    # Auto-fix linting issues
  npm run format      # Format code
  npm run format:check # Check formatting
  ```

### 2. **test** 🧪
- All existing tests must pass
- New features should include appropriate tests
- **Run locally**:
  ```bash
  npm run test:all    # Run all tests
  ```

### 3. **build** 🔨
- All TypeScript examples must compile successfully
- No build errors allowed
- **Run locally**:
  ```bash
  npm run build:all   # Build all examples
  ```

### 4. **security-audit** 🔒
- No high or critical security vulnerabilities
- Dependencies must pass security audit
- **Run locally**:
  ```bash
  npm run audit:security  # Run security audit
  npm audit fix          # Fix vulnerabilities
  ```

## 📝 Contribution Guidelines

### Code Style
- Follow the existing code style and conventions
- Use TypeScript for all new code
- Include proper JSDoc comments for public APIs
- Follow the existing project structure

### Commit Messages
Use conventional commit format:
```
type(scope): description

feat(api): add user authentication endpoint
fix(chat): resolve WebSocket connection issue
docs(readme): update installation instructions
```

### Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the guidelines above

3. **Test locally**:
   ```bash
   npm run lint
   npm run format:check
   npm run test:all
   npm run build:all
   npm run audit:security
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a pull request** on GitHub

### Pull Request Requirements

- [ ] All status checks pass
- [ ] Code is well-documented
- [ ] Tests are included for new features
- [ ] README is updated if needed
- [ ] No breaking changes (unless discussed)

## 🏗️ Project Structure

```
MoroJS Examples/
├── .github/
│   ├── workflows/ci.yml      # CI/CD pipeline
│   └── CONTRIBUTING.md       # This file
├── simple-api/              # Basic API example
├── enterprise-app/          # Complex application example
├── microservice/            # Microservices examples
├── scripts/                 # Build and utility scripts
├── package.json             # Root package configuration
├── eslint.config.mjs        # ESLint configuration
└── .prettierrc.json         # Prettier configuration
```

## 🐛 Reporting Issues

When reporting issues:
1. Use the issue templates if available
2. Include reproduction steps
3. Provide environment information
4. Include relevant code snippets or logs

## 💡 Suggesting Features

For feature requests:
1. Check existing issues first
2. Explain the use case and benefits
3. Provide implementation suggestions if possible
4. Consider backward compatibility

## 🔧 Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:*` | Start development server for specific example |
| `npm run build:all` | Build all examples |
| `npm run test:all` | Run all tests |
| `npm run lint` | Check code style |
| `npm run format` | Format code |
| `npm run install:all` | Install dependencies for all examples |

## 📞 Getting Help

- 📖 [MoroJS Documentation](https://github.com/morojs/moro)
- 💬 [GitHub Discussions](https://github.com/morojs/MoroJS-Examples/discussions)
- 🐛 [Report Issues](https://github.com/morojs/MoroJS-Examples/issues)

## 📜 License

By contributing to MoroJS Examples, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to MoroJS Examples! 🎉 