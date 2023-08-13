import * as net from 'net';
import * as crypto from 'crypto'
import {Buffer} from 'buffer';

// TCP connection options
type ZomboidConnectorOptions = {
    host: string,
    port: number,
    password: string
}

// all supported Zomboid console commands
export enum ZomboidCommands {
    ADD_ITEM = "additem",
    ADD_USER = "adduser",
    ADD_USER_TO_WHITELIST = "addusertowhitelist",
    REMOVE_USER_FROM_WHITELIST = "removeuserfromwhitelist",
    BAN_ID = "banid",
    UNBAN_ID = "unbanid",
    BAN_USER = "banuser",
    UNBAN_USER = "unbanuser",
    GRANT_ADMIN = "grantadmin",
    REMOVE_ADMIN = "removeadmin",
    KICK_USER = "kickuser",
    SERVER_MSG = "servermsg",
    SET_ACCESS_LEVEL = "setaccesslevel",
    VOICE_BAN = "voiceban"
}

// the actual RCON client for Zomboid
export class ZomboidRconClient {
    connected: boolean;
    id: number;
    options: ZomboidConnectorOptions;
    active_socket: net.Socket;

    constructor(options: ZomboidConnectorOptions) {
        this.options = options;
        this.connected = false;
        this.active_socket = new net.Socket;
        this.id = 0;
    }

    // connect to the Project Zomboid RCON server
    connect() {
        return new Promise((resolve,reject) => {
            // create a random ID
            this.id = crypto.randomInt(100000)

            // create a TCP socket
            this.active_socket = net.createConnection(this.options.port, this.options.host)

            // error has occurred while trying to connect, raise to user
            this.active_socket.once('error', (e) => reject(e))

            // connection has been established, time to party
            this.active_socket.once('connect', () => {
                // set connected to true
                this.connected = true;

                // attempt to authenticate
                this.sendRawData(this.options.password, 3)

                // once we receive data back from the socket that equates to this.id, the connection is opened
                // if so we set connected to True and resolve, but otherwise error out
                this.active_socket.once('data', (data) => {
                    if (this.id === data.readInt32LE(4)) {
                        this.connected = true
                        resolve(null)
                    } else {
                        reject(new Error("Failed to auth with Zomboid RCON"))
                    }
                })
            })
        })
    }

    // disconnect the active TCP socket
    disconnect() {
        this.connected = false;
        this.active_socket.end()
    }

    // send a specific command from ZomboidCommands enum
    send(command: ZomboidCommands, cmargs: string) {
        return new Promise((resolve,reject) => {
            if (!this.connected) {
                reject(new Error("Connection to Zomboid RCON server not established"))
            }
    
            // create command
            let cmd_string = command + " " + cmargs
    
            // send over TCP socket
            this.sendRawData(cmd_string, 2).then(p => resolve(p))
        })
    }

    // send raw buffer via TCP socket
    sendRawData(data: string, request: number) {
        return new Promise<string>((resolve, reject) => {
            // throw an error if the connection hasn't been established
            if (!this.connected) {
                reject(new Error("Connection to Zomboid RCON server not established"))
            }

            // allocate new buffer
            let len = Buffer.byteLength(data);
            let buffer = Buffer.alloc(len + 14);

            // write data to buffer
            buffer.writeInt32LE(len + 10, 0);
            buffer.writeInt32LE(this.id, 4);
            buffer.writeInt32LE(request, 8);
            buffer.write(data, 12, 'ascii');
            buffer.writeInt16LE(0, 12 + len);

            // write buffer to socket
            this.active_socket.write(buffer);

            // resolve promise w/ response
            this.active_socket.once('data', (data: Buffer) => {
                resolve(data.toString('ascii', 12));
            });
        });
    }
}