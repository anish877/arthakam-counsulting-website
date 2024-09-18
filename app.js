var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
// playground: stackblitz.com/edit/countup-typescript
var CountUp = /** @class */ (function () {
    function CountUp(target, endVal, options) {
        var _this = this;
        this.endVal = endVal;
        this.options = options;
        this.version = '2.8.0';
        this.defaults = {
            startVal: 0,
            decimalPlaces: 0,
            duration: 2,
            useEasing: true,
            useGrouping: true,
            useIndianSeparators: false,
            smartEasingThreshold: 999,
            smartEasingAmount: 333,
            separator: ',',
            decimal: '.',
            prefix: '',
            suffix: '',
            enableScrollSpy: false,
            scrollSpyDelay: 200,
            scrollSpyOnce: false,
        };
        this.finalEndVal = null; // for smart easing
        this.useEasing = true;
        this.countDown = false;
        this.error = '';
        this.startVal = 0;
        this.paused = true;
        this.once = false;
        this.count = function (timestamp) {
            if (!_this.startTime) {
                _this.startTime = timestamp;
            }
            var progress = timestamp - _this.startTime;
            _this.remaining = _this.duration - progress;
            // to ease or not to ease
            if (_this.useEasing) {
                if (_this.countDown) {
                    _this.frameVal = _this.startVal - _this.easingFn(progress, 0, _this.startVal - _this.endVal, _this.duration);
                }
                else {
                    _this.frameVal = _this.easingFn(progress, _this.startVal, _this.endVal - _this.startVal, _this.duration);
                }
            }
            else {
                _this.frameVal = _this.startVal + (_this.endVal - _this.startVal) * (progress / _this.duration);
            }
            // don't go past endVal since progress can exceed duration in the last frame
            var wentPast = _this.countDown ? _this.frameVal < _this.endVal : _this.frameVal > _this.endVal;
            _this.frameVal = wentPast ? _this.endVal : _this.frameVal;
            // decimal
            _this.frameVal = Number(_this.frameVal.toFixed(_this.options.decimalPlaces));
            // format and print value
            _this.printValue(_this.frameVal);
            // whether to continue
            if (progress < _this.duration) {
                _this.rAF = requestAnimationFrame(_this.count);
            }
            else if (_this.finalEndVal !== null) {
                // smart easing
                _this.update(_this.finalEndVal);
            }
            else {
                if (_this.options.onCompleteCallback) {
                    _this.options.onCompleteCallback();
                }
            }
        };
        // default format and easing functions
        this.formatNumber = function (num) {
            var neg = (num < 0) ? '-' : '';
            var result, x1, x2, x3;
            result = Math.abs(num).toFixed(_this.options.decimalPlaces);
            result += '';
            var x = result.split('.');
            x1 = x[0];
            x2 = x.length > 1 ? _this.options.decimal + x[1] : '';
            if (_this.options.useGrouping) {
                x3 = '';
                var factor = 3, j = 0;
                for (var i = 0, len = x1.length; i < len; ++i) {
                    if (_this.options.useIndianSeparators && i === 4) {
                        factor = 2;
                        j = 1;
                    }
                    if (i !== 0 && (j % factor) === 0) {
                        x3 = _this.options.separator + x3;
                    }
                    j++;
                    x3 = x1[len - i - 1] + x3;
                }
                x1 = x3;
            }
            // optional numeral substitution
            if (_this.options.numerals && _this.options.numerals.length) {
                x1 = x1.replace(/[0-9]/g, function (w) { return _this.options.numerals[+w]; });
                x2 = x2.replace(/[0-9]/g, function (w) { return _this.options.numerals[+w]; });
            }
            return neg + _this.options.prefix + x1 + x2 + _this.options.suffix;
        };
        // t: current time, b: beginning value, c: change in value, d: duration
        this.easeOutExpo = function (t, b, c, d) {
            return c * (-Math.pow(2, -10 * t / d) + 1) * 1024 / 1023 + b;
        };
        this.options = __assign(__assign({}, this.defaults), options);
        this.formattingFn = (this.options.formattingFn) ?
            this.options.formattingFn : this.formatNumber;
        this.easingFn = (this.options.easingFn) ?
            this.options.easingFn : this.easeOutExpo;
        this.startVal = this.validateValue(this.options.startVal);
        this.frameVal = this.startVal;
        this.endVal = this.validateValue(endVal);
        this.options.decimalPlaces = Math.max(0 || this.options.decimalPlaces);
        this.resetDuration();
        this.options.separator = String(this.options.separator);
        this.useEasing = this.options.useEasing;
        if (this.options.separator === '') {
            this.options.useGrouping = false;
        }
        this.el = (typeof target === 'string') ? document.getElementById(target) : target;
        if (this.el) {
            this.printValue(this.startVal);
        }
        else {
            this.error = '[CountUp] target is null or undefined';
        }
        // scroll spy
        if (typeof window !== 'undefined' && this.options.enableScrollSpy) {
            if (!this.error) {
                // set up global array of onscroll functions to handle multiple instances
                window['onScrollFns'] = window['onScrollFns'] || [];
                window['onScrollFns'].push(function () { return _this.handleScroll(_this); });
                window.onscroll = function () {
                    window['onScrollFns'].forEach(function (fn) { return fn(); });
                };
                this.handleScroll(this);
            }
            else {
                console.error(this.error, target);
            }
        }
    }
    CountUp.prototype.handleScroll = function (self) {
        if (!self || !window || self.once)
            return;
        var bottomOfScroll = window.innerHeight + window.scrollY;
        var rect = self.el.getBoundingClientRect();
        var topOfEl = rect.top + window.pageYOffset;
        var bottomOfEl = rect.top + rect.height + window.pageYOffset;
        if (bottomOfEl < bottomOfScroll && bottomOfEl > window.scrollY && self.paused) {
            // in view
            self.paused = false;
            setTimeout(function () { return self.start(); }, self.options.scrollSpyDelay);
            if (self.options.scrollSpyOnce)
                self.once = true;
        }
        else if ((window.scrollY > bottomOfEl || topOfEl > bottomOfScroll) &&
            !self.paused) {
            // out of view
            self.reset();
        }
    };
    /**
     * Smart easing works by breaking the animation into 2 parts, the second part being the
     * smartEasingAmount and first part being the total amount minus the smartEasingAmount. It works
     * by disabling easing for the first part and enabling it on the second part. It is used if
     * useEasing is true and the total animation amount exceeds the smartEasingThreshold.
     */
    CountUp.prototype.determineDirectionAndSmartEasing = function () {
        var end = (this.finalEndVal) ? this.finalEndVal : this.endVal;
        this.countDown = (this.startVal > end);
        var animateAmount = end - this.startVal;
        if (Math.abs(animateAmount) > this.options.smartEasingThreshold && this.options.useEasing) {
            this.finalEndVal = end;
            var up = (this.countDown) ? 1 : -1;
            this.endVal = end + (up * this.options.smartEasingAmount);
            this.duration = this.duration / 2;
        }
        else {
            this.endVal = end;
            this.finalEndVal = null;
        }
        if (this.finalEndVal !== null) {
            // setting finalEndVal indicates smart easing
            this.useEasing = false;
        }
        else {
            this.useEasing = this.options.useEasing;
        }
    };
    // start animation
    CountUp.prototype.start = function (callback) {
        if (this.error) {
            return;
        }
        if (this.options.onStartCallback) {
            this.options.onStartCallback();
        }
        if (callback) {
            this.options.onCompleteCallback = callback;
        }
        if (this.duration > 0) {
            this.determineDirectionAndSmartEasing();
            this.paused = false;
            this.rAF = requestAnimationFrame(this.count);
        }
        else {
            this.printValue(this.endVal);
        }
    };
    // pause/resume animation
    CountUp.prototype.pauseResume = function () {
        if (!this.paused) {
            cancelAnimationFrame(this.rAF);
        }
        else {
            this.startTime = null;
            this.duration = this.remaining;
            this.startVal = this.frameVal;
            this.determineDirectionAndSmartEasing();
            this.rAF = requestAnimationFrame(this.count);
        }
        this.paused = !this.paused;
    };
    // reset to startVal so animation can be run again
    CountUp.prototype.reset = function () {
        cancelAnimationFrame(this.rAF);
        this.paused = true;
        this.resetDuration();
        this.startVal = this.validateValue(this.options.startVal);
        this.frameVal = this.startVal;
        this.printValue(this.startVal);
    };
    // pass a new endVal and start animation
    CountUp.prototype.update = function (newEndVal) {
        cancelAnimationFrame(this.rAF);
        this.startTime = null;
        this.endVal = this.validateValue(newEndVal);
        if (this.endVal === this.frameVal) {
            return;
        }
        this.startVal = this.frameVal;
        if (this.finalEndVal == null) {
            this.resetDuration();
        }
        this.finalEndVal = null;
        this.determineDirectionAndSmartEasing();
        this.rAF = requestAnimationFrame(this.count);
    };
    CountUp.prototype.printValue = function (val) {
        var _a;
        if (!this.el)
            return;
        var result = this.formattingFn(val);
        if ((_a = this.options.plugin) === null || _a === void 0 ? void 0 : _a.render) {
            this.options.plugin.render(this.el, result);
            return;
        }
        if (this.el.tagName === 'INPUT') {
            var input = this.el;
            input.value = result;
        }
        else if (this.el.tagName === 'text' || this.el.tagName === 'tspan') {
            this.el.textContent = result;
        }
        else {
            this.el.innerHTML = result;
        }
    };
    CountUp.prototype.ensureNumber = function (n) {
        return (typeof n === 'number' && !isNaN(n));
    };
    CountUp.prototype.validateValue = function (value) {
        var newValue = Number(value);
        if (!this.ensureNumber(newValue)) {
            this.error = "[CountUp] invalid start or end value: ".concat(value);
            return null;
        }
        else {
            return newValue;
        }
    };
    CountUp.prototype.resetDuration = function () {
        this.startTime = null;
        this.duration = Number(this.options.duration) * 1000;
        this.remaining = this.duration;
    };
    return CountUp;
}());


// Toggle mobile menu
const hamburger = document.getElementById('hamburger');
const menu = document.getElementById('menu');

hamburger.addEventListener('click', () => {
  menu.classList.toggle('show');
});

// Scroll-triggered animations
const sections = document.querySelectorAll('section');

window.addEventListener('scroll', () => {
  sections.forEach(section => {
    const sectionTop = section.getBoundingClientRect().top;
    const triggerPoint = window.innerHeight * 0.8;

    if (sectionTop < triggerPoint) {
      section.classList.add('visible');
    } else {
      section.classList.remove('visible');
    }
  });
});

const countUp1 = new CountUp('CountUp1', 0,{enableScrollSpy: true,duration: 3,onCompleteCallback: ()=>addPlus(0)});
if (!countUp1.error) {
    countUp1.start();
  } else {
    console.error(countUp1.error);
  }
const countUp2 = new CountUp('CountUp2', 0,{enableScrollSpy: true,duration: 3,onCompleteCallback: ()=>addPlus(1)});
if (!countUp2.error) {
    countUp2.start();
} else {
    console.error(countUp2.error);
}
const countUp3 = new CountUp('CountUp3', 0,{enableScrollSpy: true,duration: 3,onCompleteCallback: ()=>addPlus(2)});
if (!countUp3.error) {
    countUp3.start();
    } else {
    console.error(countUp3.error);
    }

function addPlus(index){
    const para = document.querySelectorAll(".specialNumber")[index]
    var text = document.createTextNode("+");
    para.appendChild(text);
}

var cursor = {
    delay: 8,
    _x: 0,
    _y: 0,
    endX: (window.innerWidth / 2),
    endY: (window.innerHeight / 2),
    cursorVisible: true,
    cursorEnlarged: false,
    $dot: document.querySelector('.cursor-dot'),
    $outline: document.querySelector('.cursor-dot-outline'),
    
    init: function() {
        // Set up element sizes
        this.dotSize = this.$dot.offsetWidth;
        this.outlineSize = this.$outline.offsetWidth;
        
        this.setupEventListeners();
        this.animateDotOutline();
    },
    
//     updateCursor: function(e) {
//         var self = this;
        
//         console.log(e)
        
//         // Show the cursor
//         self.cursorVisible = true;
//         self.toggleCursorVisibility();

//         // Position the dot
//         self.endX = e.pageX;
//         self.endY = e.pageY;
//         self.$dot.style.top = self.endY + 'px';
//         self.$dot.style.left = self.endX + 'px';
//     },
    
    setupEventListeners: function() {
        var self = this;
        
        // Anchor hovering
        document.querySelectorAll('a').forEach(function(el) {
            el.addEventListener('mouseover', function() {
                self.cursorEnlarged = true;
                self.toggleCursorSize();
            });
            el.addEventListener('mouseout', function() {
                self.cursorEnlarged = false;
                self.toggleCursorSize();
            });
        });
        
        // Click events
        document.addEventListener('mousedown', function() {
            self.cursorEnlarged = true;
            self.toggleCursorSize();
        });
        document.addEventListener('mouseup', function() {
            self.cursorEnlarged = false;
            self.toggleCursorSize();
        });
  
  
        document.addEventListener('mousemove', function(e) {
            // Show the cursor
            self.cursorVisible = true;
            self.toggleCursorVisibility();

            // Position the dot
            self.endX = e.pageX;
            self.endY = e.pageY;
            self.$dot.style.top = self.endY + 'px';
            self.$dot.style.left = self.endX + 'px';
        });
        
        // Hide/show cursor
        document.addEventListener('mouseenter', function(e) {
            self.cursorVisible = true;
            self.toggleCursorVisibility();
            self.$dot.style.opacity = 1;
            self.$outline.style.opacity = 1;
        });
        
        document.addEventListener('mouseleave', function(e) {
            self.cursorVisible = true;
            self.toggleCursorVisibility();
            self.$dot.style.opacity = 0;
            self.$outline.style.opacity = 0;
        });
    },
    
    animateDotOutline: function() {
        var self = this;
        
        self._x += (self.endX - self._x) / self.delay;
        self._y += (self.endY - self._y) / self.delay;
        self.$outline.style.top = self._y + 'px';
        self.$outline.style.left = self._x + 'px';
        
        requestAnimationFrame(this.animateDotOutline.bind(self));
    },
    
    toggleCursorSize: function() {
        var self = this;
        
        if (self.cursorEnlarged) {
            self.$dot.style.transform = 'translate(-50%, -50%) scale(0.75)';
            self.$outline.style.transform = 'translate(-50%, -50%) scale(1.5)';
        } else {
            self.$dot.style.transform = 'translate(-50%, -50%) scale(1)';
            self.$outline.style.transform = 'translate(-50%, -50%) scale(1)';
        }
    },
    
    toggleCursorVisibility: function() {
        var self = this;
        
        if (self.cursorVisible) {
            self.$dot.style.opacity = 1;
            self.$outline.style.opacity = 1;
        } else {
            self.$dot.style.opacity = 0;
            self.$outline.style.opacity = 0;
        }
    }
}

cursor.init();

window.addEventListener('scroll', function() {
    const myDiv = document.getElementById('dicriptionpara');
    const rect = myDiv.getBoundingClientRect();
    
    // If the div is in the viewport, apply the box-shadow effect
    if (rect.top < window.innerHeight && rect.bottom >= 0) {
        myDiv.classList.add('box-shadow-active');
    } else {
        myDiv.classList.remove('box-shadow-active');
    }
});

function initMap() {
    // Bengaluru map initialization
    var bengaluru = { lat: 12.9716, lng: 77.5946 }; // Replace with your location's coordinates
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: bengaluru
    });
    var marker = new google.maps.Marker({
        position: bengaluru,
        map: map
    });
}

function openLocation(evt, locationName) {
    var i, tabcontent, tablinks;

    // Hide all content
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Remove active class
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab content
    document.getElementById(locationName).style.display = "block";
    evt.currentTarget.className += " active";
}

// Set default tab open
document.getElementById("defaultOpen").click();