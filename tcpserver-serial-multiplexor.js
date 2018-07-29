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
var net = require('net');
var serialport = require('serialport');
//------------------------------------------------------
// GLOBAL VAR
//------------------------------------------------------
var tcpSendBuffer = [];
var tcpHold = 0;
var serialSendBuffer = [];
var serialHold = 0 ;
var sockets = [];
var tcpInterval;
var serialInterval;
//------------------------------------------------------
// TCP SERVER HANDLER
//------------------------------------------------------
var server = net.createServer(function (socket) {
    sockets.push(socket);
    socket.on('data',function(buffer){
        var data = buffer.toString();
        tcpSendBuffer.push(data);
    });
    socket.on('disconnect',function(){
        var index = sockets.indexOf(socket);
        sockets.splice(index,1);
    });
});

server.listen(dPort, '',function(){
    console.log(`Server host on port ${dPort} and port to/from ${dCom} at baud:${dBaud}`);
});
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
function socketsWrite(str){
    for(var i = 0 ; i < sockets.length;i++){
        sockets[i].write(str);
    }
}

function startTcpBufferSendInterval() {
    console.log('TCP BUFFER ACTIVE'.cyan.bold)
    tcpInterval = setInterval(function () {
        if (tcpSendBuffer.length > 0 && tcpHold == false) {
            tcpHold = true;
            var cmd = tcpSendBuffer[0];
            tcpSendBuffer.shift();
            sp.write(cmd);
            tcpHold = false;
        }
    }, 10); //checks every 10ms for new commands in the buffer
}
function startSerialBufferSendInterval() {
    serialInterval = setInterval(function () {
        if (serialSendBuffer.length > 0 && serialHold == false) {
            serialHold = true;
            var cmd = serialSendBuffer[0];
            serialSendBuffer.shift();
            socketsWrite(cmd);
            serialHold = false;
        }
    },10); //checks every 10ms for new commands in the buffer
}
//------------------------------------------------------
// INIT
//------------------------------------------------------
startSerialBufferSendInterval();
startTcpBufferSendInterval();
//------------------------------------------------------
// FINAL EXIT ERROR CATCH
//------------------------------------------------------
process.on('uncaughtException',function(err){
    console.error(err);
    process.exit();
});