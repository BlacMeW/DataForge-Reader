# Server Manager Quick Reference

## Basic Commands

```bash
./server start          # Start backend server
./server stop           # Stop backend server  
./server restart        # Restart backend server
./server status         # Check server status
```

## Common Tasks

### Start Server (with auto port cleanup)
```bash
./server start --force
```

### View Logs
```bash
./server logs              # Last 50 lines
./server logs --lines 100  # Last 100 lines
./server logs --follow     # Follow in real-time
```

### Kill Process on Port
```bash
./server kill-port --port 8000
```

### Configure Server
```bash
./server config                           # View config
./server config --port 9000               # Change port
./server config --host 0.0.0.0            # Change host
./server config --port 8080 --reload true # Multiple options
```

## Status Output

### When Running
```
Status: ✅ RUNNING
PID: 12345
Started: 2025-10-03 14:30:22
CPU Usage: 2.5%
Memory Usage: 156.3 MB
Listening Ports: 8000
```

### When Stopped
```
Status: ❌ STOPPED
Port 8000: Available
```

## Files Created

- `.backend.pid` - Process ID tracking
- `backend.log` - Server logs
- `.backend_config.json` - Configuration

## Troubleshooting

### Port Already in Use
```bash
./server start --force     # Automatic
# OR
./server kill-port --port 8000  # Manual
./server start
```

### Server Not Responding
```bash
./server stop
./server start --force
```

### View Errors
```bash
./server logs --follow
```

## Integration

### With start.sh
```bash
#!/bin/bash
./server start --force
cd frontend && npm run dev
```

### Check Before Action
```bash
if ./server status > /dev/null 2>&1; then
    echo "Running"
else
    ./server start
fi
```

## Advanced

### Change Default Port
```bash
./server config --port 8080
./server restart
```

### Production Mode
```bash
./server config --reload false
./server restart
```

### Monitor Continuously
```bash
watch -n 2 './server status'
```

## Full Documentation

See [SERVER_MANAGER.md](SERVER_MANAGER.md) for complete documentation.
