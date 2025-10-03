#!/bin/bash
# Demo script showing all server manager features

echo "═══════════════════════════════════════════════════════════"
echo "  DataForge Reader - Server Manager Demo"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

demo_step() {
    echo -e "${BLUE}▶ $1${NC}"
    echo -e "${YELLOW}  Command: $2${NC}"
    echo ""
    eval "$2"
    echo ""
    echo "Press Enter to continue..."
    read
    echo ""
}

# 1. Check initial status
demo_step "Step 1: Check initial server status" "./server status"

# 2. View current configuration
demo_step "Step 2: View current configuration" "./server config"

# 3. Start the server
demo_step "Step 3: Start the backend server" "./server start --force"

# 4. Check status while running
demo_step "Step 4: Check server status (while running)" "./server status"

# 5. Show recent logs
demo_step "Step 5: Show recent logs" "./server logs --lines 20"

# 6. Change configuration
demo_step "Step 6: Update configuration (change port to 8080)" "./server config --port 8080"

# 7. Restart with new config
demo_step "Step 7: Restart server with new configuration" "./server restart --force"

# 8. Check status with new port
demo_step "Step 8: Check status with new port" "./server status"

# 9. Restore original port
demo_step "Step 9: Restore original port (8000)" "./server config --port 8000"

# 10. Restart again
demo_step "Step 10: Restart with original port" "./server restart --force"

# 11. Final status
demo_step "Step 11: Final status check" "./server status"

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Demo Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Server is currently running. Available commands:"
echo "  ./server status  - Check status"
echo "  ./server logs    - View logs"
echo "  ./server stop    - Stop server"
echo ""
echo "For follow logs in real-time:"
echo "  ./server logs --follow"
echo ""
