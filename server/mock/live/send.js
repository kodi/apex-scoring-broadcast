const livedata = require("./livedata.json");
const Websocket = require("websocket").w3cwebsocket;
const ws = new Websocket("ws://localhost:3000/live/write/key1/test");
// const ws = new Websocket("ws://overstat.gg/live/write/debfb094e22744b491f8dea0678931e1/Double0");
// const ws = new Websocket("ws://dev.overstat.gg/live/write/Ds6WIE0j1hnKmRidM3k0J0t7e1MtBMMM/test");

function wait(time) {
    return new Promise((res) => {
        setTimeout(() => res(), time);
    })
}

ws.onopen = async function () {
    let start = livedata[0].timestamp;
    await wait(500);
    await Promise.all(livedata.map(async (line, count) => {
        await wait((line.timestamp - start) * 100);
        // await wait(count)

        ws.send(JSON.stringify(line));
    }));
    console.log("done");
}

ws.onerror = (msg) => console.log("Client DC", msg)

ws.onclose = (msg) => console.log("Closed", msg);
