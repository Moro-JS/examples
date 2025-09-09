# Branch Protection Setup Guide

This guide explains how to set up branch protection rules for the MoroJS Examples repository to enforce the required status checks.

## 🛡️ Required Status Checks

The following status checks must be configured as required:

1. **lint-and-format** - Ensures code quality and consistent formatting
2. **test** - Ensures all tests pass
3. **build** - Ensures all examples compile successfully  
4. **security-audit** - Ensures no security vulnerabilities

## ⚙️ Setting Up Branch Protection

### Via GitHub Web Interface

1. **Navigate to Repository Settings**
   - Go to your repository on GitHub
   - Click on **Settings** tab
   - Click on **Branches** in the left sidebar

2. **Add Branch Protection Rule**
   - Click **Add rule**
   - Enter branch name pattern: `main` (or `master` if using master branch)

3. **Configure Protection Settings**
   
   #### Required Settings:
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals: `1` (minimum)
     - ✅ Dismiss stale PR approvals when new commits are pushed
     - ✅ Require review from code owners (if CODEOWNERS file exists)
   
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - **Add the following status checks:**
       - `lint-and-format`
       - `test` 
       - `build`
       - `security-audit`
   
   - ✅ **Require conversation resolution before merging**
   - ✅ **Restrict pushes that create files larger than 100MB**

   #### Optional but Recommended:
   - ✅ **Require linear history** (prevents merge commits)
   - ✅ **Include administrators** (applies rules to admins too)
   - ✅ **Allow force pushes** → Everyone (for rebasing)
   - ✅ **Allow deletions** (for cleaning up branches)

4. **Save the Rule**
   - Click **Create** to save the branch protection rule

### Via GitHub CLI

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Set up branch protection rule
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["lint-and-format","test","build","security-audit"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":true,"required_approving_review_count":1}' \
  --field restrictions=null
```

### Via GitHub API

```bash
curl -X PUT \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/OWNER/REPO/branches/main/protection \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": [
        "lint-and-format",
        "test", 
        "build",
        "security-audit"
      ]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": true,
      "required_approving_review_count": 1
    },
    "restrictions": null
  }'
```

## 🔍 Verifying Setup

After setting up branch protection:

1. **Check Status Checks**
   - Create a test PR
   - Verify all 4 status checks appear and run
   - Confirm PR cannot be merged until all checks pass

2. **Test Each Status Check**
   ```bash
   # Test lint-and-format (should fail)
   echo "console.log('bad formatting'   )" >> simple-api/src/server.ts
   git add . && git commit -m "test: bad formatting"
   
   # Test build (should fail) 
   echo "invalid typescript syntax" >> simple-api/src/server.ts
   git add . && git commit -m "test: build failure"
   
   # Test security-audit (check for vulnerabilities)
   npm audit
   ```

## 📋 Status Check Details

### lint-and-format
- **Job Name**: `Lint and Format`
- **Checks**: ESLint rules, Prettier formatting
- **Fix Command**: `npm run lint:fix && npm run format`

### test  
- **Job Name**: `Test`
- **Checks**: Jest tests across all examples
- **Fix Command**: Fix failing tests or add missing tests

### build
- **Job Name**: `Build` 
- **Checks**: TypeScript compilation for all examples
- **Fix Command**: Fix TypeScript errors

### security-audit
- **Job Name**: `Security Audit`
- **Checks**: npm audit for vulnerabilities
- **Fix Command**: `npm audit fix` or update dependencies

## 🚨 Troubleshooting

### Status Checks Not Appearing
- Ensure the workflow file is in `.github/workflows/ci.yml`
- Check that job names match exactly: `lint-and-format`, `test`, `build`, `security-audit`
- Verify the workflow runs on `pull_request` events

### Status Checks Failing
- Check the Actions tab for detailed error logs
- Run checks locally first: `npm run lint && npm run test:all && npm run build:all && npm run audit:security`
- Ensure all dependencies are installed: `npm run install:all`

### Permission Issues
- Ensure you have admin access to the repository
- Check that the GitHub token has the necessary permissions
- Verify the repository settings allow the required actions

## 📚 Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [GitHub Actions Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [MoroJS Examples Contributing Guide](.github/CONTRIBUTING.md)

---

**Note**: After setting up branch protection, all contributors must follow the process outlined in [CONTRIBUTING.md](.github/CONTRIBUTING.md) to ensure their PRs pass all required checks. 