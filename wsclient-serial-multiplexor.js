//------------------------------------------------------
// ARGUMENT DEF
//------------------------------------------------------
var args = process.argv;
    args.slice(0,2);
var iServer = args.indexOf('--serveraddress');
var dServer = args[iServer + 1];
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
var moment = require('moment');
//------------------------------------------------------
// GLOBAL VAR
//------------------------------------------------------
var wsSendBuffer = [];
var wsHold = 0;
var serialSendBuffer = [];
var serialHold = 0 ;
var client = new net.Socket()
var wsInterval;
var serialInterval;
var intervalConnect = false;
//------------------------------------------------------
// WS CLIENT HANDLER
//------------------------------------------------------


const ws = new WebSocket(iServer);

ws.on('open', function open() {
    clearIntervalConnect();
});
ws.on('message', function (data){

    wsSendBuffer.push(data);
});
ws.on('end', function () {
    launchIntervalConnect()
});
ws.on('error', function () {
    launchIntervalConnect()
});

//------------------------------------------------------
// SERIAL POR HANDLER
//------------------------------------------------------
var sp = new serialport(dCom, { //use /dev/ttyS0 for linux
    baudrate: dBaud,
});
sp.on('open', () => {
    console.log('Serial Port Opened -->' + dBaud);
});
sp.on('data', serialdata => {
    serialSendBuffer.push(serialdata); //It's only job is to populate the buffer
});
sp.on('close', () => {
    console.log('Serial Port Closed.')
    clearInterval(serialInterval);
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
            var ts = moment().format('mm:ss:SS');
            // console.log(`TO SERIAL:${cmd} ${ts}`.cyan.bold)
            wsSendBuffer.shift();
            sp.write(cmd);
            wsHold = false;
        }
    }, 10); //checks every 100ms for new commands in the buffer
}

function startSerialBufferSendInterval() {
    console.log('SERIAL BUFFER ACTIVE'.yellow.bold)
    serialInterval = setInterval(function () {
        if (serialSendBuffer.length > 0 && serialHold == false) {
            serialHold = true;
            var cmd = serialSendBuffer[0];
            var ts = moment().format('mm:ss:SS');
            // console.log(`TO WS SERVER:${cmd} ${ts}`.yellow.bold)
            serialSendBuffer.shift();
            client.write(cmd);
            serialHold = false;
        }
    },10); //checks every 100ms for new commands in the buffer
}

function connect() {
    client.connect({
        port: dPort,
        host: dServer
    })
}

function launchIntervalConnect() {
    if (false != intervalConnect) return
    intervalConnect = setInterval(connect, 5000)
}

function clearIntervalConnect() {
    if (false == intervalConnect) return
    clearInterval(intervalConnect)
    intervalConnect = false
}
//------------------------------------------------------
// INIT
//------------------------------------------------------
connect()
startSerialBufferSendInterval();
startWsBufferSendInterval();
//------------------------------------------------------
// FINAL EXIT ERROR CATCH
//------------------------------------------------------
process.on('uncaughtException', function (err) {
    console.error(err);
    process.exit();
});