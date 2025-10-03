# GitHub Release Process

This document explains how to create and manage releases for DataForge Reader.

## 🚀 Quick Release Guide

### 1. Create a Release
```bash
# Tag and push a new version
git tag v1.0.0
git push origin v1.0.0
```

**That's it!** GitHub Actions will automatically:
- Build the AppImage
- Create a GitHub release
- Upload the AppImage as a release asset

## 📋 Detailed Process

### Version Tagging

We use semantic versioning (SemVer): `v<MAJOR>.<MINOR>.<PATCH>`

**Examples:**
- `v1.0.0` - Initial release
- `v1.0.1` - Bug fix
- `v1.1.0` - New features
- `v2.0.0` - Breaking changes

### Creating Releases

#### Method 1: Command Line (Recommended)
```bash
# Make sure you're on main branch
git checkout main
git pull origin main

# Create and push a tag
git tag v1.2.3
git push origin v1.2.3
```

#### Method 2: GitHub Web Interface
1. Go to your repository on GitHub
2. Click "Releases" → "Create a new release"
3. Click "Choose a tag" → Create new tag (e.g., `v1.2.3`)
4. Click "Generate release notes" for automated changelog
5. Click "Publish release"

### Pre-release Testing

Before tagging a release, test locally:

```bash
# Test build with specific version
./build-appimage.sh 1.2.3

# Verify the AppImage works
chmod +x DataForge-Reader-1.2.3-x86_64.AppImage
./DataForge-Reader-1.2.3-x86_64.AppImage
```

## 🤖 Automated Workflow

### What Happens Automatically

When you push a tag (e.g., `v1.2.3`):

1. **GitHub Actions Triggers** - The `release.yml` workflow starts
2. **Environment Setup** - Installs Node.js, Python, and dependencies
3. **Frontend Build** - Compiles React app to optimized static files
4. **AppImage Creation** - Packages everything into a portable AppImage
5. **Release Creation** - Creates GitHub release with formatted notes
6. **Asset Upload** - Attaches the AppImage to the release

### Build Environment

- **OS:** Ubuntu Latest
- **Node.js:** 18.x
- **Python:** 3.11
- **Dependencies:** Auto-installed (npm, pip, system packages)

## 📝 Release Notes

### Automatic Generation
The workflow generates release notes with:
- Download instructions
- System requirements
- Feature highlights
- Known issues
- Troubleshooting guide

### Custom Release Notes
To customize release notes:

1. Create release manually on GitHub
2. Use the template from `.github/RELEASE_TEMPLATE.md`
3. Fill in version-specific changes

### Changelog Format
```markdown
## v1.2.3 - 2024-01-15

### ✨ New Features
- Feature description

### 🐛 Bug Fixes
- Bug fix description

### 🔧 Improvements
- Improvement description

### 🏗️ Technical Changes
- Technical change description
```

## 📦 Release Assets

### What's Included
Each release includes:
- **AppImage file** - `DataForge-Reader-v1.2.3-x86_64.AppImage`
- **Source code** - Automatic ZIP and tar.gz
- **Release notes** - Formatted markdown

### File Naming Convention
- Format: `DataForge-Reader-v{VERSION}-x86_64.AppImage`
- Example: `DataForge-Reader-v1.2.3-x86_64.AppImage`

## 🔧 Troubleshooting Releases

### Build Failures

#### Common Issues
1. **Frontend build fails**
   ```bash
   # Check frontend locally
   cd frontend
   npm ci
   npm run build
   ```

2. **Python dependencies fail**
   ```bash
   # Check backend locally
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **AppImageTool fails**
   - Check AppDir structure is correct
   - Verify all files have proper permissions

#### Debugging Failed Builds
1. Go to Actions tab in GitHub
2. Click the failed workflow run
3. Check the logs for specific error messages
4. Fix issues and create a new tag

### Release Issues

#### Wrong Version Number
```bash
# Delete the tag locally and remotely
git tag -d v1.2.3
git push origin :refs/tags/v1.2.3

# Create correct tag
git tag v1.2.4
git push origin v1.2.4
```

#### Missing Assets
- Check workflow logs
- Re-run the workflow if needed
- Manually upload assets if workflow succeeds but upload fails

## 🏷️ Version Management

### Development Workflow
```bash
# Work on features
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "Add new feature"
git push origin feature/new-feature

# Merge to main
# ... create PR, review, merge ...

# Release when ready
git checkout main
git pull origin main
git tag v1.2.3
git push origin v1.2.3
```

### Version Branches
- `main` - Stable, release-ready code
- `develop` - Integration branch (optional)
- `feature/*` - Feature branches
- `hotfix/*` - Critical fixes

### Hotfix Releases
For critical bugs:
```bash
# Create hotfix branch
git checkout -b hotfix/critical-fix main

# Fix the issue
git commit -m "Fix critical bug"

# Merge to main
git checkout main
git merge hotfix/critical-fix

# Tag and release
git tag v1.2.4
git push origin v1.2.4

# Clean up
git branch -d hotfix/critical-fix
```

## 📊 Release Analytics

### Tracking Downloads
- View download counts on GitHub Releases page
- Use GitHub API for programmatic access
- Monitor which versions are most popular

### User Feedback
- Watch for issues filed against specific versions
- Monitor discussions for user feedback
- Use release feedback to plan future versions

## 🔄 Release Lifecycle

### Support Policy
- **Latest version** - Full support and updates
- **Previous minor** - Security fixes only
- **Older versions** - Community support only

### Deprecation Process
1. Announce deprecation in release notes
2. Provide migration path
3. Give 3-6 months notice before removal
4. Remove in next major version

---

## 📚 Quick Reference

### Commands
```bash
# Create release
git tag v1.2.3 && git push origin v1.2.3

# Delete release
git tag -d v1.2.3 && git push origin :refs/tags/v1.2.3

# List tags
git tag -l

# Test build locally
./build-appimage.sh 1.2.3
```

### Files
- `.github/workflows/release.yml` - Automated build workflow
- `.github/RELEASE_TEMPLATE.md` - Release notes template
- `build-appimage.sh` - Build script with version support

### Workflow Triggers
- **Tag push** - `git push origin v1.2.3`
- **Manual** - GitHub Actions → "Run workflow"
- **Draft release** - Create release in GitHub UI