const matchService = require("../services/match.service");
const { verifyOrganizerHeaders } = require("../middleware/auth");
const cache = require("../services/cache.service");

module.exports = function setup(app) {
    app.get("/match/:organizer/:eventId", async (req, res) => {
        let result = await matchService.getMatch(req.params.organizer, req.params.eventId);
        res.send(result);
    })

    app.get("/match/:matchId", async (req, res) => {
        let result = await matchService.getMatchById(req.params.matchId);
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

        cache.deleteMatchCache(matchId, "overall");
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
        let result = await matchService.getMatchList(req.params.organizer, req.query.archived);
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

    app.get("/settings/auto_poll/:matchId", verifyOrganizerHeaders, async (req, res) => {
        const {
            matchId
        } = req.params;

        let result = await matchService.getMatchPolling(matchId);
        res.send(result);
    })

    app.post("/match", verifyOrganizerHeaders, async (req, res) => {
        let id = await matchService.createMatch(req.organizer, req.body.eventId);
        res.send({ match: id });
    })

    app.post("/match/archive", verifyOrganizerHeaders, async (req, res) => {
        const {
            matchId,
            archive
        } = req.body;

        await matchService.archiveMatch(req.organizer, matchId, archive);
        res.send({ });
    })


    app.post("/match/clone", verifyOrganizerHeaders, async (req, res) => {
        const {
            matchId,
            eventId,
        } = req.body;

        let newMatch = await matchService.cloneMatch(req.organizer, eventId, matchId);
        res.send({ newMatch });
    })

    app.post("/match/clone_reset", verifyOrganizerHeaders, async (req, res) => {
        const {
            matchId,
            eventId,
        } = req.body;

        let newMatch = await matchService.cloneDataAndReset(req.organizer, eventId, matchId);
        await cache.deleteMatchCache(matchId);
        res.send({ newMatch });
    })


    app.patch("/match", verifyOrganizerHeaders, async (req, res) => {
        const {
            matchId,
            eventId,
        } = req.body;

        await matchService.updateEventId(req.organizer, matchId, eventId);
        res.send({  });
    })

}