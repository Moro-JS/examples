# Development Setup Guide

This repository supports **two development modes** to accommodate different use cases:

1. **NPM Mode** (Public GitHub) - Uses the published `@morojs/moro` package from npm
2. **Local Mode** (Framework Development) - Uses local file references for real-time testing

## 🎯 NPM Mode (GitHub Ready)

This mode uses the published `@morojs/moro` package from npm. Perfect for:
- Public repository distribution
- Users trying the examples
- Production deployments
- CI/CD pipelines

### Setup for NPM Mode

```bash
# Quick setup for all examples
npm run setup:npm

# Or manually for individual examples
cd simple-api
npm install  # This will install @morojs/moro from npm
```

**Current Status**: All examples are currently configured for NPM mode.

## 🔧 Local Development Mode

This mode uses local file references to the MoroJS framework. Perfect for:
- Framework development and testing
- Real-time changes to the framework
- Development workflow before publishing

### Prerequisites

Ensure the MoroJS framework repository is available at the expected location:
```
My Projects/
├── MoroJS/                 # Main framework repository
├── MoroJS Examples/        # This repository
└── MoroJs.com/            # Documentation website
```

### Setup for Local Mode

```bash
# Quick setup for all examples  
npm run setup:local

# Or manually for individual examples
cd simple-api
npm install  # This will use local file:../../MoroJS reference
```

## 🔄 Switching Between Modes

You can easily switch between modes using the provided scripts:

```bash
# Switch to NPM mode (GitHub ready)
npm run setup:npm

# Switch to Local mode (framework development)
npm run setup:local

# Update import statements (if needed)
npm run update:imports
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run setup:npm` | Configure all examples to use `@morojs/moro` from npm |
| `npm run setup:local` | Configure all examples to use local file references |
| `npm run update:imports` | Update all TypeScript imports from 'moro' to '@morojs/moro' |
| `npm run install:all` | Install dependencies for all examples |
| `npm run dev:all` | Start all examples in development mode |

## 🏗️ Project Structure

```
MoroJS Examples/
├── scripts/
│   ├── setup-npm.js       # NPM mode setup script
│   ├── setup-local.js     # Local mode setup script
│   └── update-imports.js  # Import statement updater
├── simple-api/
├── enterprise-app/
├── real-time-chat/
├── ecommerce-api/
└── ... (other examples)
```

## 🚀 Publishing Workflow

When preparing for public release:

1. **Switch to NPM mode**:
   ```bash
   npm run setup:npm
   ```

2. **Verify all examples work**:
   ```bash
   npm run install:all
   npm run build:all
   ```

3. **Commit and push** to GitHub

## 🔧 Development Workflow

When developing the framework:

1. **Switch to Local mode**:
   ```bash
   npm run setup:local
   ```

2. **Make changes** to the MoroJS framework

3. **Test in real-time** - changes are reflected immediately in examples

4. **Switch back to NPM mode** before publishing:
   ```bash
   npm run setup:npm
   ```

## 🧪 Testing Both Modes

To ensure everything works in both modes:

```bash
# Test NPM mode
npm run setup:npm
cd simple-api && npm run dev

# Test Local mode  
npm run setup:local
cd simple-api && npm run dev
```

## 📝 Package.json Differences

### NPM Mode
```json
{
  "dependencies": {
    "@morojs/moro": "^1.0.0"
  }
}
```

### Local Mode
```json
{
  "dependencies": {
    "@morojs/moro": "file:../../MoroJS"
  }
}
```

## 🔍 Troubleshooting

### "Cannot find module '@morojs/moro'"

1. Check which mode you're in
2. Run the appropriate setup script
3. Ensure dependencies are installed

### Local mode not working

1. Verify MoroJS framework exists at `../../MoroJS`
2. Run `npm run setup:local` again
3. Clear node_modules: `rm -rf node_modules && npm install`

### NPM mode failing

1. Ensure `@morojs/moro` is published to npm
2. Run `npm run setup:npm` again
3. Check npm registry connectivity

## 🎉 Benefits

This dual-mode system provides:

- ✅ **Seamless development** with local file references
- ✅ **Public distribution** with npm packages  
- ✅ **Easy switching** between modes
- ✅ **Automated setup** scripts
- ✅ **Consistent imports** across all examples
- ✅ **Real-time testing** during framework development 