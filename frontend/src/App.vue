<template>
  <router-view class="main-wrap" />
</template>

<script>

export default {
  name: 'App',
};
</script>

<style lang="scss">
.v-data-table tr:nth-child(odd) {
  background: $second-tone;
}

.v-data-table tr:nth-child(even) {
  background: $first-tone;
}

.theme--dark.v-toolbar.v-sheet {
  background: $first-tone !important;
}

.primary-background {
  background: $primary;
}

.first-tone-background {
  background-color: $first-tone;
}

.second-tone-background {
  background-color: $second-tone;
}

.third-tone-background {
  background-color: $third-tone;
}

.title-toolbar {
  height: 64px;
  background-color: $first-tone;
  font-size: 1.1em;
  line-height: 64px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  padding: 0 30px;
}

.list-item {
  min-height: 48px;
  background-color: $first-tone;
  font-size: 1.0em;
  line-height: 48px;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 30px;
}

.page-nav {
  background-color: transparent;
  height: 60px;
}

.page-wrap {
  max-width: 1200px;
  margin: auto;
}

.content-wrap {
  background: $background;
  box-shadow: 0 0 30px #00000030;
  border-radius: 5px;
}

.link-container {
  display: inline-block;
  margin: auto;
  height: 100%;
  vertical-align: baseline;
  display: flex;
}

.nav-link {
  padding: 0 40px;
  color: white !important;
  text-decoration: none;
  align-self: end;
  line-height: 60px;
  height: 60px;
}

.page-nav .router-link-active {
  background-color: $background;
  box-shadow: 0 -9px 20px #00000060;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  height: 70px;
  margin-bottom: -10px;
}

.subnav {
  height: 55px;
  display: flex;
  align-items: end;
  justify-content: center;
  padding: 0 30px;
  // background: #ffffff50;
}

.subnav-link {
  padding: 0 20px;
  color: white !important;
  text-decoration: none;
  padding-bottom: 10px;
}

.subnav-link.router-link-active {
  border-bottom: 2px solid $primary;
  padding-bottom: 8px;
}

.page-header {
  height: 80px;
  color: white;
  // background: $third-tone;
  text-transform: capitalize;
}

.page-header {
  display: flex;
}

.page-header .page-title {
  width: 100%;
  align-self: center;
  text-align: center;
  font-size: 2em !important;
}

body {
  background: black;
}

#app {
  background: $page-bg;
}

.main-wrap.v-application a {
  color: $primary-link;
  text-decoration: none;
}
</style>