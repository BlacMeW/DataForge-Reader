#!/bin/bash
# Quick release helper script

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
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

# Check if version is provided
if [ -z "$1" ]; then
    print_error "Please provide a version number"
    echo "Usage: $0 <version>"
    echo "Example: $0 1.2.3"
    exit 1
fi

VERSION="$1"

# Validate version format (basic semver check)
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    print_error "Invalid version format. Use semantic versioning (e.g., 1.2.3)"
    exit 1
fi

TAG="v$VERSION"

print_info "🚀 Creating release for DataForge Reader $VERSION"

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "You're not on the main branch (currently on: $CURRENT_BRANCH)"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Aborted"
        exit 1
    fi
fi

# Check if tag already exists
if git tag -l | grep -q "^$TAG$"; then
    print_error "Tag $TAG already exists!"
    print_info "To delete it: git tag -d $TAG && git push origin :refs/tags/$TAG"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes:"
    git status --short
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Aborted"
        exit 1
    fi
fi

# Optional: Test build locally first
read -p "Test build locally before releasing? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    print_info "Building AppImage locally for testing..."
    if ./build-appimage.sh "$VERSION"; then
        print_success "Local build successful!"
        APPIMAGE_FILE="DataForge-Reader-$VERSION-x86_64.AppImage"
        if [ -f "$APPIMAGE_FILE" ]; then
            print_info "AppImage created: $APPIMAGE_FILE ($(du -h "$APPIMAGE_FILE" | cut -f1))"
            read -p "Test the AppImage now? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_info "Starting AppImage test..."
                chmod +x "$APPIMAGE_FILE"
                ./"$APPIMAGE_FILE" &
                APPIMAGE_PID=$!
                sleep 3
                print_info "AppImage started (PID: $APPIMAGE_PID). Check if it works, then press Enter to continue..."
                read -r
                kill $APPIMAGE_PID 2>/dev/null || true
            fi
        fi
    else
        print_error "Local build failed! Fix issues before releasing."
        exit 1
    fi
fi

# Confirm release
print_info "Ready to create release:"
echo "  • Version: $VERSION"
echo "  • Tag: $TAG"
echo "  • Branch: $CURRENT_BRANCH"
echo "  • This will trigger GitHub Actions to build and publish the release"
echo ""
read -p "Create the release? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Release cancelled"
    exit 0
fi

# Create and push tag
print_info "Creating tag $TAG..."
git tag "$TAG"

print_info "Pushing tag to GitHub..."
git push origin "$TAG"

print_success "🎉 Release $VERSION initiated!"
print_info "• GitHub Actions will now build the AppImage"
print_info "• Check progress at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions"
print_info "• Release will be available at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/releases"

# Clean up local test build
if [ -f "DataForge-Reader-$VERSION-x86_64.AppImage" ]; then
    read -p "Remove local test AppImage? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        rm "DataForge-Reader-$VERSION-x86_64.AppImage"
        print_success "Local AppImage cleaned up"
    fi
fi

print_success "Release process complete! 🚀"