# project-zomboid-rcon
Connect and interact with your Project Zomboid server using RCON capabilities

## What you need
- A Project Zomboid server w/ `RCONPassword` and `RCONPort` set
- NodeJS

..and that's it!

## Usage
```javascript
import {ZomboidCommands, ZomboidRconClient} from 'project-zomboid-rcon'
```

## Example
```javascript
import {ZomboidCommands, ZomboidRconClient} from 'project-zomboid-rcon'

// Initialize the client
const zomboid = new Zomboid({
    host: "1.2.3.4", // the IP address to your server
    port: 1234, // RCONPort in the server ini
    password: "bestpasswordevermade" // RCONPassword in the server ini
})

// Connect to the server (this will throw if connection was unsuccessful)
zomboid.connect()

// All valid commands are provided in the zomboid.ZomboidCommands enum
// Run commands using the .send() function on the zomboid class
zomboid.send(ZomboidCommands.GRANT_ADMIN, "Alex") // granting admin to Alex

// More than 1 argument? Supply in the same string!
zomboid.send(ZomboidCommands.ADD_ITEM, "Alex Base.Tshirt_CamoUrban")

// Disconnect using the .disconnect() function
zomboid.disconnect()
```