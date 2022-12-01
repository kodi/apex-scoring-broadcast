const mockStats = require("../mock/eastats3.json")
const statsService = require("../services/stats.service")
const config = require("../config/config.json")
config.statsUrl = process.argv[2] || config.statsUrl;
const { verifyOrganizerHeaders } = require("../middleware/auth");
const apexService = new require("../services/apex.service")(config);
const authService = require("../services/auth.service");
const broadcastService = require("../services/broadcast.service");
const cache = require("../services/cache.service");

module.exports = function router(app) {

    app.get("/mock", (req, res) => {
        res.json(mockStats)
    })

    app.post("/auth/organizer", async (req, res) => {
        const {
            key, username
        } = req.body;

        let organizer = await authService.getOrganizer(username, key);

        res.send({
            valid: organizer != undefined
        })
    })

    app.post("/display/:organizer/:eventId", verifyOrganizerHeaders, (req, res) => {
        broadcastService.setDisplaySettings(req.params.organizer, req.params.eventId, req.body);
        res.sendStatus(200);
    })

    app.get("/display/:organizer/:eventId", async (req, res) => {
        let result = await broadcastService.getDisplaySettings(req.params.organizer, req.params.eventId);
        res.send(result);
    })

    app.post("/stats", verifyOrganizerHeaders, async (req, res) => {
        const {
            eventId,
            game,
            statsCode,
            startTime,
            placementPoints, 
            killPoints,
            skipFetch,
        } = req.body;

        if (!skipFetch) {
            const allStats = await apexService.getStatsFromCode(statsCode, placementPoints, killPoints);
            let gameStat;
            if (startTime)
                gameStat = allStats.find(({ match_start }) => match_start == startTime);
            else
                gameStat = allStats[0]

            if (!gameStat)
                return res.sendStats(404);
                    
            await statsService.writeStats(req.organizer.id, eventId, game, gameStat);
            await cache.del(`stats:${req.organizer.username}-${eventId}-${game}`);
            await cache.del(`stats:${req.organizer.username}-${eventId}-overall`);

        }
        res.status(200).send();
    })

    app.get("/stats/code/:statsCode", verifyOrganizerHeaders, async (req, res) => {
        res.send(await apexService.getStatsFromCode(req.params.statsCode));
    })

    app.get("/count/:organizer/:eventId", async (req, res) => {
        const {
            organizer,
            eventId,
        } = req.params;
        let result = await statsService.getGameCount(organizer, eventId);
        res.send({count: result});
    })

    app.get("/stats/:organizer/:eventId/:game", async (req, res) => {
        const {
            organizer,
            eventId,
            game
        } = req.params;
        const cacheKey = `stats:${organizer}-${eventId}-${game}`;

        let cachedStats = await cache.get(cacheKey);

        if (cachedStats) {
            return res.send(cachedStats);
        } 

        let stats = await statsService.getStats(organizer, eventId, game);
        
        if (!stats || stats.length == 0) {
            return res.send({});
        }

        if (game == "overall") {
            stats = {
                total: stats.length,
                games: stats,
                teams: apexService.generateOverallStats(stats),
            }
        } else {
            stats = stats[0];
        }

        cache.put(cacheKey, stats, 300); //cache for 5m
        res.send(stats);
    })

}