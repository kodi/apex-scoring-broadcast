import axios from "axios";

export default {
    install(Vue, options) {
        Vue.prototype.$apex = apexService(options);
    }
}

function getApiKeyHeaders() {
    return {
        "x-organizer-key": localStorage.getItem("organizer-key"),
        "x-organizer-name": localStorage.getItem("organizer-username"),
    }
}



function apexService(config) {

    function getApiKey() {
        return localStorage.getItem("organizer-key");
    }

    function sanatizedEventId(eventId) {
        if(eventId)
            return eventId.replace(/[\W_]+/g, "_").substring(0, 30);
    }

    function getMatchPageUrl(router, organizer, matchId, eventId, page = "tournament", game = "overall") {
        eventId = sanatizedEventId(eventId);
        return window.location.origin + router.resolve({ name: page, params: { organizer: organizer, matchSlug: matchId + (eventId ? '.' + eventId : ""), game} }).href
    }

    async function login(username, key) {
        let result = await axios.post(`${config.baseUrl}auth/organizer`, { username, key });

        return result.data;
    }

    async function getStatsFromCode(statsCode) {
        let stats = await axios.get(`${config.baseUrl}stats/code/${statsCode}`, { headers: getApiKeyHeaders() });
        return stats.data;
    }

    async function getStats(matchId, game) {
        let stats = await axios.get(config.baseUrl + "stats/" + matchId + "/" + game);
        return stats.data;
    }

    async function exportCsv(game, type, cols, stats) {
        let data = {header:[], rows:[]};
        data.header = cols.map(col => col.label);

        // get stats for either a specific game or overall teams
        const statsData = game !== "overall" ? stats.games.find(g => g.game === game).teams : stats.teams;

        if(statsData.length){
            if(type === "team") {
                data.rows = statsData.map(team => {
                    let overallStats = {};
                    cols.forEach(col => {
                        if(Object.prototype.hasOwnProperty.call(team.overall_stats, col.key))
                            overallStats[col.key] = team.overall_stats[col.key];
                        else
                            overallStats[col.key] = "-";
                    })
                    return overallStats;
                })
            }else if (type === "player") {
                statsData.forEach(team => {
                    team.player_stats.forEach(player => {
                        let playerStats = {};
                        cols.forEach(col => {
                            if(col.key === "characterName" && game === "overall") {
                                playerStats.characterName = player.characters.join(", ");
                            }else if(Object.prototype.hasOwnProperty.call(player, col.key) && player[col.key] != null) {
                                playerStats[col.key] = player[col.key];
                            }else
                                playerStats[col.key] = "-";
                        })
                        data.rows.push(playerStats);
                    })
                })
            }
        }

        // print header as a string
        let dataString = JSON.stringify(data.header).replace(/\[|\]/g, "");
        data.rows.forEach(row => {
            dataString += "\n";
            Object.keys(row).forEach((key, i) => {
                if(i === 0)
                    dataString += `"${row[key]}"`;
                else
                    dataString += `,"${row[key]}"`;
            })
        })
        const dataBlob = new Blob([dataString]);

        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.setAttribute('download',  stats.matchId + "_" + game + ".csv");
        link.setAttribute('href', url);
        link.click();
    }

    async function getGameList(matchId) {
        let stats = await axios.get(config.baseUrl + "games/" + matchId);
        return stats.data;
    }

    async function generateStats(matchId, statsCode, game, startTime, selectedUnclaimed, liveData) {
        let form = new FormData();

        form.append("matchId", matchId);
        form.append("statsCode", statsCode);
        form.append("game", game);
        if (startTime)
            form.append("startTime", startTime);
        if(selectedUnclaimed)
            form.append("selectedUnclaimed", selectedUnclaimed);
        if(liveData)
            form.append("liveData", liveData);

        try {
            let result = await axios.post(config.baseUrl + "stats", form, { headers: getApiKeyHeaders() })
            return result.data;
        } catch (err) {
            return err.response.data;
        }

    }

    async function deleteStats(matchId, game) {
        await axios.delete(config.baseUrl + "stats/" + matchId + "/" + game, { headers: getApiKeyHeaders() });
    }

    async function getBroadcastSettings(organizer) {
        let data = await axios.get(config.baseUrl + "settings/broadcast/" + organizer);
        return data.data;
    }

    async function setBroadcastSettings(organizer, display) {
        await axios.post(config.baseUrl + "settings/broadcast/" + organizer, display, { headers: getApiKeyHeaders() });
    }

    async function getPublicSettings(matchId) {
        let data = await axios.get(`${config.baseUrl}settings/match/${matchId}`);
        return data.data;
    }

    async function setPublicSettings(matchId, display) {
        await axios.post(`${config.baseUrl}settings/match/${matchId}`, display, { headers: getApiKeyHeaders() });
    }

    async function setSelectedMatch(organizer, match) {
        await axios.post(config.baseUrl + "organizer/match/" + organizer, { match }, { headers: getApiKeyHeaders() });
    }

    async function getSelectedMatch(organizer) {
        let { data } = await axios.get(config.baseUrl + "organizer/match/" + organizer, { headers: getApiKeyHeaders() });
        return data;
    }

    async function setMatchPolling(matchId, pollStart, pollEnd, statsCodes) {
        let { data } = await axios.post(config.baseUrl + "settings/auto_poll", { matchId, pollStart, pollEnd, statsCodes }, { headers: getApiKeyHeaders() })
        return data;
    }

    async function getMatchPolling(matchId) {
        let { data } = await axios.get(config.baseUrl + "settings/auto_poll/" + matchId, { headers: getApiKeyHeaders() } )
        return data;
    }

    async function getMatchTeams(matchId) {
        let { data } = await axios.get(`${config.baseUrl}settings/match/${matchId}/teams`);
        return data;
    }

    async function setMatchTeam(matchId, teamId, name) {
        await axios.post(`${config.baseUrl}settings/match/${matchId}/team`, {
            teamId,
            name
        }, { headers: getApiKeyHeaders() });
    }

    async function archiveMatch(matchId) {
        await axios.post(config.baseUrl + "match/archive", {matchId}, { headers: getApiKeyHeaders() });
    }

    async function unArchiveMatch(matchId) {
        await axios.post(config.baseUrl + "match/archive", { matchId, archive: false}, { headers: getApiKeyHeaders() });
    }

    async function cloneMatch(eventId, matchId) {
        await axios.post(config.baseUrl + "match/clone", {matchId, eventId}, { headers: getApiKeyHeaders() });
    }

    async function cloneDataAndReset(eventId, matchId) {
        await axios.post(config.baseUrl + "match/clone_reset", { matchId, eventId }, { headers: getApiKeyHeaders() });
    }

    async function updateEventId(matchId, eventId) {
        await axios.patch(config.baseUrl + "match", { matchId, eventId }, { headers: getApiKeyHeaders() });
    }

    async function setOrganizerDefaultApexClient(organizer, client) {
        await axios.post(config.baseUrl + "settings/default_apex_client/" + organizer, { client }, { headers: getApiKeyHeaders() });
    }

    async function getOrganizerDefaultApexClient(organizer) {
        let { data } = await axios.get(config.baseUrl + "settings/default_apex_client/" + organizer, { headers: getApiKeyHeaders() });
        return data.selected_apex_client;
    }

    async function editScore(gameId, teamId, score) {
        let { data } = await axios.patch(`${config.baseUrl}stats/score/`, { gameId, teamId, score }, { headers: getApiKeyHeaders() });
        return data;
    }

    async function getMatchList(organizer, archived) {
        let result = await axios.get(config.baseUrl + "settings/match_list/" + organizer + (archived ? "?archived=true" : ""), { headers: getApiKeyHeaders() });
        return result.data;
    }

    async function getMatchById(matchId) {
        let result = await axios.get(config.baseUrl + "match/" + matchId);
        return result.data;
    }

    async function getLatest() {
        let data = await axios.get(config.baseUrl + "stats/latest");
        return data.data;
    }

    async function getShortLink(url) {
        let data = await axios.get(config.baseUrl + "short_link?url=" + encodeURIComponent(url));
        return data.data;
    }

    async function getLiveData(matchId, game) {
        let data = await axios.get(`${config.baseUrl}stats/${matchId}/${game}/livedata`);
        return data.data;
    }

    async function getUnclaimedLiveData() {
        let data = await axios.get(`${config.baseUrl}stats/unclaimed_livedata`, { headers: getApiKeyHeaders() });
        return data.data;
    }

    async function getPlayers(start, count, search) {
        let data = await axios.get(`${config.baseUrl}players?start=${start}&count=${count}&search=${search}`);
        return data.data;
    }

    async function getPlayer(id) {
        let data = await axios.get(`${config.baseUrl}player/${id}`);
        return data.data;
    }

    async function getPlayerMatches(id, start, count) {
        let data = await axios.get(`${config.baseUrl}player/${id}/matches?start=${start}&count=${count}`);
        return data.data;
    }

    async function createMatch(eventId) {
        let { data } = await axios.post(`${config.baseUrl}match`, { eventId }, { headers: getApiKeyHeaders() });
        return data;
    }

    async function getMatch(organizerName, eventId) {
        let { data } = await axios.get(`${config.baseUrl}match/${organizerName}/${encodeURIComponent(eventId)}`);
        return data;
    }

    async function setDrop(matchId, teamName, map, pass, token, color, drop) {
        let { data } = await axios.post(`${config.baseUrl}drop`, { matchId, teamName, token, map, pass, color, drop });
        return data;
    }

    async function deleteDrop(matchId, map, token, drop) {
        let { data } = await axios.delete(`${config.baseUrl}drop/${matchId}/${map}/${token}${drop ? '/' + drop : '' }`);
        return data;
    }

    async function deleteDropAdmin(matchId, map, teamName) {
        let { data } = await axios.delete(`${config.baseUrl}drop_delete_admin/${matchId}/${map}${teamName ? '/' + encodeURIComponent(teamName) : ''}`, { headers: getApiKeyHeaders() });
        return data;
    }

    async function getDrops(matchId, map, token) {
        let { data } = await axios.get(`${ config.baseUrl }drops/${matchId}/${map}${token ? '/' + token : ''}`);
        return data;
    }


    let connections = {};
    function getLiveDataWs(organizer, client) {
        const name = organizer + ":" + client;
        if (!connections[name]) {
            connections[name] = new WebSocket(`${config.wsReadUrl}/${organizer}/${client}`);
            connections[name].onclose = () => {
                connections[name] = undefined
            };
        }
        return connections[name];
    }

    async function getClients(organizer) {
        let data = await axios.get(`${config.baseUrl}live/clients/${organizer}`);
        return data.data;
    }

    async function addClient(client) {
        let data = await axios.post(`${config.baseUrl}live/clients/`, { client }, { headers: getApiKeyHeaders() });
        return data.data;
    }



    return {
        config,
        
        getApiKey,
        getMatchPageUrl,
        getStats,
        generateStats,
        getBroadcastSettings,
        setBroadcastSettings,
        getPublicSettings,
        setPublicSettings,
        getMatchList,
        getSelectedMatch,
        setSelectedMatch,
        setMatchPolling,
        getMatchPolling,
        getMatchTeams,
        setMatchTeam,
        getStatsFromCode,
        login,
        getGameList,
        deleteStats,
        getLatest,
        getShortLink,
        getLiveData,
        getPlayers,
        getPlayer,
        getPlayerMatches,
        getLiveDataWs,
        getUnclaimedLiveData,
        getClients,
        setOrganizerDefaultApexClient,
        getOrganizerDefaultApexClient,
        addClient,
        createMatch,
        getMatch,
        editScore,
        exportCsv,
        setDrop,
        getDrops,
        deleteDrop,
        deleteDropAdmin,
        getMatchById,
        archiveMatch,
        unArchiveMatch,
        cloneMatch,
        cloneDataAndReset,
        updateEventId,
    }
}