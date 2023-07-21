
const statsService = require("../services/stats.service")
const config = require("../config/config.json")
config.statsUrl = process.argv[2] || config.statsUrl;
const { verifyOrganizerHeaders, verifyAdminHeaders } = require("../middleware/auth");
const apexService = new require("../services/apex.service")(config);
const authService = require("../services/auth.service");
const matchService = require("../services/match.service");
const dropService = require("../services/drops.service");
const broadcastService = require("../services/broadcast.service");
const cache = require("../services/cache.service");
const shortLinkService = require("../services/short_link.service.js");
const wsHandlerService = require("../services/ws_handler.service.js");
const liveService = require("../services/live.service");
const { statsToCsv } = require("../utils/utils");
const playerService = require("../services/player.service");
const { redis } = require("../connectors/redis");

const SHORT_LINK_PREFIX = "_";
module.exports = function router(app) {

    async function deleteCache(matchId, game) {
        await cache.del(`stats:${matchId}-${game}`);
        await cache.del(`stats:${matchId}-overall`);
        await cache.del(`stats:${matchId}-stacked`);
        await cache.del(`stats:${matchId}-summary`);
        await cache.del(`stats:${matchId}-${game}-livedata-parsed`);
    }

    async function checkAutoPoll(matchId) {
        let cacheKey = `match_polling_skip_${matchId}`;
        let now = Date.now();

        let lastPoll = await redis.set(cacheKey, now, "EX", 90, "NX");

        if (lastPoll === "OK") {
            
            console.log("Checking for new games on ", matchId)

            const pollingSettings = await matchService.getMatchPolling(matchId);
            console.log(matchId, pollingSettings, now);

            if (pollingSettings?.pollStart && pollingSettings.pollStart < now && pollingSettings.pollEnd > now) {
                let stats = await apexService.getStatsFromCode(pollingSettings.statsCodes);
                let newStats = stats.filter(stat => !pollingSettings.pollCurrent || console.log(matchId, pollingSettings.pollCurrent, stat.match_start * 1000, pollingSettings.pollCurrent < (stat.match_start * 1000) ) || pollingSettings.pollCurrent < (stat.match_start * 1000));
                let latestGame = await statsService.getLatestedGame(matchId);

                console.log("Found new games", newStats.map(s => s.match_start));

                for (let stat of newStats) {
                    await processStats(matchId, ++latestGame.game, stat);
                }
                if(newStats.length > 0)
                    await matchService.updateMatchPolling(matchId, now);

            }
        }
    }

    async function getStats(matchId, game, stacked = false) {
        const cacheKey = `stats:${matchId}-${game}`;

        await checkAutoPoll(matchId);

        let stats = await cache.getOrSet(cacheKey, async () => {
            let stats = await statsService.getStats(matchId, game);

            if (!stats || stats.length == 0) {
                let teams = await matchService.getMatchTeams(matchId);

                if(teams?.length) {
                    return {
                        teams: teams.map(t => ({ ...t, player_stats: [], overall_stats: { name: t.name } })).sort((a, b) => a.teamId - b.teamId),
                    };
                } else {
                    return {}
                }
            }

            if (game == "overall" || stacked) {
                stats = {
                    total: stats.length,
                    games: stats,
                    teams: apexService.generateOverallStats(stats),
                    stacked: stacked ? stats.map((_, index) => apexService.generateOverallStats(stats.slice(0, index + 1))) : undefined
                }
            } else {
                stats = stats[0];
            }
            return stats;
        });
        return stats;
    }

    async function processStats(matchId, game, statsData, liveData) {
        const matchSettings = await matchService.getMatchSettings(matchId);

        const placementPoints = matchSettings?.scoring?.placementPoints;
        const killPoints = matchSettings?.scoring?.killPoints;
        const ringKillPoints = matchSettings?.scoring?.ringKillPoints;


        let gameStats, source;
        if (statsData && liveData) {
            gameStats = apexService.mergeStats(statsData, liveData);
            source = "statscode+livedata";
        }
        else if (liveData) {
            gameStats = liveData;
            source = "livedata";
        }
        else {
            gameStats = statsData;
            source = "statscode";
        }

        gameStats = apexService.generateGameReport(gameStats, placementPoints, killPoints, ringKillPoints);
        let gameId = await statsService.writeStats(matchId, game, gameStats, source);
        await deleteCache(matchId, game);

        return { gameId, ...gameStats };
    }


    app.get("/mock", (req, res) => {
        const mockStats = require("../mock/eastats5.json")
        res.json(mockStats)
    })

    app.post("/auth/organizer", async (req, res) => {
        const {
            key, username
        } = req.body;

        let organizer = await authService.getOrganizer(username, key);

        res.send(organizer)
    })

    app.post("/auth/create", verifyAdminHeaders, async (req, res) => {
        const {
            username
        } = req.body;

        let organizer = await authService.createOrganizer(username);

        res.send(organizer);
    })

    app.get("/match/:organizer/:eventId", async (req, res) => {
        let result = await matchService.getMatch(req.params.organizer, req.params.eventId);
        res.send(result);
    })

    app.get("/match/:matchId", async (req, res) => {
        let result = await matchService.getMatchById(req.params.matchId);
        res.send(result);
    })

    app.post("/settings/broadcast/:organizer", verifyOrganizerHeaders, async (req, res) => {
        await broadcastService.setBroadcastSettings(req.organizer, req.body);
        res.sendStatus(200);
    })

    app.get("/settings/broadcast/:organizer", async (req, res) => {
        let result = await broadcastService.getBroadcastSettings(req.params.organizer);
        res.send(result);
    })

    app.get("/settings/match/:matchId/teams", async (req, res) => {
        let result = await matchService.getMatchTeams(req.params.matchId);
        res.send(result);
    })

    app.post("/settings/match/:matchId/team", verifyOrganizerHeaders, async (req, res) => {
        const {
            teamId,
            name
        } = req.body;

        let matchId = req.params.matchId;
        await matchService.setMatchTeam(matchId, teamId, name);

        deleteCache(matchId, "overall");
        res.sendStatus(200);
    })

    app.post("/settings/match/:matchId", verifyOrganizerHeaders, async (req, res) => {
        await matchService.setMatchSettings(req.params.matchId, req.body);
        res.sendStatus(200);
    })

    app.get("/settings/match/:matchId", async (req, res) => {
        let result = await matchService.getMatchSettings(req.params.matchId);
        res.send(result);
    })

    app.get("/settings/match_list/:organizer", async (req, res) => {
        let result = await matchService.getMatchList(req.params.organizer);
        res.send(result);
    })

    app.post("/organizer/match/:organizer/", async (req, res) => {
        await matchService.setOrganizerMatch(req.params.organizer, req.body.match);
        res.sendStatus(200);
    })

    app.get("/organizer/match/:organizer/", async (req, res) => {
        let result = await matchService.getOrganizerMatch(req.params.organizer);
        res.send(result);
    })

    app.post("/settings/default_apex_client/:organizer/", async (req, res) => {
        await broadcastService.setOrganizerDefaultApexClient(req.params.organizer, req.body.client);
        res.sendStatus(200);
    })

    app.get("/settings/default_apex_client/:organizer/", async (req, res) => {
        let result = await broadcastService.getOrganizerDefaultApexClient(req.params.organizer);
        res.send(result);
    })

    app.post("/settings/auto_poll/", verifyOrganizerHeaders, async (req, res) => {
        const {
            matchId,
            pollStart,
            pollEnd,
            statsCodes
        } = req.body;

        try {
            await matchService.setMatchPolling(matchId, pollStart, pollEnd, statsCodes);
            res.sendStatus(200);
        } catch (err) {
            console.log(err);
            res.send(err);
        }
    })

    app.get("/settings/auto_poll/:matchId",verifyOrganizerHeaders,  async (req, res) => {
        const {
            matchId
        } = req.params;

        let result = await matchService.getMatchPolling(matchId);
        res.send(result);
    })

    app.get("/stats/code/:statsCode", verifyOrganizerHeaders, async (req, res) => {
        let stats = await apexService.getStatsFromCode(req.params.statsCode);
        stats = stats.map(stat => apexService.generateGameReport(stat));

        res.send(stats);
    })

    app.post("/match", verifyOrganizerHeaders, async (req, res) => {
        let id = await matchService.createMatch(req.organizer, req.body.eventId);
        res.send({ match: id });
    })

    app.post("/stats", verifyOrganizerHeaders, async (req, res) => {
        let { matchId, game, statsCode, startTime, selectedUnclaimed } = req.body;
        const liveDataFile = req.files?.["liveData"];

        let respawnStats = undefined;
        if (statsCode && statsCode.length > 0 && statsCode !== "undefined") {
            respawnStats = await apexService.getMatchFromCode(statsCode, startTime);
        }

        if (!respawnStats && !liveDataFile && !selectedUnclaimed) {
            return res.status(400).send({ err:"no_data", msg: "No data was sent to server, cannot process request" });
        }

        let liveDataStats = undefined;
        let liveDataJson = undefined;

        if (selectedUnclaimed && selectedUnclaimed !== "undefined") {
            liveDataJson = await statsService.getLiveDataById(selectedUnclaimed);
        }
        else if (liveDataFile) {
            try {
                liveDataJson = JSON.parse(liveDataFile.data.toString());
            } catch (err) {
                console.log(err);
                return res.status(500).send({ err: "live_data_parse", msg: "The uploaded file is not valid." })
            }
        }

        if (liveDataJson) {
            try {
                liveDataStats = liveService.processDataDump(liveDataJson);
                liveDataStats = liveService.convertLiveDataToRespawnApi(liveDataStats).matches[0];
            } catch (err) {
                console.error(err)
                return res.status(500).send({ err: "live_data_parse", msg: "The uploaded file is not valid." })
            }
        }

        try {
            let gameStats = await processStats(matchId, game, respawnStats, liveDataStats);
            let gameId = gameStats.gameId;
            if (selectedUnclaimed) {
                statsService.setLiveDataGame(selectedUnclaimed, gameId)
            }
            else if (!selectedUnclaimed && liveDataJson && gameId) {
                console.log("Writing live data", gameId, req.organizer.id);
                await statsService.writeLiveData(gameId, liveDataJson, req.organizer.id)
            }

            return res.status(200).send(gameStats);
        } catch (err) {
            console.error(err);
            return res.status(500).send({ err: "live_data_parse", msg: "Something went wrong adding the game." });
        }

    })


    app.get("/stats/:matchId/:game/livedata", async (req, res) => {
        const {
            matchId,
            game
        } = req.params;

        let key = `stats:${matchId}-${game}-livedata-parsed`;
        try {
            let data = await cache.getOrSet(key, async () => {
                let gameId = await statsService.hasLiveData(matchId, game);

                if (!gameId) {
                    return { err: "err_no_data", msg: "This game doesn't have any live data attached" }
                }
                let data = await statsService.getLiveData(gameId);
                let parsed = liveService.processDataDump(data);

                return parsed;
            }, 300)

            res.send(data);
        } catch (err) {
            res.send({ err: "err_retriving_data", msg: "Error getting live data" });
            console.log(err)
        }
    })

    app.get("/stats/unclaimed_livedata", verifyOrganizerHeaders, async (req, res) => {
        res.send(await statsService.getUnclaimedLiveData(req.organizer.id));
    })

    app.get("/games/:matchId", async (req, res) => {
        const {
            matchId
        } = req.params;
        let result = await statsService.getGameList(matchId);
        res.send(result);
    })


    app.get("/stats/:matchId/summary", async (req, res) => {
        const {
            matchId
        } = req.params;
        let stats = await getStats(matchId, "overall");
        let body = "";
        if (stats.teams) {
            let message = stats.teams.map(team => `${team.name} ${team.overall_stats.score}`)
            body = message.join(", ");
        }
        let message =  `${body} -- (after ${stats.total} games)`;

        let match = await matchService.getMatchById(matchId);
        let settings = await matchService.getMatchSettings(match.id);
        let title = (settings && settings.title) || `${match.eventId}`;

        res.send(`--- ${title} --- ${message}`);
    })

    app.get("/stats/:matchId/stacked", async (req, res) => {
        const {
            matchId,
        } = req.params;
        let stats = await getStats(matchId, "overall", true);

        res.send(stats);
    })

    app.get("/stats/:matchId/:game", async (req, res) => {
        const {
            matchId,
            game
        } = req.params;
        let stats = await getStats(matchId, game);
        
        res.send(stats);
    })

    app.get("/stats/:matchId/:game/csv", async (req, res) => {
        const {
            matchId,
            game
        } = req.params;
        let stats = await getStats(matchId, game);
        let csv = statsToCsv(stats, req.query.team, req.query.full);

        res.attachment(`${matchId}+${game}.csv`).send(csv)
    });

    app.delete("/stats/:matchId/:game", verifyOrganizerHeaders, async (req, res) => {
        const {
            matchId,
            game
        } = req.params;

        await statsService.deleteStats(matchId, game);
        await deleteCache(matchId, game);

        res.sendStatus(200);
    })

    app.patch("/stats/score/", verifyOrganizerHeaders, async (req, res) => {
        const {
            gameId,
            teamId,
            score,
        } = req.body;

        await statsService.editScore(gameId, teamId, score);
        let game = await statsService.getGame(gameId);
        await deleteCache(game.matchId, game.game)
        res.sendStatus(200);
    })

    app.get("/stats/latest", async (req, res) => {
        const cacheKey = "latest";

        let cachedLatest = await cache.get(cacheKey);
        if (cachedLatest) {
            return res.send(cachedLatest);
        }

        let matches = await statsService.getLatest();
        let settings = await Promise.all(matches.map(async match => matchService.getMatchSettings(match.matchId)));
        matches = matches.slice(0, 12);
        if (matches) {
            let stats = matches.map((match, id) => {
                return {
                    id: match.id,
                    organizer: match.username,
                    eventId: match.eventId,
                    matchId: match.matchId,
                    title: (settings[id] || {}).title,
                    top3: apexService.generateOverallStats(match.stats).slice(0, 3).map(team => team.overall_stats)
                }
            });

            cache.put(cacheKey, stats, 300);

            res.send(stats);
        }
    })


    app.get("/short_link", async (req, res) => {
        const url = req.query.url;
        let hash = await shortLinkService.getHash(url);

        if (!hash) {
            hash = await shortLinkService.createShortLink(url);
        }

        hash = SHORT_LINK_PREFIX + hash

        res.send({ hash });
    })

    app.get("/" + SHORT_LINK_PREFIX + "*", async (req, res) => {
        const hash = req.params[0];

        let url = await shortLinkService.getUrl(hash);
        if (url) {
            await shortLinkService.incrementVisit(hash);
            res.redirect(url);
        } else {
            res.sendStatus(404);
        }
    })


    app.get("/players", async (req, res) => {
        res.send(await playerService.listPlayers(req.query.start, req.query.count, req.query.search));
    })

    app.get("/player/:id", async (req, res) => {
        res.send(await playerService.getPlayer(req.params.id));
    })

    app.get("/player/:id/matches", async (req, res) => {
        res.send(await playerService.getMatches(req.params.id, req.query.start, req.query.count));
    })

    app.post("/drop", async (req, res) => {
        const {
            matchId, 
            teamName, 
            token, 
            map,
            pass, 
            color,
            drop
        } = req.body;

        console.log(req.body);

        let result = await dropService.setDrop(matchId, pass, map, token, teamName, color, drop);
        if (result.err) {
            res.status(400).send(result);
        } else {
            res.send(result);
        }
    })

    app.delete("/drop/:matchId/:map/:token/:drop?", async (req, res) => {
        const {
            matchId,
            token,
            map,
            drop,
        } = req.params;

        let result = await dropService.deleteDrop(matchId, map, token, drop);
        res.send(result);
    })

    app.delete("/drop_delete_admin/:matchId/:map/:teamName?", verifyOrganizerHeaders, async (req, res) => {
        const {
            matchId,
            map,
            teamName,
        } = req.params;

        let result = await dropService.deleteDropsAdmin(matchId, map, teamName);
        res.send(result);
    })

    app.get("/drops/:matchId/:map/:token?", async (req, res) => {
        const {
            matchId,
            map,
            token,
        } = req.params;

        if (isNaN(matchId) || !map) {
            return res.send({});
        }

        let result = token? await dropService.getMatchDropsByToken(matchId, map, token) : await dropService.getMatchDrops(matchId, map);
        res.send(result);
    })
  
    app.ws("/live/write/:key/:client", (ws, req) => {
        wsHandlerService.connectWrite(ws, req.params.key, req.params.client);
    })

    app.ws("/live/read/:org/:client", (ws, req) => {
        wsHandlerService.connectRead(ws, req.params.org, req.params.client);
    })

    app.get("/live/clients/:org", (req, res) => {
        res.send(wsHandlerService.getClients(req.params.org));
    })

    app.post("/live/clients/", verifyOrganizerHeaders, async (req, res) => {
        const client = req.body.client.substring(0, 128);
        let { selected_apex_client } = await broadcastService.getOrganizerDefaultApexClient(req.organizer.username);
        if (!selected_apex_client) {
            console.log("Setting Default Client")
            await broadcastService.setOrganizerDefaultApexClient(req.organizer.username, client);
        }
        wsHandlerService.addClient(req.organizer.username, client);
        res.sendStatus(200);
    });

    app.ws("/", (ws, req) => {
        ws.on("message", (msg) => console.log(msg));
    })

}