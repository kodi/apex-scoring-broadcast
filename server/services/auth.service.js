const { db } = require("../connectors/db");
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';


function generateKey() {
    let randomString = '';

    for (let i = 0; i < 32; i++) {
        randomString += characters[Math.floor(Math.random() * characters.length)];
    }

    return randomString;
}

async function getOrganizerByKey(key) {
    return await db("organizers").where({ key }).select("id", "username").first();
}

async function getOrganizer(username, key) {
    if (!username || !key) {
        return false;
    }
    let result = await db("organizers").where({ username, key }).select("id", "username", "selected_match");
    return result[0];
}

async function getOrganizerId(username) {
    let result = await db("organizers").where({ username }).first("id");
    return result.id;
}

async function createOrganizer(username) {
    let key = generateKey();
    await db("organizers").insert({ username, key })
    return { username, key };
}

async function pageView(to, from, ip) {
    await db("pageview").insert({to, from, ip})
}

module.exports = {
    getOrganizer,
    getOrganizerId,
    createOrganizer,
    getOrganizerByKey,
    pageView,
}