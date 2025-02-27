/**
 * A sprite that represents a diamond.
 *
 *     @example
 *     Ext.create({
 *        xtype: 'draw',
 *        renderTo: document.body,
 *        width: 600,
 *        height: 400,
 *        sprites: [{
 *            type: 'diamond',
 *            translationX: 100,
 *            translationY: 100,
 *            size: 40,
 *            fillStyle: '#1F6D91'
 *        }]
 *     });
 */
Ext.define("Ext.draw.sprite.Diamond", {
  extend: "Ext.draw.sprite.Path",
  alias: "sprite.diamond",

  inheritableStatics: {
    def: {
      processors: {
        x: "number",
        y: "number",
        /**
         * @cfg {Number} [size=4] The size of the sprite.
         * Meant to be comparable to the size of a circle sprite with the same radius.
         */
        size: "number"
      },
      defaults: {
        x: 0,
        y: 0,
        size: 4
      },
      triggers: {
        x: "path",
        y: "path",
        size: "path"
      }
    }
  },

  updatePath: function (path, attr) {
    var s = attr.size * 1.25,
      x = attr.x - attr.lineWidth / 2,
      y = attr.y;
    path.fromSvgString(["M", x, y - s, "l", s, s, -s, s, -s, -s, s, -s, "z"]);
  }
});
