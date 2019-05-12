var protocol = require('./Protocol');

var dgram = require('dgram');

var uuid = require('uuid');

var moment = require('moment');

var socket = dgram.createSocket('udp4');

// tableau des sons
const SOUNDS = {
    piano: "ti-ta-ti",
    trumpet: "pouet",
    flute: "trulu",
    violin: "gzi-gzi",
    drum: "boum-boum"
};

var instrument = process.argv[2];

// Si l'instrument n'est pas definie
if(instrument === undefined){
    console.log("Error : instrument undefined.\nplease choose between : \n -> piano\n -> trumpet\n -> flute\n -> violin\n -> drum");
    process.exit(1);
}

console.log("Messages will be sent to : " + protocol.MULTICAST_ADDRESS + ":" + protocol.PORT);
// Envoie le son toutes les secondes
setInterval(sendMessage, 1000);

var json = {
    uuid: uuid(),
    instrument: process.argv[2]
};

// envoie le message en "broadcast"
function sendMessage() {
    json.activeSince = moment();

    var message = JSON.stringify(json);

    console.log(SOUNDS[json.instrument] + ' message : ' + message);

    socket.send(message, 0, message.length, protocol.PORT, protocol.MULTICAST_ADDRESS, function (err, bytes) {
        if (err) throw err;
    });
}