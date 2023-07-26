const dropService = require("../services/drops.service");
const { verifyOrganizerHeaders } = require("../middleware/auth");

module.exports = function setup(app) {
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

        let result = await dropService.deleteDropsAdmin(req.organizer.username, matchId, map, teamName);
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

        let result = token ? await dropService.getMatchDropsByToken(matchId, map, token) : await dropService.getMatchDrops(matchId, map);
        console.log(result);
        res.send(result);
    })

    app.get("/drops_history/:matchId/:map", async (req, res) => {
        const {
            matchId,
            map,
        } = req.params;

        if (isNaN(matchId) || !map) {
            return res.send([]);
        }

        let result = await dropService.getMatchDropsHistory(matchId, map);
        console.log(result);
        res.send(result);
    })

}