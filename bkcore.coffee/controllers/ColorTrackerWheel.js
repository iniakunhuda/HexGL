// Generated by CoffeeScript 1.7.1

/*
  ColorTrackerWheel (stick + buttons) for touch devices
  Based on the touch demo by Seb Lee-Delisle <http://seb.ly/>
  
  @class bkcore.controllers.ColorTrackerWheel
  @author Thibaut 'BKcore' Despoulain <http://bkcore.com>
 */

(function() {
  var ColorTrackerWheel, Vec2, exports, _base;

  ColorTrackerWheel = (function() {
    ColorTrackerWheel.isCompatible = function() {
      return true;
    };


    /*
      Creates a new ColorTrackerWheel
    
      @param dom DOMElement The element that will listen to touch events
      @param buttonCallback function Callback for non-stick touches
     */

    function ColorTrackerWheel(dom, buttonCallback) {
      this.setupTracker(dom);

      this.dom = dom;
      this.buttonCallback = buttonCallback != null ? buttonCallback : null;
      this.active = true;

      this.videoCenter = new Vec2(dom.offsetWidth/2, dom.offsetHeight/2);
    };

    /*
      @private
     */

    ColorTrackerWheel.prototype.colorFound = function(rects) {
      var blueRects = [],
          redRects = [];
      var maxRedArea = -1,
          maxRedRect,
          maxBlueArea = -1,
          maxBlueRect;

      if (!this.active) {
        return;
      }

      rects.forEach(function(rect) {
        if (rect.color === 'blue') {
          blueRects.push(rect);
        } else if (rect.color === 'red') {
          redRects.push(rect);
        }
      });

      if (blueRects.length < 2) {
        this.colorNotFound();
        return;
      }

      var sortingFunction = function(a, b) {
        return b.width*b.height - a.width*a.height;
      };

      blueRects.sort(sortingFunction);

      redRects.sort(sortingFunction);

      this.drawTrackingFeedback(blueRects, redRects);

      this.updateKeys(blueRects, redRects);
    };

    /*
      @private
     */

    ColorTrackerWheel.prototype.drawTrackingFeedback = function(blueRects, redRects) {
      var rects = [blueRects[0], blueRects[1]];

      if (redRects.length > 0) {
        rects.push(redRects[0]);

        if (redRects.length > 1) {
          rects.push(redRects[1]);
        }
      }

      var context = this.context;
      var self = this;
      context.clearRect (0,0,320,240);

      rects.forEach(function(rect) { self.drawCircle(rect); });
    };

    /*
      @private
     */

    ColorTrackerWheel.prototype.drawCircle = function(rect) {
      var center = new Vec2(rect.x + rect.width/2,
                            rect.y + rect.height/2),
          radius = Math.min(rect.width, rect.height)/2;

      var context = this.context;

      context.save();
      context.fillStyle = rect.color;
      context.beginPath();
      context.moveTo(center.x+radius, center.y);
      context.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
      context.fill();
      context.restore();
    };

    /*
      @private
     */

    ColorTrackerWheel.prototype.updateKeys = function(blueRects, redRects) {
      var blueRect1 = blueRects[0], 
          blueRect2 = blueRects[1];

      if (blueRect1.y > blueRect2.y) {
        var temp = blueRect1;
        blueRect1 = blueRect2;
        blueRect2 = temp;
      }

      var rectCenter = function (rect) {
        return new Vec2(rect.x + rect.width/2, rect.y + rect.height/2);
      };

      var blueCenter1 = rectCenter(blueRect1),
          blueCenter2 = rectCenter(blueRect2),
          diff = blueCenter1.subtract(blueCenter2);
          left = 0,
          right = 0,
          forward = true,
          ltrigger = false,
          rtrigger = false;
          delta = diff.x/diff.norm();

      if (delta > 0.1) {
        left = delta;
      }
      else if (delta < -0.1) {
        right = -delta;
      }

      if (redRects.length > 1) {
        var redCenter1 = rectCenter(redRects[0]),
            redCenter2 = rectCenter(redRects[1]),
            normsRatio = redCenter1.subtract(redCenter2).norm()/diff.norm();

        if (normsRatio > 0.8 && normsRatio < 1.2) {
          forward = false;
        }
      } else if (redRects.length === 1) {
        var redCenter = rectCenter(redRects[0]),
            wheelCenter = new Vec2((blueCenter1.x + blueCenter2.x)/2, (blueCenter1.y+blueCenter2.y)/2),
            normsRatio = redCenter.subtract(wheelCenter).norm()*2/diff.norm();

        if (normsRatio > 0.8 && normsRatio < 1.2) {
          if (redCenter.x > wheelCenter.x) {
            ltrigger = true;
          } else {
            rtrigger = true;
          }
        }
      }

      this.buttonCallback({ left: left, 
                            right: right, 
                            forward: forward, 
                            ltrigger: ltrigger, 
                            rtrigger: rtrigger });
    };


    /*
      @private
     */

    ColorTrackerWheel.prototype.colorNotFound = function() {
      if (!this.active) {
        return;
      }

      this.buttonCallback({ left: false, 
                            right: false, 
                            forward: false, 
                            ltrigger: false, 
                            rtrigger: false });
    };

    /*
      @private
     */

    ColorTrackerWheel.prototype.setupTracker = function(dom) {
      var tracker = new tracking.ColorTracker(),
          self = this;

      tracking.ColorTracker.registerColor('red', function(r,g,b) {
        if (!(r+g+b)) return false;

        var result = 100*r/(r+g+b) > 60 && r > 100;
        return result;
      });

      tracking.ColorTracker.registerColor('blue', function(r,g,b) {
        if (!(r+g+b)) return false;

        var result = 100*r/(r+g+b) < 30 && 100*g/(r+g+b) < 30 && b > 100;
        return result;
      });

      tracker.setColors(['red', 'blue']);

      tracker.on('track', function(event) {
        self.colorFound(event.data);
      });

      this.tracker = tracker;

      var canvas = tracking.one('#trackingFeedbackCanvas');
      this.context = canvas.getContext('2d');

      tracking.track(dom, tracker, { camera: true });
    };


    return ColorTrackerWheel;

  })();


  /*
    Internal class used for vector2
    @class Vec2
    @private
   */

  Vec2 = (function() {
    function Vec2(x, y) {
      this.x = x != null ? x : 0;
      this.y = y != null ? y : 0;
    }

    Vec2.prototype.subtract = function(vec) {
      return new Vec2(this.x - vec.x, this.y - vec.y);
    };

    Vec2.prototype.norm = function() {
      return Math.sqrt(this.x*this.x + this.y*this.y);
    };

    return Vec2;

  })();


  /*
    Exports
    @package bkcore
   */

  exports = exports != null ? exports : this;

  exports.bkcore || (exports.bkcore = {});

  (_base = exports.bkcore).controllers || (_base.controllers = {});

  exports.bkcore.controllers.ColorTrackerWheel = ColorTrackerWheel;

}).call(this);
