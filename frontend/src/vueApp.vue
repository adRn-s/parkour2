<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>
<script></script>
<style>
.toast-main {
  position: relative;
  border-radius: 6px;
  display: flex;
  align-items: center;
  min-width: 200px;
  margin-bottom: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.Vue-Toastification__icon {
  margin-left: 15px;
  margin-right: 10px;
}

.Vue-Toastification__toast-body {
  margin-left: 10px;
  margin-right: 15px;
}
</style>
