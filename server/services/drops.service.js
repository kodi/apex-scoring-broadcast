const { db } = require("../connectors/db");
const matchService = require("./match.service");
const { v4: uuid } = require('uuid');
const _ = require("lodash");

async function setDrop(matchId, pass, map, token, teamName, color, drop) {
    const settings = await matchService.getMatchSettings(matchId);
    const dropPass = settings.drops.pass; // yea this gets sent to the client so its not exactly secure
                                          // but it doesn't really matter for now
    
    if (pass !== dropPass) {
        console.log(pass, dropPass)
        return { err: "INVALID_PASSWORD" };
    }

    if (!token || token === "null") {
        token = uuid();
    }
     
    await db("drops").insert({ matchId, map, token, teamName, color, drop });
    return {token};
}

async function deleteDrop(matchId, map, token, drop) {
    console.log("deleting normal", matchId, map, token, drop, drop == undefined, drop === "undefined")
    if (drop) {
        await db("drops").update({ "deletedAt": db.fn.now(6), deletedBy: token }).where({ matchId, map, token, drop });
    } else {
        await db("drops").update({ "deletedAt": db.fn.now(6), deletedBy: token }).where({ matchId, map, token });
    }
}

async function deleteDropsAdmin(organizerName, matchId, map, teamName) {
    console.log("deleting admin", matchId, map, "'" + teamName + "'");
    if (teamName) {
        await db("drops").update({ "deletedAt": db.fn.now(6), deletedBy: organizerName }).where({ matchId, map, teamName }).whereNull("deletedAt");
    } else {
        await db("drops").update({ "deletedAt": db.fn.now(6), deletedBy: organizerName }).where({ matchId, map }).whereNull("deletedAt");
    }
}

async function getMatchDrops(matchId, map) {
    let drops = await db("drops").select(['teamName','map', 'color', 'drop']).where({ matchId, map }).whereNull("deletedAt");

    drops = _.groupBy(drops, "teamName")
    return drops;
}

async function getMatchDropsHistory(matchId, map) {
    let drops = db("drops").select("*").where({ matchId, map });
    return drops;
}

async function getMatchDropsByToken(matchId, map, token) {
    let drops = await db("drops").select(['teamName', 'map', 'color', 'drop']).where({ matchId, map, token }).whereNull("deletedAt");;
    return drops;
}


module.exports = {
    setDrop,
    getMatchDrops,
    deleteDrop,
    getMatchDropsByToken,
    deleteDropsAdmin,
    getMatchDropsHistory,
}