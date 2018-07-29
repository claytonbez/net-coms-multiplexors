# net-coms-multiplexers

A collection of ready-to-go scripts that enables porting of data between, serial ports, tcp-sockets and web-sockets.

## API Docs
### tcp server / serialport

----------

- Receives data from multiple tcp client connections and send it over a serial port.
- Ports data from a serialport to multiple tcp client connections.

##### Usage

    node tcpserver-serialport.js --serverport <port-number> --comport <serialport-name> --baud <baudrate>

> Data gets sent character by character over both mediums without any delimiters being added.

### tcp client / serialport

----------

- Receives data from a tcp server connection and send it over a serial port.
- Ports data from a serialport to a tcp server.
- Handles automatic reconnect to server and serial port.

##### Usage

    node tcpclient-serialport.js --serverport <port-number> --serveraddress <ip-address> --comport <serialport-name> --baud <baudrate>

> Data gets sent character by character over both mediums without any delimiters being added.

### websocket server / serialport

----------

- Receives data from multiple tcp client connections and send it over a serial port.
- Ports data from a serialport to multiple tcp client connections.

##### Usage

    node tcpserver-serialport.js --serverport <port-number> --comport <serialport-name> --baud <baudrate>

> Data gets sent using the 'message' emitter in string format

### websocket client / serialport

----------

- Receives data from a websocket server connection and send it over a serial port.
- Ports data from a serialport to a tcp server.
- Handles automatic reconnect to server and serial port.

##### Usage

    node tcpclient-serialport.js --serverport <port-number> --serveraddress <ip-address> --comport <serialport-name> --baud <baudrate>

> Data gets sent using the 'message' emitter in string format
