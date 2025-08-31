# aerospace-bar-server

aerospace-bar-server is a simple websocket server for building status bars for the Aerospace MacOS window manager. By hooking into the Aerospace callbacks it provides updated info about the Aerospace workspaces, and windows

## How to use

Build `aerospace-bar-server`

`bun build index.ts --compile --outfile ~/bin/bar-server`

Add a LaunchAgent for launchd 

`~/Library/LaunchAgents/com.blu.barserver.plist`

```
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.blu.barserver</string>

    <key>ProgramArguments</key>
    <array>
            <string>/Users/blu/bin/bar-server</string>
    </array>

    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>/tmp/startbs.out</string>
    <key>StandardErrorPath</key>
    <string>/tmp/startbs.err</string>
</dict>
</plist>
```

Load the launch agent

`launchctl load ~/Library/LaunchAgents/com.blu.barserver.plist`

Add the callbacks to `.aerospace.toml`

```
on-focus-changed = ['exec-and-forget curl http://localhost:3000/update-workspaces']
exec-on-workspace-change = ['/bin/bash', '-c', 'curl http://localhost:3000/update-workspaces' ]
```

Now your bar client can connect to the bar-server using websockets at `ws://localhost:3000/listen`

On connection your client should send a JSON payload to register as a client

`{ "type": "client", "name": "MY_STATUS_BAR" }`

## Daemons

Additional info sources can provide status info to the servers clients through use of daemons

When developing a daemon you should follow a simple websocket protocol

1. Connect to the server through websockets at `ws://localhost:3000/listen`.
2. Register itself as a daemon `{ "type": "daemon", "name": "MY_CUSTOM_DAEMON" }`
3. The daemon can send status info updates clients `{ "type": "MY_CUSTOM_EVENT_TYPE", "data": { \* Some event data*\}}`. Daemons will also receive messages when a new client connects.


