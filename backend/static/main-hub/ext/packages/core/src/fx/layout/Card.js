/**
 * @private
 */
Ext.define("Ext.fx.layout.Card", {
  requires: [
    "Ext.fx.layout.card.Slide",
    "Ext.fx.layout.card.Cover",
    "Ext.fx.layout.card.Reveal",
    "Ext.fx.layout.card.Fade",
    "Ext.fx.layout.card.Flip",
    "Ext.fx.layout.card.Pop",
    //        'Ext.fx.layout.card.Cube',
    "Ext.fx.layout.card.Scroll"
  ],

  constructor: function (config) {
    var defaultClass = Ext.fx.layout.card.Abstract,
      type;

    if (!config) {
      return null;
    }

    if (typeof config == "string") {
      type = config;

      config = {};
    } else if (config.type) {
      type = config.type;
    }

    config.elementBox = false;

    if (type) {
      defaultClass = Ext.ClassManager.getByAlias("fx.layout.card." + type);

      //<debug>
      if (!defaultClass) {
        Ext.Logger.error("Unknown card animation type: '" + type + "'");
      }
      //</debug>
    }

    return Ext.factory(config, defaultClass);
  }
});
