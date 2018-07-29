//------------------------------------------------------
// ARGUMENT DEF
//------------------------------------------------------
var args = process.argv;
args.slice(0,2);
var iPort = args.indexOf('--serverport');
var dPort = args[iPort + 1];
var iCom = args.indexOf('--comport');
var dCom = args[iCom + 1];
var iBaud = args.indexOf('--baud');
var dBaud = parseInt(args[iBaud + 1]);
//------------------------------------------------------
// MODULE REQUIRES
//------------------------------------------------------
var colors = require('colors')
var WebSocket = require('ws');
var serialport = require('serialport');
//------------------------------------------------------
// GLOBAL VAR
//------------------------------------------------------
var wsSendBuffer = [];
var wsHold = 0;
var serialSendBuffer = [];
var serialHold = 0 ;
var wsInterval;
var serialInterval;
//------------------------------------------------------
// WEBSOCKET SERVER HANDLER
//------------------------------------------------------
var wss = new WebSocket.Server({ port: iPort });
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(data) {
        wsSendBuffer.push(data);
    });
});
wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};
console.log(`WebSocket host on port ${dPort} and port to/from ${dCom} at baud:${dBaud}`);

//------------------------------------------------------
// SERIAL PORT HANDLER
//------------------------------------------------------
var sp = new serialport(dCom, { //use /dev/ttyS0 for linux
    baudrate: dBaud
});
sp.on('open', () => {
    console.log('Serial Port Opened -->' + dBaud);
});
sp.on('data', serialdata => {
    serialSendBuffer.push(serialdata); //It's only job is to populate the buffer
});
sp.on('close', () => {
    clearInterval(serialInterval);
    throw new Error('Serial port closed');
});
//------------------------------------------------------
// GLOBAL FUNCTIONS
//------------------------------------------------------
function startWsBufferSendInterval() {
    console.log('WS BUFFER ACTIVE'.cyan.bold)
    wsInterval = setInterval(function () {
        if (wsSendBuffer.length > 0 && wsHold == false) {
            wsHold = true;
            var cmd = wsSendBuffer[0];
            wsSendBuffer.shift();
            sp.write(cmd);
            wsHold = false;
        }
    }, 10); //checks every 10ms for new commands in the buffer
}
function startSerialBufferSendInterval() {
    serialInterval = setInterval(function () {
        if (serialSendBuffer.length > 0 && serialHold == false) {
            serialHold = true;
            var cmd = serialSendBuffer[0];
            serialSendBuffer.shift();
            wss.broadcast('message',cmd);
            serialHold = false;
        }
    },10); //checks every 10ms for new commands in the buffer
}
//------------------------------------------------------
// INIT
//------------------------------------------------------
startSerialBufferSendInterval();
startWsBufferSendInterval();
//------------------------------------------------------
// FINAL EXIT ERROR CATCH
//------------------------------------------------------
process.on('uncaughtException',function(err){
    console.error(err);
    process.exit();
});