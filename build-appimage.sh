#!/bin/bash
# DataForge Reader AppImage Builder
# This script creates a portable AppImage containing both backend and frontend

set -e

echo "🏗️  Building DataForge Reader AppImage..."

# Configuration
APP_NAME="DataForge-Reader"
APP_VERSION="${1:-1.0.0}"  # Use first argument or default to 1.0.0
APP_DIR="AppDir"
PYTHON_VERSION="3.11"

# If we're in GitHub Actions, extract version from tag
if [ -n "$GITHUB_REF" ] && [[ "$GITHUB_REF" == refs/tags/* ]]; then
    APP_VERSION="${GITHUB_REF#refs/tags/}"
    APP_VERSION="${APP_VERSION#v}"  # Remove 'v' prefix if present
    print_status "Using version from GitHub tag: $APP_VERSION"
elif [ -n "$1" ]; then
    print_status "Using version from command line: $APP_VERSION"
else
    print_status "Using default version: $APP_VERSION"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    local missing_deps=()
    
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("python3")
    fi
    
    if ! command -v node &> /dev/null; then
        missing_deps+=("nodejs")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    if ! command -v wget &> /dev/null; then
        missing_deps+=("wget")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_status "Please install them with: sudo apt-get install ${missing_deps[*]}"
        exit 1
    fi
    
    print_success "All dependencies found"
    
    # Set up environment for CI builds
    if [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]; then
        print_status "CI environment detected, configuring for headless build..."
        export DISPLAY="${DISPLAY:-:99}"
        export DEBIAN_FRONTEND=noninteractive
        # Ensure npm cache is in a writable location
        export npm_config_cache=/tmp/.npm
    fi
}

# Clean previous builds
clean_build() {
    print_status "Cleaning previous builds..."
    rm -rf $APP_DIR
    rm -f $APP_NAME-*.AppImage
    print_success "Cleaned build directory"
}

# Create AppDir structure
create_appdir() {
    print_status "Creating AppDir structure..."
    
    mkdir -p $APP_DIR/usr/bin
    mkdir -p $APP_DIR/usr/lib
    mkdir -p $APP_DIR/usr/share/applications
    mkdir -p $APP_DIR/usr/share/icons/hicolor/256x256/apps
    mkdir -p $APP_DIR/opt/$APP_NAME
    
    print_success "AppDir structure created"
}

# Build frontend
build_frontend() {
    print_status "Building React frontend..."
    
    cd frontend
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing Node.js dependencies..."
        npm install
    fi
    
    # Build for production
    print_status "Building frontend for production..."
    npm run build
    
    # Copy built files to AppDir
    cp -r dist/* ../$APP_DIR/opt/$APP_NAME/
    
    cd ..
    print_success "Frontend built and copied to AppDir"
}

# Bundle Python backend
bundle_backend() {
    print_status "Bundling Python backend..."
    
    # Copy backend files
    cp -r backend $APP_DIR/opt/$APP_NAME/
    
    # Create virtual environment in AppDir
    python3 -m venv $APP_DIR/opt/$APP_NAME/venv
    
    # Activate virtual environment and install dependencies
    source $APP_DIR/opt/$APP_NAME/venv/bin/activate
    pip install -r backend/requirements.txt
    deactivate
    
    print_success "Python backend bundled"
}

# Create desktop file
create_desktop_file() {
    print_status "Creating desktop file..."
    
    cat > $APP_DIR/$APP_NAME.desktop << EOF
[Desktop Entry]
Type=Application
Name=DataForge Reader
Comment=Transform documents into ML-ready datasets
Exec=AppRun
Icon=$APP_NAME
Categories=Office;Development;
Keywords=ML;Dataset;PDF;EPUB;TextProcessing;
StartupNotify=true
EOF

    # Copy to standard location
    cp $APP_DIR/$APP_NAME.desktop $APP_DIR/usr/share/applications/
    
    print_success "Desktop file created"
}

# Create application icon
create_icon() {
    print_status "Creating application icon..."
    
    # Create a simple SVG icon (you can replace this with a custom icon)
    cat > $APP_DIR/usr/share/icons/hicolor/256x256/apps/$APP_NAME.svg << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" rx="32" fill="#1e40af"/>
  <circle cx="128" cy="80" r="24" fill="white"/>
  <rect x="80" y="120" width="96" height="8" rx="4" fill="white"/>
  <rect x="80" y="140" width="96" height="8" rx="4" fill="white"/>
  <rect x="80" y="160" width="96" height="8" rx="4" fill="white"/>
  <rect x="80" y="180" width="64" height="8" rx="4" fill="white"/>
  <text x="128" y="220" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="20" font-weight="bold">DF</text>
</svg>
EOF

    # Also create PNG version (convert SVG to PNG if ImageMagick is available)
    if command -v convert &> /dev/null; then
        convert $APP_DIR/usr/share/icons/hicolor/256x256/apps/$APP_NAME.svg $APP_DIR/usr/share/icons/hicolor/256x256/apps/$APP_NAME.png
    fi
    
    # Copy icon to AppDir root
    cp $APP_DIR/usr/share/icons/hicolor/256x256/apps/$APP_NAME.* $APP_DIR/
    
    print_success "Application icon created"
}

# Create AppRun script
create_apprun() {
    print_status "Creating AppRun script..."
    
    cat > $APP_DIR/AppRun << 'EOF'
#!/bin/bash
# DataForge Reader AppRun script

# Get the directory where this AppImage is located
APPDIR="$(dirname "$(readlink -f "${0}")")"

# Set up environment
export PATH="$APPDIR/opt/DataForge-Reader/venv/bin:$PATH"
export PYTHONPATH="$APPDIR/opt/DataForge-Reader:$PYTHONPATH"

# Change to the app directory
cd "$APPDIR/opt/DataForge-Reader"

# Function to check if port is in use
port_in_use() {
    netstat -tuln 2>/dev/null | grep ":$1 " >/dev/null 2>&1
}

# Function to find available port
find_available_port() {
    local port=$1
    while port_in_use $port; do
        port=$((port + 1))
    done
    echo $port
}

# Find available ports
BACKEND_PORT=$(find_available_port 8000)
FRONTEND_PORT=$(find_available_port 5173)

echo "🚀 Starting DataForge Reader..."
echo "📊 Backend will run on port: $BACKEND_PORT"
echo "🌐 Frontend will serve from: $FRONTEND_PORT"

# Start backend in background
echo "📦 Starting FastAPI backend..."
./venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port $BACKEND_PORT &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Failed to start backend"
    exit 1
fi

echo "✅ Backend started successfully (PID: $BACKEND_PID)"

# Start simple HTTP server for frontend
echo "🌐 Starting frontend server..."
cd "$APPDIR/opt/DataForge-Reader"

# Update API base URL in frontend files if necessary
if command -v sed >/dev/null 2>&1; then
    # Update any hardcoded localhost:8000 to use the actual backend port
    find . -name "*.js" -type f -exec sed -i "s/localhost:8000/localhost:$BACKEND_PORT/g" {} \; 2>/dev/null || true
fi

# Start Python HTTP server to serve frontend
./venv/bin/python -m http.server $FRONTEND_PORT --directory . >/dev/null 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 2

if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Failed to start frontend server"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Frontend server started (PID: $FRONTEND_PID)"
echo ""
echo "🎉 DataForge Reader is now running:"
echo "   🌐 Open your browser to: http://localhost:$FRONTEND_PORT"
echo "   🔧 Backend API: http://localhost:$BACKEND_PORT"
echo "   📚 API Docs: http://localhost:$BACKEND_PORT/docs"
echo ""
echo "Press Ctrl+C to stop all services..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Open browser if available
if command -v xdg-open >/dev/null 2>&1; then
    sleep 2
    xdg-open "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1 &
elif command -v firefox >/dev/null 2>&1; then
    sleep 2
    firefox "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1 &
fi

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
EOF

    chmod +x $APP_DIR/AppRun
    print_success "AppRun script created"
}

# Download and set up AppImageTool
setup_appimage_tool() {
    print_status "Setting up AppImageTool..."
    
    if [ ! -f "appimagetool-x86_64.AppImage" ]; then
        print_status "Downloading AppImageTool..."
        wget -q https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
        chmod +x appimagetool-x86_64.AppImage
    fi
    
    print_success "AppImageTool ready"
}

# Build AppImage
build_appimage() {
    print_status "Building AppImage..."
    
    # Set ARCH environment variable
    export ARCH=x86_64
    
    # Build the AppImage
    ./appimagetool-x86_64.AppImage $APP_DIR $APP_NAME-$APP_VERSION-x86_64.AppImage
    
    if [ -f "$APP_NAME-$APP_VERSION-x86_64.AppImage" ]; then
        chmod +x $APP_NAME-$APP_VERSION-x86_64.AppImage
        print_success "AppImage built successfully: $APP_NAME-$APP_VERSION-x86_64.AppImage"
        
        # Show file size
        local size=$(du -h $APP_NAME-$APP_VERSION-x86_64.AppImage | cut -f1)
        print_status "AppImage size: $size"
        
        # Show usage instructions
        echo ""
        print_success "🎉 Build complete!"
        echo ""
        echo "📦 Your AppImage is ready: $APP_NAME-$APP_VERSION-x86_64.AppImage"
        echo ""
        echo "📋 Usage:"
        echo "   1. Make executable: chmod +x $APP_NAME-$APP_VERSION-x86_64.AppImage"
        echo "   2. Run: ./$APP_NAME-$APP_VERSION-x86_64.AppImage"
        echo "   3. Or double-click in file manager"
        echo ""
        echo "✨ The AppImage contains everything needed to run DataForge Reader!"
        
    else
        print_error "Failed to build AppImage"
        exit 1
    fi
}

# Main build process
main() {
    echo "🏗️  DataForge Reader AppImage Builder"
    echo "===================================="
    echo ""
    
    check_dependencies
    clean_build
    create_appdir
    build_frontend
    bundle_backend
    create_desktop_file
    create_icon
    create_apprun
    setup_appimage_tool
    build_appimage
    
    echo ""
    print_success "🎯 All done! Your portable DataForge Reader is ready to distribute."
}

# Run main function
main "$@"