#!/usr/bin/env python3
"""
DataForge Reader Backend Server Manager
A systemd-like service manager for the FastAPI backend server.

Usage:
    python backend/server_manager.py start   - Start the backend server
    python backend/server_manager.py stop    - Stop the backend server
    python backend/server_manager.py restart - Restart the backend server
    python backend/server_manager.py status  - Check server status
"""

import os
import sys
import signal
import time
import subprocess
import psutil
import json
from pathlib import Path
from typing import Optional, Dict, Any
import argparse


class ServerManager:
    """Manages the DataForge Reader backend server with systemd-like commands."""
    
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.backend_dir = self.project_root / "backend"
        self.pid_file = self.project_root / ".backend.pid"
        self.log_file = self.project_root / "backend.log"
        self.config_file = self.project_root / ".backend_config.json"
        
        # Default configuration
        self.default_config = {
            "host": "127.0.0.1",
            "port": 8000,
            "workers": 1,
            "reload": True,
            "log_level": "info"
        }
        self.config = self.load_config()
    
    def load_config(self) -> Dict[str, Any]:
        """Load configuration from file or use defaults."""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    return {**self.default_config, **json.load(f)}
            except Exception as e:
                print(f"⚠️  Warning: Failed to load config: {e}")
        return self.default_config
    
    def save_config(self):
        """Save current configuration to file."""
        try:
            with open(self.config_file, 'w') as f:
                json.dump(self.config, f, indent=2)
        except Exception as e:
            print(f"⚠️  Warning: Failed to save config: {e}")
    
    def get_pid(self) -> Optional[int]:
        """Read PID from file if it exists."""
        if not self.pid_file.exists():
            return None
        
        try:
            with open(self.pid_file, 'r') as f:
                pid = int(f.read().strip())
                # Verify process still exists
                if psutil.pid_exists(pid):
                    try:
                        proc = psutil.Process(pid)
                        # Check if it's actually our uvicorn process
                        cmdline = ' '.join(proc.cmdline())
                        if 'uvicorn' in cmdline and 'backend.main:app' in cmdline:
                            return pid
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass
                
                # PID file exists but process doesn't, clean it up
                self.pid_file.unlink()
                return None
        except (ValueError, FileNotFoundError):
            return None
    
    def save_pid(self, pid: int):
        """Save PID to file."""
        with open(self.pid_file, 'w') as f:
            f.write(str(pid))
    
    def remove_pid_file(self):
        """Remove PID file."""
        if self.pid_file.exists():
            self.pid_file.unlink()
    
    def kill_process_on_port(self, port: int) -> bool:
        """Kill any process using the specified port."""
        killed = False
        print(f"🔍 Checking for processes on port {port}...")
        
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                # Use net_connections() instead of deprecated connections()
                for conn in proc.net_connections():
                    if conn.laddr.port == port and conn.status == 'LISTEN':
                        print(f"⚠️  Found process {proc.pid} ({proc.name()}) using port {port}")
                        print(f"🔫 Killing process {proc.pid}...")
                        proc.kill()
                        proc.wait(timeout=5)
                        killed = True
                        print(f"✅ Process {proc.pid} killed successfully")
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.TimeoutExpired):
                continue
            except Exception as e:
                print(f"⚠️  Error checking process: {e}")
                continue
        
        if killed:
            # Wait a bit for the port to be released
            time.sleep(1)
            return True
        
        return False
    
    def is_port_in_use(self, port: int) -> bool:
        """Check if a port is currently in use."""
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                # Use net_connections() instead of deprecated connections()
                for conn in proc.net_connections():
                    if conn.laddr.port == port and conn.status == 'LISTEN':
                        return True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        return False
    
    def check_dependencies(self) -> bool:
        """Check if required dependencies are installed."""
        requirements_file = self.backend_dir / "requirements.txt"
        
        if not requirements_file.exists():
            print("⚠️  Warning: requirements.txt not found")
            return True
        
        try:
            import uvicorn
            import fastapi
            return True
        except ImportError as e:
            print(f"❌ Missing dependencies: {e}")
            print(f"💡 Run: pip install -r {requirements_file}")
            return False
    
    def start(self, force: bool = False) -> bool:
        """Start the backend server."""
        print("🚀 Starting DataForge Reader Backend Server...")
        
        # Check if already running
        pid = self.get_pid()
        if pid:
            print(f"⚠️  Server is already running (PID: {pid})")
            print("💡 Use 'restart' to restart the server or 'stop' to stop it first")
            return False
        
        # Check and kill any process on the port
        port = self.config['port']
        if self.is_port_in_use(port):
            if force:
                print(f"⚠️  Port {port} is in use, attempting to free it...")
                self.kill_process_on_port(port)
            else:
                print(f"❌ Port {port} is already in use!")
                print("💡 Use 'start --force' to automatically kill the process using the port")
                print(f"💡 Or manually run: python backend/server_manager.py kill-port {port}")
                return False
        
        # Check dependencies
        if not self.check_dependencies():
            return False
        
        # Start the server
        print(f"📦 Starting server on {self.config['host']}:{self.config['port']}...")
        
        # Prepare command
        cmd = [
            sys.executable, "-m", "uvicorn",
            "backend.main:app",
            "--host", self.config['host'],
            "--port", str(self.config['port']),
            "--log-level", self.config['log_level'],
        ]
        
        if self.config['reload']:
            cmd.append("--reload")
        
        if self.config['workers'] > 1:
            cmd.extend(["--workers", str(self.config['workers'])])
        
        # Start process
        try:
            # Open log file
            log_file = open(self.log_file, 'a')
            log_file.write(f"\n{'='*60}\n")
            log_file.write(f"Server started at {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            log_file.write(f"{'='*60}\n\n")
            
            process = subprocess.Popen(
                cmd,
                cwd=self.project_root,
                stdout=log_file,
                stderr=subprocess.STDOUT,
                start_new_session=True
            )
            
            # Save PID
            self.save_pid(process.pid)
            
            # Wait a moment and check if process started successfully
            time.sleep(2)
            
            if process.poll() is not None:
                print(f"❌ Server failed to start! Check {self.log_file} for details")
                self.remove_pid_file()
                return False
            
            print(f"✅ Server started successfully (PID: {process.pid})")
            print(f"🌐 API URL: http://{self.config['host']}:{self.config['port']}")
            print(f"📚 API Docs: http://{self.config['host']}:{self.config['port']}/docs")
            print(f"📝 Logs: {self.log_file}")
            
            return True
            
        except Exception as e:
            print(f"❌ Failed to start server: {e}")
            self.remove_pid_file()
            return False
    
    def stop(self, timeout: int = 10) -> bool:
        """Stop the backend server."""
        print("🛑 Stopping DataForge Reader Backend Server...")
        
        pid = self.get_pid()
        if not pid:
            print("⚠️  Server is not running")
            return False
        
        try:
            proc = psutil.Process(pid)
            
            # Try graceful shutdown first
            print(f"📤 Sending SIGTERM to process {pid}...")
            proc.terminate()
            
            # Wait for process to terminate
            try:
                proc.wait(timeout=timeout)
                print(f"✅ Server stopped successfully (PID: {pid})")
            except psutil.TimeoutExpired:
                print(f"⚠️  Process didn't terminate gracefully, forcing shutdown...")
                proc.kill()
                proc.wait(timeout=5)
                print(f"✅ Server forcefully stopped (PID: {pid})")
            
            self.remove_pid_file()
            return True
            
        except psutil.NoSuchProcess:
            print(f"⚠️  Process {pid} not found, cleaning up PID file...")
            self.remove_pid_file()
            return True
        except Exception as e:
            print(f"❌ Failed to stop server: {e}")
            return False
    
    def restart(self, force: bool = False) -> bool:
        """Restart the backend server."""
        print("🔄 Restarting DataForge Reader Backend Server...")
        
        # Stop if running
        pid = self.get_pid()
        if pid:
            if not self.stop():
                print("❌ Failed to stop server, aborting restart")
                return False
            time.sleep(1)
        
        # Start
        return self.start(force=force)
    
    def status(self) -> bool:
        """Check and display server status."""
        print("📊 DataForge Reader Backend Server Status")
        print("=" * 60)
        
        pid = self.get_pid()
        
        if not pid:
            print("Status: ❌ STOPPED")
            print(f"Port {self.config['port']}: Available")
            return False
        
        try:
            proc = psutil.Process(pid)
            
            # Get process info
            create_time = time.strftime('%Y-%m-%d %H:%M:%S', 
                                       time.localtime(proc.create_time()))
            cpu_percent = proc.cpu_percent(interval=0.1)
            memory_mb = proc.memory_info().rss / 1024 / 1024
            
            # Get listening ports
            listening_ports = []
            for conn in proc.net_connections():
                if conn.status == 'LISTEN':
                    listening_ports.append(conn.laddr.port)
            
            print("Status: ✅ RUNNING")
            print(f"PID: {pid}")
            print(f"Started: {create_time}")
            print(f"CPU Usage: {cpu_percent:.1f}%")
            print(f"Memory Usage: {memory_mb:.1f} MB")
            print(f"Listening Ports: {', '.join(map(str, set(listening_ports)))}")
            print(f"API URL: http://{self.config['host']}:{self.config['port']}")
            print(f"API Docs: http://{self.config['host']}:{self.config['port']}/docs")
            print(f"Log File: {self.log_file}")
            
            return True
            
        except (psutil.NoSuchProcess, psutil.AccessDenied) as e:
            print(f"Status: ⚠️  ERROR - Process exists but cannot access: {e}")
            return False
    
    def logs(self, lines: int = 50, follow: bool = False):
        """Display server logs."""
        if not self.log_file.exists():
            print("📝 No log file found")
            return
        
        if follow:
            print(f"📝 Following logs from {self.log_file} (Ctrl+C to stop)...")
            print("=" * 60)
            try:
                # Use tail -f to follow logs
                subprocess.run(["tail", "-f", str(self.log_file)])
            except KeyboardInterrupt:
                print("\n👋 Stopped following logs")
        else:
            print(f"📝 Last {lines} lines from {self.log_file}:")
            print("=" * 60)
            try:
                with open(self.log_file, 'r') as f:
                    all_lines = f.readlines()
                    for line in all_lines[-lines:]:
                        print(line, end='')
            except Exception as e:
                print(f"❌ Failed to read logs: {e}")
    
    def configure(self, **kwargs):
        """Update server configuration."""
        updated = False
        for key, value in kwargs.items():
            if value is not None and key in self.config:
                self.config[key] = value
                updated = True
                print(f"✅ Updated {key} = {value}")
        
        if updated:
            self.save_config()
            print("💾 Configuration saved")
            print("💡 Restart the server for changes to take effect")


def main():
    """Main entry point for the server manager CLI."""
    parser = argparse.ArgumentParser(
        description="DataForge Reader Backend Server Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python backend/server_manager.py start           # Start the server
  python backend/server_manager.py start --force   # Start and kill any process on the port
  python backend/server_manager.py stop            # Stop the server
  python backend/server_manager.py restart         # Restart the server
  python backend/server_manager.py status          # Check status
  python backend/server_manager.py logs            # Show recent logs
  python backend/server_manager.py logs --follow   # Follow logs in real-time
  python backend/server_manager.py kill-port 8000  # Kill process on port 8000
        """
    )
    
    parser.add_argument(
        'command',
        choices=['start', 'stop', 'restart', 'status', 'logs', 'kill-port', 'config'],
        help='Command to execute'
    )
    
    parser.add_argument(
        '--force',
        action='store_true',
        help='Force operation (kill processes on port when starting)'
    )
    
    parser.add_argument(
        '--lines',
        type=int,
        default=50,
        help='Number of log lines to display (default: 50)'
    )
    
    parser.add_argument(
        '--follow',
        action='store_true',
        help='Follow logs in real-time'
    )
    
    parser.add_argument(
        '--port',
        type=int,
        help='Port number (for kill-port or config)'
    )
    
    parser.add_argument(
        '--host',
        help='Host address (for config)'
    )
    
    parser.add_argument(
        '--reload',
        type=lambda x: x.lower() in ['true', '1', 'yes'],
        help='Enable auto-reload (for config)'
    )
    
    args = parser.parse_args()
    
    manager = ServerManager()
    
    # Execute command
    if args.command == 'start':
        success = manager.start(force=args.force)
        sys.exit(0 if success else 1)
    
    elif args.command == 'stop':
        success = manager.stop()
        sys.exit(0 if success else 1)
    
    elif args.command == 'restart':
        success = manager.restart(force=args.force)
        sys.exit(0 if success else 1)
    
    elif args.command == 'status':
        success = manager.status()
        sys.exit(0 if success else 1)
    
    elif args.command == 'logs':
        manager.logs(lines=args.lines, follow=args.follow)
        sys.exit(0)
    
    elif args.command == 'kill-port':
        if args.port is None:
            print("❌ Error: --port is required for kill-port command")
            sys.exit(1)
        
        killed = manager.kill_process_on_port(args.port)
        if killed:
            print(f"✅ Port {args.port} is now free")
            sys.exit(0)
        else:
            print(f"ℹ️  No process found on port {args.port}")
            sys.exit(0)
    
    elif args.command == 'config':
        if args.port or args.host or args.reload is not None:
            manager.configure(
                port=args.port,
                host=args.host,
                reload=args.reload
            )
        else:
            print("📋 Current configuration:")
            print("=" * 60)
            for key, value in manager.config.items():
                print(f"{key}: {value}")
        sys.exit(0)


if __name__ == "__main__":
    main()
