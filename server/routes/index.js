const router = require("./router");
const match = require("./match.router");
const broadcast = require("./broadcast.router");
const drops = require("./drops.router");

module.exports = function setupRouter(app) {
    router(app);
    match(app);
    broadcast(app);
    drops(app);
}