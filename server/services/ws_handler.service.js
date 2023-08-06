
const { redis, pubsub } = require("../connectors/redis");
const authService = require("./auth.service");
const liveService = require("./live.service");
const statsService = require("./stats.service");
const _ = require("lodash");

let liveData = {};
let rawFeed = {};

let clients = {};

function getLiveData(orgUser, client) {
    return liveData[orgUser]?.[client];
}

async function setLiveData(orgUser, client, data) {
    if (!data && liveData[orgUser]?.[client]) {

        delete liveData[orgUser][client];
        delete rawFeed[orgUser][client];
    } else {
        if (!liveData[orgUser]) {
            liveData[orgUser] = {}
        }
        liveData[orgUser][client] = data;
    }
}

function diffLine(left, right, line) {
    let feed = right.feed.splice(left.feed.length, right.feed.length);
    let players = Object.keys(line).map(key => line[key].nucleusHash).filter(val => !!val && right.players[val]).map(player => right.players[player]);
    let observers = Object.keys(line).map(key => line[key].nucleusHash).filter(val => !!val && right.observers[val]).map(player => right.observers[player]);
    let keyDiff = {};

    Object.keys(right).filter(key => !left[key] || (!(right[key] instanceof Object) && right[key] == left[key])).forEach(k => keyDiff[k] = right[k]);
    // console.log(keyDiff)
    return { ...keyDiff, feed, players, observers };
}

async function processUpdate(organizer, client, gameId, line) {
    let channel = "ld-" + organizer.username + "-" + client;
    let orgUser = organizer.username;

    if (!rawFeed[orgUser]) {
        rawFeed[orgUser] = {}
    }

    (rawFeed[orgUser][client] = rawFeed[orgUser][client] ?? []).push(line);

    if (line?.state == "Postmatch" && rawFeed[orgUser][client].find(feed => feed.state == "WaitingForPlayers")) {
        let data = rawFeed[orgUser][client];
        statsService.writeLiveData(null, data, organizer.id, client);
    }

    let current = getLiveData(orgUser, client);
    let copy;
    // performance, dont clone the feed array or we end up with server performance issues
    if (current) {
        let feed = current.feed;
        current.feed = [];
        copy = { ..._.cloneDeep(current), ...feed };
    }
    let newData = liveService.processDataLine(line, current);
    setLiveData(orgUser, client, newData);

    if (!current) {
        // if we dont have a current, publish full
        redis.publish(channel, JSON.stringify({ type: "ldfull", body: newData }));
    } else {
        // else publish the diff
        let diff = diffLine(copy, newData, line);
        // console.log(diff);

        if (diff) {
            redis.publish(channel, JSON.stringify({ type: "lddiff", body: diff }));
        }
    }
}

function getClients(orgName) {
    return clients[orgName];
}

async function connectWrite(ws, api_key, client) {
    let org = await authService.getOrganizerByKey(api_key);
    let gameId;

    if (!org) {
        return;
    }

    addClient(org.username, client, true);

    ws.on("message", async msg => {
        let parsed = JSON.parse(msg);

        if (parsed.category == "init") {
            await setLiveData(org.username, client, undefined);
            gameId = parsed.timestamp;
            console.log("Setting gameId to", gameId, org.username, client);
        }

        if (parsed.state) {
            clients[org.username][client].state = parsed.state;
        }

        if (gameId) {
            await processUpdate(org, client, gameId, parsed, msg);
        } else {
            console.log("Game not starting from init, cannot process");
        }
    })

    ws.on("close", () => clients[org.username][client].connected = false);
}

async function connectRead(ws, orgUser, client) {
    console.log("Connected read for ", orgUser, client);
    const channel = "ld-" + orgUser + "-" + client;
    pubsub.subscribe(channel);

    let sendFull = async () => {
        console.log("sending full for ", orgUser, client);
        ws.send(JSON.stringify({ type: "ldfull", body: getLiveData(orgUser, client) }));
    };

    pubsub.on("message", (incomingChannel, msg) => {
        if (incomingChannel == channel) {
            ws.send(msg);
        }
    })

    ws.on("message", async msg => {
        msg = JSON.parse(msg);
        if (msg.type == "ldrqfull") {
            await sendFull();
        }
    });

    ws.on("close", () => console.log("Closed", orgUser, client));
}

function addClient(organizerName, client, connected = false) {
    console.log("Adding write client ", organizerName, client, connected)
    clients[organizerName] = (clients[organizerName] ?? {})
    clients[organizerName][client] = { connected, state: "preinit" };
}

module.exports = {
    connectWrite,
    connectRead,
    getClients,
    addClient,
    clients,
}