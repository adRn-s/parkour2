/**
 * @private
 * @class Ext.draw.sprite.AnimationParser
 *
 * Computes an intermidiate value between two values of the same type for use in animations.
 * Can have pre- and post- processor functions if the values need to be processed
 * before an intermidiate value can be computed (parseInitial), or the computed value
 * needs to be processed before it can be used as a valid attribute value (serve).
 */
Ext.define("Ext.draw.sprite.AnimationParser", function () {
  function compute(from, to, delta) {
    return from + (to - from) * delta;
  }

  return {
    singleton: true,
    attributeRe: /^url\(#([a-zA-Z\-]+)\)$/,
    requires: ["Ext.draw.Color"],

    color: {
      parseInitial: function (color1, color2) {
        if (Ext.isString(color1)) {
          color1 = Ext.util.Color.create(color1);
        }
        if (Ext.isString(color2)) {
          color2 = Ext.util.Color.create(color2);
        }
        if (color1 && color1.isColor && color2 && color2.isColor) {
          return [
            [color1.r, color1.g, color1.b, color1.a],
            [color2.r, color2.g, color2.b, color2.a]
          ];
        } else {
          return [color1 || color2, color2 || color1];
        }
      },
      compute: function (from, to, delta) {
        if (!Ext.isArray(from) || !Ext.isArray(to)) {
          return to || from;
        } else {
          return [
            compute(from[0], to[0], delta),
            compute(from[1], to[1], delta),
            compute(from[2], to[2], delta),
            compute(from[3], to[3], delta)
          ];
        }
      },
      serve: function (array) {
        var color = Ext.util.Color.fly(array[0], array[1], array[2], array[3]);
        return color.toString();
      }
    },

    number: {
      parse: function (n) {
        return n === null ? null : +n;
      },

      compute: function (from, to, delta) {
        if (!Ext.isNumber(from) || !Ext.isNumber(to)) {
          return to || from;
        } else {
          return compute(from, to, delta);
        }
      }
    },

    angle: {
      parseInitial: function (from, to) {
        if (to - from > Math.PI) {
          to -= Math.PI * 2;
        } else if (to - from < -Math.PI) {
          to += Math.PI * 2;
        }
        return [from, to];
      },

      compute: function (from, to, delta) {
        if (!Ext.isNumber(from) || !Ext.isNumber(to)) {
          return to || from;
        } else {
          return compute(from, to, delta);
        }
      }
    },

    path: {
      parseInitial: function (from, to) {
        var fromStripes = from.toStripes(),
          toStripes = to.toStripes(),
          i,
          j,
          fromLength = fromStripes.length,
          toLength = toStripes.length,
          fromStripe,
          toStripe,
          length,
          lastStripe = toStripes[toLength - 1],
          endPoint = [
            lastStripe[lastStripe.length - 2],
            lastStripe[lastStripe.length - 1]
          ];

        for (i = fromLength; i < toLength; i++) {
          fromStripes.push(fromStripes[fromLength - 1].slice(0));
        }
        for (i = toLength; i < fromLength; i++) {
          toStripes.push(endPoint.slice(0));
        }
        length = fromStripes.length;

        toStripes.path = to;
        toStripes.temp = new Ext.draw.Path();

        for (i = 0; i < length; i++) {
          fromStripe = fromStripes[i];
          toStripe = toStripes[i];
          fromLength = fromStripe.length;
          toLength = toStripe.length;
          toStripes.temp.commands.push("M");
          for (j = toLength; j < fromLength; j += 6) {
            toStripe.push(
              endPoint[0],
              endPoint[1],
              endPoint[0],
              endPoint[1],
              endPoint[0],
              endPoint[1]
            );
          }

          lastStripe = toStripes[toStripes.length - 1];
          endPoint = [
            lastStripe[lastStripe.length - 2],
            lastStripe[lastStripe.length - 1]
          ];
          for (j = fromLength; j < toLength; j += 6) {
            fromStripe.push(
              endPoint[0],
              endPoint[1],
              endPoint[0],
              endPoint[1],
              endPoint[0],
              endPoint[1]
            );
          }
          for (i = 0; i < toStripe.length; i++) {
            toStripe[i] -= fromStripe[i];
          }
          for (i = 2; i < toStripe.length; i += 6) {
            toStripes.temp.commands.push("C");
          }
        }

        return [fromStripes, toStripes];
      },

      compute: function (fromStripes, toStripes, delta) {
        if (delta >= 1) {
          return toStripes.path;
        }
        var i = 0,
          ln = fromStripes.length,
          j = 0,
          ln2,
          from,
          to,
          temp = toStripes.temp.params,
          pos = 0;

        for (; i < ln; i++) {
          from = fromStripes[i];
          to = toStripes[i];
          ln2 = from.length;
          for (j = 0; j < ln2; j++) {
            temp[pos++] = to[j] * delta + from[j];
          }
        }
        return toStripes.temp;
      }
    },

    data: {
      compute: function (from, to, delta, target) {
        var lf = from.length - 1,
          lt = to.length - 1,
          len = Math.max(lf, lt),
          f,
          t,
          i;

        if (!target || target === from) {
          target = [];
        }
        target.length = len + 1;

        for (i = 0; i <= len; i++) {
          f = from[Math.min(i, lf)];
          t = to[Math.min(i, lt)];
          if (Ext.isNumber(f)) {
            if (!Ext.isNumber(t)) {
              // This may not give the desired visual result during
              // animation (after all, we don't know what the target
              // value should be, if it wasn't given to us), but it's
              // better than spitting out a bunch of NaNs in the target
              // array, when transitioning from a non-empty to an empty
              // array.
              t = 0;
            }
            target[i] = (t - f) * delta + f;
          } else {
            target[i] = t;
          }
        }

        return target;
      }
    },

    text: {
      compute: function (from, to, delta) {
        return (
          from.substr(0, Math.round(from.length * (1 - delta))) +
          to.substr(Math.round(to.length * (1 - delta)))
        );
      }
    },

    limited: "number",
    limited01: "number"
  };
});
