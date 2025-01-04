<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>
<script></script>
<style>
.toast-main {
  position: relative;
  border-radius: 6px !important;
  border: 2px solid #333333 !important;
  display: flex;
  align-items: center;
  min-width: 200px;
  padding: 15px !important;
  margin-bottom: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.Vue-Toastification__icon {
  margin-right: 10px;
}

.Vue-Toastification__toast-body {
  margin-right: 20px;
  color: #ffffffe5;
  font-weight: 550;
}

.Vue-Toastification__close-button {
  padding: 3px 8px;
}
</style>
