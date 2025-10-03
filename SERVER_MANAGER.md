# Backend Server Manager Documentation

## Overview

The Backend Server Manager is a systemd-like service manager for the DataForge Reader FastAPI backend. It provides complete control over the backend server lifecycle with automatic port management.

## Features

✅ **Start/Stop/Restart** - Full server lifecycle management  
✅ **Status Monitoring** - Real-time server status and resource usage  
✅ **Automatic Port Cleanup** - Kills processes blocking the port  
✅ **Log Management** - View and follow server logs  
✅ **Configuration** - Persistent server configuration  
✅ **Process Management** - PID tracking and process validation  

## Installation

The server manager requires the following Python packages:

```bash
pip install psutil
```

All other dependencies are included with FastAPI.

## Usage

### Quick Start

```bash
# Using the wrapper script (recommended)
./server start              # Start the backend
./server stop               # Stop the backend
./server restart            # Restart the backend
./server status             # Check status

# Or using Python directly
python backend/server_manager.py start
python backend/server_manager.py stop
python backend/server_manager.py restart
python backend/server_manager.py status
```

## Commands

### start

Start the backend server.

```bash
./server start
./server start --force      # Kill any process using the port first
```

**Options:**
- `--force` - Automatically kill any process using the configured port

**Output:**
```
🚀 Starting DataForge Reader Backend Server...
📦 Starting server on 127.0.0.1:8000...
✅ Server started successfully (PID: 12345)
🌐 API URL: http://127.0.0.1:8000
📚 API Docs: http://127.0.0.1:8000/docs
📝 Logs: /path/to/backend.log
```

### stop

Stop the running backend server gracefully.

```bash
./server stop
```

**Behavior:**
1. Sends SIGTERM for graceful shutdown
2. Waits up to 10 seconds
3. Forces kill if necessary
4. Cleans up PID file

**Output:**
```
🛑 Stopping DataForge Reader Backend Server...
📤 Sending SIGTERM to process 12345...
✅ Server stopped successfully (PID: 12345)
```

### restart

Restart the backend server (stop + start).

```bash
./server restart
./server restart --force    # Kill port conflicts during restart
```

**Output:**
```
🔄 Restarting DataForge Reader Backend Server...
🛑 Stopping DataForge Reader Backend Server...
✅ Server stopped successfully (PID: 12345)
🚀 Starting DataForge Reader Backend Server...
✅ Server started successfully (PID: 12346)
```

### status

Display detailed server status and resource usage.

```bash
./server status
```

**Output:**
```
📊 DataForge Reader Backend Server Status
============================================================
Status: ✅ RUNNING
PID: 12345
Started: 2025-10-03 14:30:22
CPU Usage: 2.5%
Memory Usage: 156.3 MB
Listening Ports: 8000
API URL: http://127.0.0.1:8000
API Docs: http://127.0.0.1:8000/docs
Log File: /path/to/backend.log
```

**When stopped:**
```
📊 DataForge Reader Backend Server Status
============================================================
Status: ❌ STOPPED
Port 8000: Available
```

### logs

View or follow server logs.

```bash
./server logs                  # Show last 50 lines
./server logs --lines 100      # Show last 100 lines
./server logs --follow         # Follow logs in real-time (like tail -f)
```

**Options:**
- `--lines N` - Number of lines to display (default: 50)
- `--follow` - Follow logs in real-time (Ctrl+C to stop)

### kill-port

Kill any process using a specific port.

```bash
./server kill-port --port 8000
```

**Use Cases:**
- Port conflict resolution
- Cleaning up stuck processes
- Manual port management

**Output:**
```
🔍 Checking for processes on port 8000...
⚠️  Found process 12345 (python) using port 8000
🔫 Killing process 12345...
✅ Process 12345 killed successfully
✅ Port 8000 is now free
```

### config

View or update server configuration.

```bash
# View current configuration
./server config

# Update configuration
./server config --port 8080
./server config --host 0.0.0.0
./server config --reload true
./server config --port 9000 --host 0.0.0.0
```

**Available Options:**
- `--port` - Server port (default: 8000)
- `--host` - Host address (default: 127.0.0.1)
- `--reload` - Auto-reload on code changes (true/false)

**Output:**
```
✅ Updated port = 8080
✅ Updated host = 0.0.0.0
💾 Configuration saved
💡 Restart the server for changes to take effect
```

## Configuration

The server manager stores configuration in `.backend_config.json`:

```json
{
  "host": "127.0.0.1",
  "port": 8000,
  "workers": 1,
  "reload": true,
  "log_level": "info"
}
```

## Files

The server manager creates and manages the following files:

- `.backend.pid` - Process ID file for tracking the running server
- `backend.log` - Server log file with timestamped entries
- `.backend_config.json` - Persistent server configuration

## Process Management

### PID Tracking

The server manager maintains a PID file (`.backend.pid`) to track the running process. It validates that:
1. The PID exists in the system
2. The process is actually a uvicorn server
3. The process is running `backend.main:app`

### Automatic Cleanup

The server manager automatically cleans up:
- Stale PID files (when process no longer exists)
- Port conflicts (with `--force` flag)
- Orphaned processes

### Port Management

The server manager can:
- Detect processes using a specific port
- Kill processes blocking the configured port
- Verify port availability before starting

## Integration with Existing Scripts

You can integrate the server manager with your existing `start.sh`:

```bash
#!/bin/bash
# Updated start.sh

# Start backend using server manager
./server start --force

# Start frontend
cd frontend
npm run dev
```

## Systemd Integration (Optional)

Create a systemd service file for production:

```ini
# /etc/systemd/system/dataforge-backend.service
[Unit]
Description=DataForge Reader Backend Server
After=network.target

[Service]
Type=forking
User=youruser
WorkingDirectory=/path/to/DataForge-Reader
ExecStart=/path/to/DataForge-Reader/server start
ExecStop=/path/to/DataForge-Reader/server stop
ExecReload=/path/to/DataForge-Reader/server restart
PIDFile=/path/to/DataForge-Reader/.backend.pid
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then manage with systemd:
```bash
sudo systemctl start dataforge-backend
sudo systemctl stop dataforge-backend
sudo systemctl status dataforge-backend
sudo systemctl enable dataforge-backend  # Auto-start on boot
```

## Troubleshooting

### Server won't start - Port in use

```bash
# Check what's using the port
./server kill-port --port 8000

# Or force start (kills the process automatically)
./server start --force
```

### Server shows as running but isn't responding

```bash
# Check actual status
./server status

# Force restart
./server stop
./server start --force
```

### View error details

```bash
# Check recent logs
./server logs

# Follow logs in real-time
./server logs --follow
```

### Clean start

```bash
# Stop server
./server stop

# Kill any process on the port
./server kill-port --port 8000

# Remove PID file manually if needed
rm -f .backend.pid

# Start fresh
./server start
```

## Advanced Usage

### Custom Port

```bash
# Configure custom port
./server config --port 9000

# Restart to apply
./server restart
```

### Production Mode

```bash
# Disable auto-reload for production
./server config --reload false

# Use multiple workers (requires gunicorn)
# Edit .backend_config.json manually:
{
  "workers": 4,
  "reload": false
}

./server restart
```

### Monitoring

```bash
# Continuous monitoring with watch
watch -n 2 './server status'

# Or create a monitoring script
while true; do
  ./server status
  sleep 5
done
```

## Exit Codes

- `0` - Success
- `1` - Failure (server not running, couldn't start, etc.)

Useful for scripting:

```bash
if ./server status > /dev/null 2>&1; then
    echo "Server is running"
else
    echo "Server is not running"
    ./server start
fi
```

## API

The server manager can also be used as a Python module:

```python
from backend.server_manager import ServerManager

manager = ServerManager()

# Start server
if manager.start(force=True):
    print("Server started successfully")

# Check status
if manager.status():
    print("Server is running")

# Stop server
manager.stop()
```

## Security Considerations

1. **PID File** - Validates process ownership to prevent PID conflicts
2. **Port Management** - Only kills processes that are listening on the port
3. **Log Files** - Logs are appended, preserving history
4. **Graceful Shutdown** - Always attempts SIGTERM before SIGKILL

## Performance

- Minimal overhead (Python + psutil)
- Fast startup (~2 seconds)
- Efficient process monitoring
- No daemon required

## Limitations

1. Single server instance per port
2. Requires Python 3.7+
3. Requires `psutil` package
4. Log rotation not included (use logrotate)

## Future Enhancements

- [ ] Multiple server instances
- [ ] Built-in log rotation
- [ ] Health check endpoints
- [ ] Email/webhook notifications
- [ ] Automatic crash recovery
- [ ] Performance metrics

## Support

For issues or questions:
1. Check the logs: `./server logs`
2. Verify status: `./server status`
3. Clean restart: `./server stop && ./server start --force`

## License

Part of DataForge Reader project.
