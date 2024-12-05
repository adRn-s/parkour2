Ext.define("MainHub.view.incominglibrariesvue.IncomingLibrariesVue", {
  extend: "Ext.container.Container",
  xtype: "incoming-libraries-vue",

  layout: "fit",

  initComponent: function () {
    this.callParent(arguments);

    // var homeUrl = window.location.origin;

    this.add({
      xtype: "component",
      html:
        '<iframe src="' +
        'https://parkour-dev.ie-freiburg.mpg.de/vue/incoming_libraries_samples" width="100%" height="100%" frameborder="0"></iframe>'
    });
  }
});
