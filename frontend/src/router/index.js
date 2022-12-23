import Vue from 'vue'
import VueRouter from 'vue-router'
import Admin from "../views/Admin";
import Broadcast from "../views/Broadcast";
import Index from "../views/Index";
import Stats from "../views/Stats";
import Leaderboard from "../views/PublicLeaderboard";

import Standings from "../components/leaderboard/Standings";
import TeamStandings from "../components/leaderboard/TeamStandings";
import PlayerStandings from "../components/leaderboard/PlayerStandings";

Vue.use(VueRouter)

const routes = [
  {
    path: "/",
    name: "index",
    component: Index,
    props: true,
  },
  {
    path: "/broadcast/:organizer/:eventId",
    name: "broadcast",
    component: Broadcast,
    props: true,
  },
  {
    path: '/admin/:organizer?/:eventId?',
    name: 'admin',
    component: Admin,
    props: true,
  },
  {
    path: "/stats/:organizer/:eventId/",
    name: "stats",
    component: Stats,
    props: true,
    children: [
      {
        path: "leaderboard/:game?",
        name: "leaderboard",
        component: Leaderboard,
        props: true,
        redirect: { name: "leaderboard.standings" },
        children: [
          {
            name: "leaderboard.standings",
            path: "standings",
            component: Standings,
            props: true,
          },
          {
            path: "team-standings",
            name: "leaderboard.team-standings",
            component: TeamStandings,
            props: true,
          },
          {
            path: "player-standings",
            name: "leaderboard.player-standings",
            component: PlayerStandings,
            props: true,
          }
        ]
      }
    ]
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router;
