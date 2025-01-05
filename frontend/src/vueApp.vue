<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>
<script></script>
<style>
.Vue-Toastification__toast {
  position: relative;
  border-radius: 6px;
  border: 2px solid #333333;
  display: flex;
  align-items: center;
  min-width: 200px;
  padding: 20px;
  padding-right: 8px;
  margin-bottom: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.Vue-Toastification__icon {
  margin-right: 10px;
}

.Vue-Toastification__toast-body {
  margin-right: 10px;
  font-size: 14px !important;
  font-weight: 550;
}

.Vue-Toastification__close-button {
  padding: 3px 8px;
}

.Vue-Toastification__toast--info .Vue-Toastification__icon,
.Vue-Toastification__toast--info .Vue-Toastification__toast-body,
.Vue-Toastification__toast--info .Vue-Toastification__close-button {
  color: #ffffffe5;
}

.Vue-Toastification__toast--success .Vue-Toastification__icon,
.Vue-Toastification__toast--success .Vue-Toastification__toast-body,
.Vue-Toastification__toast--success .Vue-Toastification__close-button {
  color: #ffffffe5;
}

.Vue-Toastification__toast--warning .Vue-Toastification__icon,
.Vue-Toastification__toast--warning .Vue-Toastification__toast-body,
.Vue-Toastification__toast--warning .Vue-Toastification__close-button {
  color: #333333e1;
}

.Vue-Toastification__toast--error .Vue-Toastification__icon,
.Vue-Toastification__toast--error .Vue-Toastification__toast-body,
.Vue-Toastification__toast--error .Vue-Toastification__close-button {
  color: #ffffffe5;
}
</style>
