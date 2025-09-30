---
name: DataForge Reader Release
about: Template for creating DataForge Reader releases
title: 'DataForge Reader v[VERSION]'
labels: 'release'
assignees: ''

---

## 🚀 DataForge Reader v[VERSION]

### 📦 Download
- **AppImage:** `DataForge-Reader-v[VERSION]-x86_64.AppImage`
- **Size:** ~35-40MB
- **Platform:** Linux x86_64

### 🆕 What's New in v[VERSION]

#### ✨ New Features
- [ ] Feature 1
- [ ] Feature 2

#### 🐛 Bug Fixes
- [ ] Fix 1
- [ ] Fix 2

#### 🔧 Improvements
- [ ] Improvement 1
- [ ] Improvement 2

#### 🏗️ Technical Changes
- [ ] Technical change 1
- [ ] Technical change 2

### 💾 Installation

#### Quick Start
```bash
# Download the AppImage
wget https://github.com/BlacMeW/DataForge-Reader/releases/download/v[VERSION]/DataForge-Reader-v[VERSION]-x86_64.AppImage

# Make executable
chmod +x DataForge-Reader-v[VERSION]-x86_64.AppImage

# Run
./DataForge-Reader-v[VERSION]-x86_64.AppImage
```

#### System Integration
```bash
# Install to system
sudo mv DataForge-Reader-v[VERSION]-x86_64.AppImage /opt/dataforge-reader
sudo ln -s /opt/dataforge-reader /usr/local/bin/dataforge-reader

# Run from anywhere
dataforge-reader
```

### 🖥️ System Requirements
- **Operating System:** Linux (glibc 2.17+)
- **Architecture:** x86_64 (64-bit)
- **Memory:** 512MB minimum, 2GB recommended
- **Storage:** ~200MB for application + your data
- **Dependencies:** None (fully self-contained)

### 🎯 Key Features
- 📄 **PDF Processing** - Upload and extract data from PDF documents
- 🏷️ **Smart Annotation** - AI-powered data labeling and classification
- 📊 **Dataset Export** - Export in JSON, CSV, JSONL formats
- 📋 **Custom Templates** - Create reusable data extraction templates
- 🔍 **Analytics Dashboard** - Built-in dataset analysis and visualization
- 💾 **Project Management** - Organize work into projects with auto-save

### 🔧 Troubleshooting

#### FUSE Issues
If you get FUSE-related errors:
```bash
# Install FUSE
sudo apt-get install fuse  # Ubuntu/Debian
sudo dnf install fuse      # Fedora

# Or run without FUSE
./DataForge-Reader-v[VERSION]-x86_64.AppImage --appimage-extract-and-run
```

#### Port Conflicts
The application automatically finds available ports, starting from:
- Backend: 8000
- Frontend: 5173

### 📝 Changelog

#### v[VERSION] - YYYY-MM-DD
- Added: New feature descriptions
- Fixed: Bug fix descriptions  
- Changed: Improvement descriptions
- Removed: Deprecated feature descriptions

### 🤝 Support
- 📖 [User Guide](USER_GUIDE.md)
- 🐛 [Report Issues](https://github.com/BlacMeW/DataForge-Reader/issues)
- 💬 [Discussions](https://github.com/BlacMeW/DataForge-Reader/discussions)

### 🏗️ Build Information
- **Built with:** GitHub Actions
- **Python:** 3.11
- **Node.js:** 18
- **Build Date:** Automated on tag push
- **Checksum:** Available in release assets

---

**Note:** This AppImage is portable and self-contained. No installation or root permissions required!