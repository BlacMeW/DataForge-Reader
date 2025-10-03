# AppImage Build Documentation

## Overview

DataForge Reader can be packaged as an AppImage - a portable application format for Linux that contains everything needed to run the application. The AppImage includes both the FastAPI backend and React frontend in a single executable file.

## Requirements

### System Dependencies
- Python 3.8+ with venv module
- Node.js 16+ and npm
- wget (for downloading AppImageTool)
- ImageMagick (optional, for icon conversion)
- Standard Linux utilities (bash, netstat, sed)

### Installation on Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install python3 python3-venv nodejs npm wget imagemagick
```

### Installation on CentOS/RHEL/Fedora:
```bash
# CentOS/RHEL
sudo yum install python3 python3-venv nodejs npm wget ImageMagick

# Fedora
sudo dnf install python3 python3-venv nodejs npm wget ImageMagick
```

## Building the AppImage

### Simple Build
```bash
./build-appimage.sh
```

### Build with Frontend Optimization
```bash
./optimize-frontend.sh  # Optional: optimize frontend first
./build-appimage.sh
```

## Build Process Details

The build script performs these steps:

1. **Dependency Check** - Verifies all required tools are installed
2. **Clean Build** - Removes previous build artifacts
3. **Create AppDir** - Sets up the AppImage directory structure
4. **Build Frontend** - Compiles React app to static files
5. **Bundle Backend** - Creates Python virtual environment with dependencies
6. **Create Desktop File** - Generates .desktop file for system integration
7. **Create Icon** - Generates application icon (SVG/PNG)
8. **Create AppRun** - Main executable script that starts both servers
9. **Package AppImage** - Uses AppImageTool to create final .AppImage file

## AppImage Structure

```
DataForge-Reader-1.0.0-x86_64.AppImage
├── AppRun                      # Main executable script
├── DataForge-Reader.desktop    # Desktop integration
├── DataForge-Reader.svg        # Application icon
└── opt/DataForge-Reader/       # Application files
    ├── venv/                   # Python virtual environment
    ├── backend/                # FastAPI backend
    ├── index.html              # Frontend entry point
    └── assets/                 # Frontend static assets
```

## Runtime Behavior

When the AppImage is executed:

1. **Port Detection** - Finds available ports (starting from 8000 for backend, 5173 for frontend)
2. **Backend Startup** - Starts FastAPI server using bundled Python environment
3. **Frontend Startup** - Serves static files using Python HTTP server
4. **Browser Launch** - Automatically opens default browser (if available)
5. **Signal Handling** - Properly shuts down services on Ctrl+C

## Distribution

The resulting AppImage file:
- **Size**: Typically 150-300MB (includes Python runtime and Node.js assets)
- **Compatibility**: Runs on most Linux distributions (glibc 2.17+)
- **Permissions**: Requires execute permission (`chmod +x`)
- **Dependencies**: No installation required, fully self-contained

## Usage Examples

### Basic Usage
```bash
# Make executable
chmod +x DataForge-Reader-1.0.0-x86_64.AppImage

# Run the application
./DataForge-Reader-1.0.0-x86_64.AppImage
```

### System Integration
```bash
# Copy to applications directory
sudo cp DataForge-Reader-1.0.0-x86_64.AppImage /opt/
sudo ln -s /opt/DataForge-Reader-1.0.0-x86_64.AppImage /usr/local/bin/dataforge-reader

# Now can run from anywhere
dataforge-reader
```

### Desktop Integration
The AppImage includes a desktop file, so it can be:
- Added to application menus
- Pinned to taskbars
- Associated with file types

## Troubleshooting

### Common Issues

1. **FUSE not available**
   ```bash
   sudo apt-get install fuse
   # Or run with --appimage-extract-and-run
   ./DataForge-Reader-1.0.0-x86_64.AppImage --appimage-extract-and-run
   ```

2. **Port conflicts**
   - The AppImage automatically finds available ports
   - Check firewall settings if browser can't connect

3. **Missing dependencies during build**
   ```bash
   # Check what's missing
   ./build-appimage.sh
   # Install missing packages as suggested
   ```

4. **Large file size**
   - Use `./optimize-frontend.sh` before building
   - Consider excluding unnecessary Python packages

### Logs and Debugging

The AppImage shows status messages during startup. For more detailed logs:
```bash
# Run with verbose output
./DataForge-Reader-1.0.0-x86_64.AppImage --verbose

# Extract and inspect contents
./DataForge-Reader-1.0.0-x86_64.AppImage --appimage-extract
cd squashfs-root/
```

## Customization

### Custom Icon
Replace the generated icon by modifying the `create_icon()` function in `build-appimage.sh` or providing your own SVG/PNG files.

### Different Ports
Modify the port numbers in the `AppRun` script within the build script.

### Additional Dependencies
Add Python packages to `backend/requirements.txt` or Node.js packages to `frontend/package.json` before building.

## Performance Notes

- **Startup Time**: ~3-5 seconds (includes backend startup)
- **Memory Usage**: ~100-200MB (Python + Node.js runtime)
- **Disk Space**: AppImage extracts temporarily to `/tmp`
- **Network**: Only uses localhost (127.0.0.1) - no external connections required

## Security Considerations

- AppImage runs with user permissions (not root)
- All data stored locally (uploads, exports)
- No network communication beyond localhost
- Python environment is isolated within the AppImage

## Version Management

The build script includes version management:
- Update `APP_VERSION` in `build-appimage.sh`
- Semantic versioning recommended (e.g., 1.0.0, 1.1.0)
- Each build creates a uniquely named file

This allows multiple versions to coexist and easy rollback if needed.