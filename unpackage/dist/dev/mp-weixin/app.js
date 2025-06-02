"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/login/index.js";
  "./pages/choose-role/index.js";
  "./pages/patient/index.js";
  "./pages/patient/consultation.js";
  "./pages/patient/community.js";
  "./pages/patient/post-create.js";
  "./pages/patient/post-detail.js";
  "./pages/patient/profile.js";
  "./pages/patient/personal-info.js";
  "./pages/patient/medical-records.js";
  "./pages/patient/medical-record-detail.js";
  "./pages/patient/disease-info-input.js";
  "./pages/patient/detection-history.js";
  "./pages/patient/appointment-date.js";
  "./pages/patient/my-appointments.js";
  "./pages/patient/appointment-detail.js";
  "./pages/doctor/appointments.js";
  "./pages/doctor/medical-records.js";
  "./pages/doctor/profile.js";
  "./pages/doctor/patient-list.js";
  "./pages/doctor/personal-info.js";
  "./pages/doctor/workbench.js";
  "./pages/doctor/appointment-detail.js";
  "./pages/doctor/medical-record-detail.js";
  "./pages/patient/ai-assistant.js";
}
const _sfc_main = {
  onLaunch: function() {
    console.log("App Launch");
  },
  onShow: function() {
    console.log("App Show");
  },
  onHide: function() {
    console.log("App Hide");
  }
};
if (!Array) {
  const _component_router_view = common_vendor.resolveComponent("router-view");
  _component_router_view();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {};
}
const App = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
function createApp() {
  const app = common_vendor.createSSRApp(App);
  app.use(common_vendor.uviewPlus);
  app.use(common_vendor.createPinia());
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
