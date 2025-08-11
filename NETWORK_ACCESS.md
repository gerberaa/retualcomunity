# 🌐 Network Access Guide

## Running for Local Network

### 🚀 Quick Start
1. **Start the server:**
   - Double-click on `start-server.bat`
   - Or in terminal: `node server.js`

2. **Find IP address:**
   - Server will automatically show local IP address
   - Example: `http://192.168.1.100:3000`

### 📱 Connecting Devices

#### Computers on network:
- Open browser
- Enter IP address from server console
- Example: `http://192.168.1.100:3000`

#### Mobile devices:
- Make sure device is connected to the same Wi-Fi network
- Open browser on phone/tablet
- Enter the same IP address
- Website will work fully on mobile devices

#### Admin panel:
- `http://[IP_ADDRESS]:3000/admin.html`
- Login: `401483`
- Password: `401483`

### 🛡️ Security Settings

#### Windows Firewall:
1. First run may ask for Node.js permission
2. Choose "Allow access" for private networks
3. If problems - add exception for port 3000

#### Router:
- Server works only on local network
- Doesn't require router configuration
- Available only to devices on the same network

### 🔍 Manual IP Address Discovery

#### Windows:
```cmd
ipconfig
```
Look for "IPv4 Address" for your network adapter

#### Linux/Mac:
```bash
ifconfig
```
or
```bash
ip addr show
```

### 🐛 Troubleshooting

#### Can't connect:
1. **Check Firewall** - make sure port 3000 is open
2. **Same network** - all devices must be on the same Wi-Fi network
3. **Correct IP** - use the IP shown by the server
4. **Antivirus** - may block connection

#### Slow performance:
1. **Wi-Fi signal** - check signal quality
2. **Network load** - other devices may slow down
3. **Browser cache** - clear browser cache

### 📊 Monitoring

#### Console logs:
- Server shows all connections
- Requests from different devices visible in console
- Errors displayed in real time

#### Work views:
- Each device counted separately
- Anti-spam system works locally
- Views from different devices are summed

### 🎯 Demo Tips

1. **Main computer** - run the server
2. **Guest phones** - give them IP address
3. **Tablets** - perfect for gallery viewing
4. **Admin access** - only from main computer

### 🔄 Stopping Server
- `Ctrl + C` in terminal
- Or close the bat file window
- All connections automatically disconnect

---

**Now your site is accessible to the entire local network! 🎉**