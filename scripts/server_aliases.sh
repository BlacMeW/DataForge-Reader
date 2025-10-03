#!/bin/bash
# Convenient aliases for the backend server manager
# Source this file in your shell: source server_aliases.sh
# Or add to your ~/.bashrc or ~/.zshrc

# Get the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Server management aliases
alias dfr-start="cd $PROJECT_DIR && ./server start --force"
alias dfr-stop="cd $PROJECT_DIR && ./server stop"
alias dfr-restart="cd $PROJECT_DIR && ./server restart --force"
alias dfr-status="cd $PROJECT_DIR && ./server status"
alias dfr-logs="cd $PROJECT_DIR && ./server logs"
alias dfr-logs-follow="cd $PROJECT_DIR && ./server logs --follow"
alias dfr-config="cd $PROJECT_DIR && ./server config"

# Short aliases
alias ss="cd $PROJECT_DIR && ./server status"
alias sr="cd $PROJECT_DIR && ./server restart --force"
alias sl="cd $PROJECT_DIR && ./server logs --follow"

echo "✅ DataForge Reader server aliases loaded!"
echo ""
echo "Available aliases:"
echo "  dfr-start          - Start backend server"
echo "  dfr-stop           - Stop backend server"
echo "  dfr-restart        - Restart backend server"
echo "  dfr-status         - Check server status"
echo "  dfr-logs           - View recent logs"
echo "  dfr-logs-follow    - Follow logs in real-time"
echo "  dfr-config         - View/update configuration"
echo ""
echo "Short aliases:"
echo "  ss                 - Server status"
echo "  sr                 - Server restart"
echo "  sl                 - Follow logs"
echo ""
echo "To make these permanent, add to your ~/.bashrc or ~/.zshrc:"
echo "  source $PROJECT_DIR/server_aliases.sh"
