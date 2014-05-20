/*
 * jQuery threeDeeWorld v0.1 (yes, we need a better name)
 *
 * By Adam Schwartz (adam_s@mit.edu)  >('_')<
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 */


(function($){

    /*

        jQuery Plugin threeDeeWorld

        Kicks everything off
        Does some nice wrapping / .data binding

    */

    var methods,
        pluginName = 'threeDeeWorld',
        defaults = {
            worldSelector: 'body > div:eq(0)',
            threeDeeSelector: '*',
            worldWidth: 'auto',
            worldHeight: 'auto'
        }
    ;

    methods = {

        init: function(opts) {
            return this.each(function(){
                var $el = $(this),
                    options = $.extend({}, defaults, opts)
                ;

                options.planes = [];

                $el.data(pluginName, options);

                if (options.worldWidth === 'auto') {
                    options.worldWidth = parseInt($el.outerWidth(), 10);
                }

                if (options.worldHeight === 'auto') {
                    options.worldHeight = parseInt($el.outerHeight(), 10);
                }

                $el[pluginName]('setupStyles');

                $el[pluginName]('initPlanes');
                $el[pluginName]('initWorld');
                $el[pluginName]('initAnimations');
                $el[pluginName]('initGameLoop');

                options.viewport.camera.update();
            });
        },

        setupStyles: function() {
            if (!$('#threedeeworld-styles').length) {
                $('head').append('' +
                    '<style id="threedeeworld-styles" type="text/css">' +
                        'html, body {' +
                        '    height: 100%;' + // TODO - evaluate if there is an alternative to this
                        '}' +
                        '.threedeeworld-viewport {' +
                        '    position:relative;' +
                        '    float:left;' +
                        '    overflow: hidden;' +
                        '    width:100%;' +
                        '    height:100%;' +
                        '    -webkit-perspective: 700;' +
                        '    -moz-perspective: 700;' +
                        '}' +
                        '.threedeeworld-world {' +
                        '    position: absolute;' +
                        '    -webkit-transform-style: preserve-3d;' +
                        '    -moz-transform-style: preserve-3d;' +
                        '}' +
                        '.threedeeworld-plane {' +
                        '    position: absolute;' +
                        '    -webkit-transform-origin: 0 0 0;' +
                        '    -webkit-backface-visibility: hidden;' +
                        '    -moz-transform-origin: 0 0 0;' +
                        '    -moz-backface-visibility: hidden;' +
                        '}' +
                    '</style>' +
                '');
            }

            return $(this);
        },

        initWorld: function() {
            var $el = $(this), options = $el.data(pluginName);

            options.$viewport = $el;
            options.viewport = new Viewport(options.$viewport.get(0));

            options.$world = $(options.worldSelector);
            options.world = new World(options.$world.get(0), options.viewport);

            return $el;
        },

        initPlanes: function() {
            var $el = $(this), options = $el.data(pluginName), planes = $el.find(options.worldSelector).find(options.threeDeeSelector);

            planes.each(function(){
                var $t = $(this);
                $t.data('original-offset', $t.offset());
                $t.data('original-style', {
                    outerHeight: $t.outerHeight(),
                    outerWidth: $t.outerWidth()
                });
            });

            planes.each(function(){
                var $t = $(this),

                    offset = $t.data('original-offset'),
                    style = $t.data('original-style'),

                    //TODO - generalize please?
                    //plane = new Plane(this, 'transparent', $t.outerWidth(), $t.outerHeight(), $t.offset().left, $t.offset().top, 1000, 0, 0, 0)
                    plane = new Plane(this, style.outerWidth, style.outerHeight, offset.left, offset.top, 0, 0, 0, 0)
                ;

                $t.data('plane', plane);

                $t.data('animator', new Animator(plane));

                options.planes.push(plane);
            });

            return $el;
        },

        initAnimations: function() {
            var $el = $(this), options = $el.data(pluginName);

            $.each(options.planes, function(i, plane){
                var type = plane.node.nodeName.toLowerCase();

                // TODO - finer granulater with settings plz?
                if (type == 'input') {
                    plane.$node
                        // TODO - use event namespacing plz?
                        .bind('keydown', function(e){
                            var $t = $(this);

                            if (e.keyCode === 13) {
                                // TODO - search animation (and callback?)
                            }

                            setTimeout(function(){
                                // TODO - dynamic letter spacing and input width calculation here please?
                                var amount = Math.min(($t.val().length - 10) * 2, 20);

                                plane.animator.animate({
                                    props1: { 'rotation.y': 0 },
                                    props2: { 'rotation.y': amount },
                                    props3: { 'rotation.y': 0 }
                                });

                            }, 10);
                        })
                    ;
                }

                if ($.inArray(type, options.clickAnimationTypes) > -1) {
                    plane.$node
                        // TODO - try jQuery mobile's vmousedown here
                        .bind('mousedown touchstart', function(e){
                            var $t = $(this),
                                x = e.pageX - $t.offset().left,
                                y = e.pageY - $t.offset().top,
                                w = $t.outerWidth(),
                                h = $t.outerHeight(),
                                ry = ((x - (w / 2)) / (w / 2)) * 15,
                                rx = -1 * (((y - (h / 2)) / (h / 2)) * 15),
                                tz = -35
                            ;

                            plane.animator.animate({
                                props1: { 'position.z': 0 },
                                props2: { 'position.z': tz },
                                props3: { 'position.z': 0 }
                            });

                            plane.animator.animate({
                                props1: { 'rotation.y': 0 },
                                props2: { 'rotation.y': ry },
                                props3: { 'rotation.y': 0 }
                            });

                            plane.animator.animate({
                                props1: { 'rotation.x': 0 },
                                props2: { 'rotation.x': rx },
                                props3: { 'rotation.x': 0 }
                            });

                        })
                    ;
                }
            });

            return $el;
        },

        initGameLoop: function() {
            var $el = $(this), options = $el.data(pluginName);

            options.gameLoop = setInterval(function(){

                $.each(options.planes, function(i, plane){
                    plane.animator.update();
                });

                // TODO - allow camera to be controlled by either mousewheel (scroll) or mousemove

                /*
                if (searchedOnce) {
                    var mouseDiff = ($(window).height() / 2) - mouseY;
                    if (mouseDiff > 150 || mouseDiff < -150) {
                        viewport.camera.position.y += ((($(window).height() / 2) - mouseY) * 0.03) ^ 2;
                    }
                    viewport.camera.position.x += (($(window).width() / 2) - mouseX) * 0.01;
                    viewport.camera.rotation.y = (($(window).width() / 2) - mouseX) * -0.05;

                    viewport.camera.position.x = Math.min(Math.max(viewport.camera.position.x, -100), 100);
                    viewport.camera.position.y = Math.min(Math.max(viewport.camera.position.y, -1100), 10);
                    viewport.camera.rotation.y = Math.min(Math.max(viewport.camera.rotation.y, -5), 5);
                }
                */

                options.viewport.camera.update();

            }, 15);

            return $el;
        }
    };

    $.fn[pluginName] = function(options) {
        if (methods[options]) {
            return methods[options].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof options === 'object' || ! options) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('jQuery.' + pluginName + ': Method ' +  options + ' does not exist');
        }
    };


    /*

        jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/

    */

    $.easing['jswing'] = $.easing['swing'];

    $.extend($.easing, {
        def: 'easeOutQuad',
        swing: function (x, t, b, c, d) {
            return $.easing[$.easing.def](x, t, b, c, d);
        },
        easeInQuad: function (x, t, b, c, d) {
            return c*(t/=d)*t + b;
        },
        easeOutQuad: function (x, t, b, c, d) {
            return -c *(t/=d)*(t-2) + b;
        },
        easeInOutQuad: function (x, t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t + b;
            return -c/2 * ((--t)*(t-2) - 1) + b;
        },
        easeInCubic: function (x, t, b, c, d) {
            return c*(t/=d)*t*t + b;
        },
        easeOutCubic: function (x, t, b, c, d) {
            return c*((t=t/d-1)*t*t + 1) + b;
        },
        easeInOutCubic: function (x, t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t + b;
            return c/2*((t-=2)*t*t + 2) + b;
        },
        easeInQuart: function (x, t, b, c, d) {
            return c*(t/=d)*t*t*t + b;
        },
        easeOutQuart: function (x, t, b, c, d) {
            return -c * ((t=t/d-1)*t*t*t - 1) + b;
        },
        easeInOutQuart: function (x, t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
            return -c/2 * ((t-=2)*t*t*t - 2) + b;
        },
        easeInQuint: function (x, t, b, c, d) {
            return c*(t/=d)*t*t*t*t + b;
        },
        easeOutQuint: function (x, t, b, c, d) {
            return c*((t=t/d-1)*t*t*t*t + 1) + b;
        },
        easeInOutQuint: function (x, t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
            return c/2*((t-=2)*t*t*t*t + 2) + b;
        },
        easeInSine: function (x, t, b, c, d) {
            return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
        },
        easeOutSine: function (x, t, b, c, d) {
            return c * Math.sin(t/d * (Math.PI/2)) + b;
        },
        easeInOutSine: function (x, t, b, c, d) {
            return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
        },
        easeInExpo: function (x, t, b, c, d) {
            return (t===0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
        },
        easeOutExpo: function (x, t, b, c, d) {
            return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
        },
        easeInOutExpo: function (x, t, b, c, d) {
            if (t===0) return b;
            if (t==d) return b+c;
            if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
            return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
        },
        easeInCirc: function (x, t, b, c, d) {
            return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
        },
        easeOutCirc: function (x, t, b, c, d) {
            return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
        },
        easeInOutCirc: function (x, t, b, c, d) {
            if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
            return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
        },
        easeInElastic: function (x, t, b, c, d) {
            var s=1.70158;var p=0;var a=c;
            if (t===0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
            if (a < Math.abs(c)) { a=c; s=p/4; }
            else s = p/(2*Math.PI) * Math.asin (c/a);
            return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
        },
        easeOutElastic: function (x, t, b, c, d) {
            var s=1.70158;var p=0;var a=c;
            if (t===0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
            if (a < Math.abs(c)) { a=c; s=p/4; }
            else s = p/(2*Math.PI) * Math.asin (c/a);
            return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
        },
        easeInOutElastic: function (x, t, b, c, d) {
            var s=1.70158;var p=0;var a=c;
            if (t===0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(0.3*1.5);
            if (a < Math.abs(c)) { a=c; s=p/4; }
            else s = p/(2*Math.PI) * Math.asin (c/a);
            if (t < 1) return -0.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
            return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*0.5 + c + b;
        },
        easeInBack: function (x, t, b, c, d, s) {
            if (s === undefined) s = 1.70158;
            return c*(t/=d)*t*((s+1)*t - s) + b;
        },
        easeOutBack: function (x, t, b, c, d, s) {
            if (s === undefined) s = 1.70158;
            return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
        },
        easeInOutBack: function (x, t, b, c, d, s) {
            if (s === undefined) s = 1.70158;
            if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
            return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
        },
        easeInBounce: function (x, t, b, c, d) {
            return c - $.easing.easeOutBounce (x, d-t, 0, c, d) + b;
        },
        easeOutBounce: function (x, t, b, c, d) {
            if ((t/=d) < (1/2.75)) {
                return c*(7.5625*t*t) + b;
            } else if (t < (2/2.75)) {
                return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
            } else if (t < (2.5/2.75)) {
                return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
            } else {
                return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
            }
        },
        easeInOutBounce: function (x, t, b, c, d) {
            if (t < d/2) return $.easing.easeInBounce (x, t*2, 0, c, d) * 0.5 + b;
            return $.easing.easeOutBounce (x, t*2-d, 0, c, d) * 0.5 + c*0.5 + b;
        }
    });

    /*

        ThreeDee "Engine"

        Adapted from Keith Clark:
        http://www.keithclark.co.uk/labs/3dcss/demo/

    */

    // Triplet

    function Triplet(x, y, z) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
    }

    // Viewport

    function Viewport(node) {
        this.node = node;
        this.$node = $(node);
        this.$node.addClass('threedeeworld-viewport');
        this.camera = new Camera();
    }

    // World

    function World(node, viewport) {
        this.node = node;
        this.$node = $(node);
        this.$node.addClass('threedeeworld-world');
        viewport.camera.world = this;
    }

    World.prototype = {
        addPlane: function(plane) {
            this.node.appendChild(plane.node);
        }
    };

    // Camera

    function Camera(world, x, y, z, rx, ry, rz) {
        this.world = world;
        this.position = new Triplet(x, y, z);
        this.rotation = new Triplet(rx, ry, rz);
        this.fov = 0;
    }

    Camera.prototype = {
        update: function() {
            if (this.world) {
                this.world.node.style.cssText=
                    CssUtils.origin(-this.position.x, -this.position.y, -this.position.z) +
                    CssUtils.translate(this.position.x, this.position.y, this.fov, this.rotation.x, this.rotation.y, this.rotation.z);
            }
        }
    };

    // Plane

    function Plane(node, w, h, x, y, z, rx, ry, rz) {
        this.node = node;
        this.$node = $(node);
        this.$node.addClass('threedeeworld-plane');
        //this.color = color;
        this.width = w;
        this.height = h;
        this.position = new Triplet(x, y, z);
        this.rotation = new Triplet(rx, ry, rz);
        this.update();
    }

    Plane.prototype = {
        update: function() {
            this.node.style.cssText +=
                'width:' + this.width + 'px;' +
                'height:' + this.height + 'px;' +
                //'background:' + this.color + ';' +
                CssUtils.originCentered() + //TODO - make this a plane option please?
                CssUtils.translate(this.position.x, this.position.y, this.position.z, this.rotation.x, this.rotation.y, this.rotation.z);
        }
    };

    // CSS Utility Functions

    var CssUtils = (function() {
        var s = document.documentElement.style,
            vendorPrefix =
                (s.WebkitTransform !== undefined && '-webkit-') ||
                (s.MozTransform !== undefined && '-moz-')
        ;

        return {
            translate: function(x, y, z, rx, ry, rz) {
                return vendorPrefix + 'transform:' +
                    'translate3d(' + x + 'px,' + y + 'px,' + z + 'px)' +
                    'rotateX(' + rx + 'deg)' +
                    'rotateY('  +ry + 'deg)' +
                    'rotateZ(' + rz + 'deg);'
                ;
            },
            origin: function(x, y, z) {
                return vendorPrefix + 'transform-origin:' + x + 'px ' + y + 'px ' + z + 'px;';
            },
            originCentered: function() {
                return vendorPrefix + 'transform-origin:50% 50%;';
            }
        };
    }());


    /*

        Animator

        Allow an arbitrary number of simultaneous animations on the same CSS property

    */

    var Animator = function(node) {
        this.init(node);
    };

    Animator.prototype.init = function(node) {
        var a = this;

        a.anim_id = -1;
        a.node = node;
        a.animations = {};
        node.animator = a;
    };

    Animator.prototype.animate = function(options) {
        var a = this;

        a.anim_id += 1;

        var id = this.anim_id,
            o = $.extend({}, {
                durationIn: 200,
                durationOut: 600,
                easingIn: 'easeOutQuart',
                easingOut: 'easeOutQuart',
                killOnComplete: true
            }, options),
            propsA = {}
        ;

        a.animations[id] = {};

        // TODO - try some sort of await deffered pattern here?
        // TODO - allow for recurions / arbitrary nesting

        $(o.props1)
            .stop()
            .animate(o.props2, {
                duration: o.durationIn,
                easing: o.easingIn,
                step: function(now, fx) {
                    a.animations[id][fx.prop] = now;
                },
                complete: function() {
                    $(o.props2)
                        .stop()
                        .animate(o.props3, {
                            duration: o.durationOut,
                            easing: o.easingOut,
                            step: function(now, fx) {
                                a.animations[id][fx.prop] = now;
                            },
                            complete: function() {
                                // TODO - please figure out something better than this...
                                if (o.killOnComplete) {
                                    delete a.animations[id];
                                }
                            }
                        })
                    ;
                }
            })
        ;

        return id;
    };

    Animator.prototype.update = function() {
        var a = this, i, animations, j, property, value, totals = {}, prop_split;

        for (i in this.animations) {
            animations = this.animations[i];
            for (property in animations) {
                value = animations[property];
                if (totals[property]) {
                    totals[property] += value;
                } else {
                    totals[property] = value;
                }
            }
        }

        for (property in totals) {
            value = totals[property];
            // TODO - fix this hack!!!!
            prop_split = property.split('.');
            if (prop_split.length !== 2) {
                return;
            }

            this.node[prop_split[0]][prop_split[1]] = value;
        }

        this.node.update();
    };

})(jQuery);