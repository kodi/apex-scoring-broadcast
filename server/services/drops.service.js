const { db } = require("../connectors/db");
const matchService = require("./match.service");
const { v4: uuid } = require('uuid');
const _ = require("lodash");

async function setDrop(matchId, pass, map, token, teamName, color, drop) {
    const settings = await matchService.getMatchSettings(matchId);

    if (!settings.drops.enabled || !settings.drops.allowClaiming) {
        return { err: "DISABLED", msg: "Claiming is currently disabled" };
    }

    if (pass !== settings.drops.pass) {
        return { err: "INVALID_PASSWORD", msg: "Wrong Password" };
    }

    if (settings.drops.contestLimits?.enabled) {
        let teams = await getMatchDrops(matchId, map);
        let grouped = _.groupBy(Object.values(teams).flat(), "drop");

        let mapContest = Object.values(grouped).filter(g => g.length > 1).length;
        let poiContest = grouped[drop]?.length ?? 0;
        if (mapContest >= settings.drops.contestLimits.map && grouped[drop]?.length) {
            return { err: "MAX_CONTEST_MAP", msg: "Max contest of " + settings.drops.contestLimits.map + " has been reached for this map."};
        }

        if (poiContest >= settings.drops.contestLimits.poi) {
            return { err: "MAX_CONTEST_POI", msg: "Max contest of " + settings.drops.contestLimits.poi + " has been reached for this poi." };
        }
    }

    if (!token || token === "null") {
        token = uuid();
    }
     
    await db("drops").insert({ matchId, map, token, teamName, color, drop });
    return {token};
}

async function deleteDrop(matchId, map, token, drop) {
    if (drop) {
        await db("drops").update({ "deletedAt": db.fn.now(6), deletedBy: token }).where({ matchId, map, token, drop });
    } else {
        await db("drops").update({ "deletedAt": db.fn.now(6), deletedBy: token }).where({ matchId, map, token });
    }
}

async function deleteDropsAdmin(organizerName, matchId, map, teamName) {
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