/*
  This program simulates a musician in an orchestra, which publishes the produced sounds
  on a multicast group. Other programs can join the group and receive the sounds. The
  sounds are transported in json payloads with the following format:
    {"sound":"boum-boum"}
  Usage: to start a musician, type the following command in a terminal
    node musician.js instrument
*/

var protocol = require('./protocol');
var dgram = require('dgram');
var udp_socket = dgram.createSocket('udp4');
var moment = require('moment');
var net = require('net');

var server = net.createServer();
server.on('connection', callbackFunctionToCallWhenNewClientHasArrived);
server.listen(2205, "0.0.0.0");
function callbackFunctionToCallWhenNewClientHasArrived(socket) {
    var musicians = new Array();

    mapMusician.forEach(function (value, key) {
        var activeMusician = {
            uuid: key,
            instrument:value["instrument"],
            activeSince: value["activeSince"]
        };
        musicians.push(activeMusician);

    });
    var payload = JSON.stringify(musicians);
    socket.write(payload + '\n');
    socket.end();
}


//tous les musiciens qui sont en train de jouer, donc au moins un bruit reçu
//si on reçoit durant une seconde, on l'enlève
var mapMusician = new Map();

function Activity(instrument, activeSince) {
    this.instrument = instrument;
    this.activeSince = activeSince;
}

function getInstrumentFromSound(sound) {
    for(var key in protocol.PROTOCOL_SOUNDS) {
        if(protocol.PROTOCOL_SOUNDS[key] === sound) {
            var k = key;
            return k;
        }
    }
}

function getTime() {
    return moment().format();
}

function updateTime(uuid) {
    if(mapMusician.has(uuid)) {
        mapMusician.get(uuid)["activeSince"] = moment().format();
    }
}


udp_socket.bind(protocol.PROTOCOL_PORT, function() {
    console.log("Joining multicast group : " + protocol.PROTOCOL_MULTICAST_ADDRESS + ":" + protocol.PROTOCOL_PORT);
    udp_socket.addMembership(protocol.PROTOCOL_MULTICAST_ADDRESS);
});

udp_socket.on('message', function(msg, source) {
    var rcv = JSON.parse(msg);
    var uuid = rcv["uuid"];
    var instrument = rcv["instrument"];


    if(mapMusician.has(uuid)) {
        updateTime(uuid);
    } else {
        var activity = new Activity(instrument, getTime());
        mapMusician.set(uuid, activity);
    }

});

function check() {
    mapMusician.forEach(function (value, key) {
        var now = moment().format();
        var then = value["activeSince"];
        var comparaison = moment(now).diff(moment(then), 'second');
        if(comparaison > 5) {
            mapMusician.delete(key);
        }

    });

}

//chaque seconde, élimine les musiciens qui n'ont pas joué depuis 5 secondes
setInterval(check, 1000);