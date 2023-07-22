const broadcastService = require("../services/broadcast.service");
const { verifyOrganizerHeaders } = require("../middleware/auth");


module.exports = function setup(app) {
    app.post("/settings/broadcast/:organizer", verifyOrganizerHeaders, async (req, res) => {
        await broadcastService.setBroadcastSettings(req.organizer, req.body);
        res.sendStatus(200);
    })

    app.get("/settings/broadcast/:organizer", async (req, res) => {
        let result = await broadcastService.getBroadcastSettings(req.params.organizer);
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
}