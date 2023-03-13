const _ = require("lodash");

const defaultStruct = () => ({
    match_start: 0,
    state: "preinit",
    totalTeams: 0,
    teamsAlive: 0,
    serverConfig: {},
    players: {},
    observers: {},
    feed: [],
})

const STATUS = {
    ALIVE: "alive",
    DOWNED: "downed",
    DEAD: "dead",
    CARD_COLLECTED: "card_collected",
    ELIMINATED: "eliminated"
}

function processDataDump(chunk, data = defaultStruct()) {
    for (let line of chunk) {
        data = processDataLine(line, data);
    }
    return data;
}

function processDataLine(line, data = defaultStruct()) {
    let pid = line.player ? line.player.nucleusHash : undefined;
    let players = data.players;

    try {
        switch (line.category) {
            case "init":
                data.match_start = line.timestamp;
                break;
            case "gameStateChanged":
            case "matchStateEnd":
                data.state = line.state;
                if (data.state === "PickLoadout") {
                    //determine # of starting teams
                    let count = _.uniqBy(Object.values(data.players), "teamId").length;
                    console.log(count);
                    data.totalTeams = count;
                    data.teamsAlive = count;
                }

                if (data.state === "WinnerDetermined") {
                    line.winners.forEach(player => {
                        data.players[player.nucleusHash].teamPlacement = 1;
                    })
                }
                break;
            case "matchSetup":
                data.serverConfig = line;
                break;
            case "playerConnected":
                // Dont include spectators
                if (line.player.teamId > 1) {
                    players[pid] = {
                        ...line.player,
                        ...players[pid],
                    }
                } else {
                    data.observers[pid] = {
                        nucleusHash: pid,
                        name: line.player.name,
                        target: {},
                        targetTeam: [],
                    }
                }
                break;
            case "characterSelected":
                if (line.player.teamId > 1) {
                    players[pid] = {
                        ...line.player,
                        currentWeapon: undefined,
                        shots: 0,
                        damageDealt: 0,
                        damageTaken: 0,
                        tacticalsUsed: 0,
                        ultimatesUsed: 0,
                        grenadesThrown: 0,
                        knockdowns: 0,
                        teamPlacement: -1,
                        revives: 0,
                        kills: 0,
                        status: STATUS.ALIVE,
                        characterSelected: true,
                        character: line.character.toLowerCase()
                    };
                }
                break;
            case "observerSwitched":
                let bid = line.observer.nucleusHash;
                data.observers[bid].target = line.target;
                data.observers[bid].targetTeam = line.targetTeam;
                break;
            case "weaponSwitched":
                getPlayer(players, pid).currentWeapon = line.newWeapon;
                break;
            case "playerDamaged":
                let damage = parseInt(line.damageInflicted)
                if (line.attacker.nucleusHash) {
                    let attacker = players[line.attacker.nucleusHash]
                    attacker.damageDealt += damage;
                }

                let previous = data.feed[data.feed.length - 1];

                if (previous && previous.type == "damage" && previous.player.nucleusHash == line.attacker.nucleusHash && previous.victim.nucleusHash == line.victim.nucleusHash && previous.weapon == line.weapon) {
                    previous.damage += damage;
                } else {
                    data.feed.push({ timestamp: line.timestamp, type: "damage", player: line.attacker, victim: line.victim, weapon: line.weapon, damage: damage });
                }


                let victim = players[line.victim.nucleusHash];
                victim.damageTaken += damage;
                victim.currentHealth = line.victim.currentHealth;
                victim.shieldHealth = line.victim.shieldHealth;
                break;
            case "playerAbilityUsed":
                if (line.linkedEntity.includes("Tactical")) {
                    getPlayer(players, pid).tacticalsUsed += 1;
                } else if (line.linkedEntity.includes("Ultimate")) {
                    getPlayer(players, pid).ultimatesUsed += 1;
                }
                break;
            case "grenadeThrown":
                if (!line.linkedEntity.includes("Tactical") && !line.linkedEntity.includes("Ultimate")) {
                    getPlayer(players, pid).grenadesThrown += 1;
                }
                break;
            case "playerDowned":
                data.feed.push({ timestamp: line.timestamp, type: "down", player: line.attacker, victim: line.victim, weapon: line.weapon, damage: line.damageInflicted });
                players[line.attacker.nucleusHash].knockdowns += 1;
                players[line.victim.nucleusHash].status = STATUS.DOWNED;
                break;
            case "playerKilled":
                if (players[line.victim.nucleusHash].status == STATUS.ALIVE) {
                    //work around for missing downed events, make sure we push a down to the killfeed;
                    //console.log("Deriving down for ", line.awardedTo, line.victim);
                    data.feed.push({ timestamp: line.timestamp, type: "down", player: line.awardedTo, victim: line.victim, weapon: line.weapon, damage: 0, derived: true });
                    data.players[line.awardedTo.nucleusHash].knockdowns += 1;
                }

                data.feed.push({ timestamp: line.timestamp, type: "kill", player: line.awardedTo, victim: line.victim, weapon: line.weapon, damage: line.damageInflicted });
                let killer = players[line.awardedTo.nucleusHash]
                if (killer.status != STATUS.ELIMINATED) {
                    killer.kills += 1;
                }
                players[line.victim.nucleusHash].status = STATUS.DEAD;
                break;
            case "playerRespawnTeam":
                let split = line.respawned.split(",");
                split.forEach(respawned => {
                    let hash = Object.values(players).find(player => player.name == respawned).nucleusHash;
                    data.feed.push({ timestamp: line.timestamp, type: "respawn", player: { nucleusHash: hash, name: respawned } });
                    players[hash].status = STATUS.ALIVE;
                });
                break;
            case "playerRevive":
                players[line.revived.nucleusHash].status = STATUS.ALIVE;
                data.feed.push({ timestamp: line.timestamp, type: "revive", player: line.revived });
                players[line.revived.nucleusHash].status = STATUS.ALIVE;
                break;
            case "squadEliminated":
                let update = false;
                line.players.forEach(player => {
                    if (data.players[player.nucleusHash].teamPlacement == -1) {
                        data.players[player.nucleusHash].teamPlacement = data.teamsAlive;
                        data.players[player.nucleusHash].status = STATUS.ELIMINATED;
                        update = true;
                    }
                })
                data.feed.push({ timestamp: line.timestamp, type: "eliminated", team: line.players });

                if (update)
                    data.teamsAlive -= 1;
                break;
        }

        if (line.player && line.player.teamId > 1) {
            getPlayer(players, pid).maxHealth = line.player.maxHealth;
            getPlayer(players, pid).shieldMaxHealth = line.player.shieldMaxHealth;
            getPlayer(players, pid).currentHealth = line.player.currentHealth;
            getPlayer(players, pid).shieldHealth = line.player.shieldHealth;
        }
    } catch (err) {
        // console.log(err);
        // console.log(line);
        // console.log(JSON.stringify(data.players));
    }
    return data;
}

function getPlayer(players, pid) {
    let player = players[pid];
    if (!player) {
        console.log("UNDEF PLAYER", pid);
    }
    return player;
}

function convertLiveDataToRespawnApi(data) {
    let player_results = Object.values(data.players).map(player => ({
        playerName: player.name,
        teamNum: player.teamId,
        teamName: player.teamName,
        shots: player.shots,
        hits: player.hits,
        knockdowns: player.knockdowns,
        damageDealt: player.damageDealt,
        teamPlacement: player.teamPlacement,
        characterName: player.character,
        nidHash: player.nucleusHash,
        skin: player.skin,
        kills: player.kills,
        grenadesThrown: player.grenadesThrown,
        ultimatesUsed: player.ultimatesUsed,
        tacticalsUsed: player.tacticalsUsed,
        damageTaken: player.damageTaken,
    }));

    return {
        matches: [{
            match_start: data.match_start,
            player_results,
            server: `(${data.serverConfig.datacenter.name})${data.serverConfig.serverId}`,
            map_name: data.serverConfig.map,
            aim_assist_allowed: !data.serverConfig.aimAssistOn,
            anonymousMode: data.serverConfig.anonymousMode,
        }]
    }
}


module.exports = {
    processDataDump,
    processDataLine,
    convertLiveDataToRespawnApi
}