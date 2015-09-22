/**
 * Responsive carousel fit for asynchronous data
 * @version v0.0.4 - 2015-09-22
 * @link https://github.com/blakeandrewwood/angular-carousel-lite#readme
 * @author Blake Wood
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
/* jshint node: true */
'use strict';

angular
	.module('angularCarouselLite', ['ngTouch'])
	.directive('carouselLite', carouselLite); 

function carouselLite() {

	var directive = {
		restrict: 'E',
		scope: {
			carouselClass: '@carouselClass',
			slideClass: '@slideClass'
		},
		controller: CarouselLiteController,
		controllerAs: 'vm',
		bindToController: true,
		template: '<div id="carousel" class="{{ vm.carouselClass }}"><div id="carousel-track"></div></div>'
	};

	return directive;

}	

CarouselLiteController.$inject = ['$rootScope', '$swipe', '$timeout'];

function CarouselLiteController($rootScope, $swipe, $timeout) {
	/**
	* Configuration 
	*
	*/
	// Scope
	var vm = this;

	// Config
	var resizeTimeout;
	
	// Elements
	var carousel, track;
	
	// Document center position
	var center = 0;
	
	// Data
	var carouselData = {
				position: 0,
				lastPosition: 0,
				numSlides: 0,
				lastScroll: {x: 0},
			},
			mouse = {
				button: null,
				grabbed: {x: 0},
				scroll: {x: 0},
				start: {x: 0},
			};
	
	/**
	* Init 
	*
	*/
	setup();

	/**
	* Setup 
	*
	*/
	function setup() {
		carouselSetup();
		trackSetup();
		calculateWindowCenter();
	}
	
	// Create carousel element
	function carouselSetup() {
		// Get carousel
		carousel = $('#carousel');
		// Carousel styles
		carousel.css({
			'position': 'relative',
			'background-color': '#fff',
			'cursor': 'pointer',
			'overflow-x': 'hidden',
			'overflow-y': 'hidden',
		});
	}
	
	// Create track element
	function trackSetup() {
		// Create track
		track = $('#carousel-track');
		// Track styles
		track.css({
			'position': 'absolute',
			'top': '0',
			'left': '0',
			'height': '100%',
			'white-space': 'nowrap',
			'box-sizing': 'border-box',
		});
	}
	
	// Window resize
	$(window).resize(function() {
		calculateWindowCenter();
		startResizeTimeout();
	});
	
	// Resize timer
	function startResizeTimeout() {
		if(resizeTimeout) $timeout.cancel(resizeTimeout);
		resizeTimeout = $timeout(function() {
			// Scroll back to position
			if(carouselData.numSlides > 0) {
				scrollTo(carouselData.position);
			}
		}, 250);
	}
	
	// Calculate window center
	function calculateWindowCenter() {
		center = Math.floor(window.innerWidth/2);
		calculateTrackCushion();
	}
	
	// Make sure there is always cushion 
	function calculateTrackCushion() {
		var windowWidth = window.innerWidth;
		var trackWidth = track.outerWidth();
		var padding = windowWidth + 200;
		track.css('padding-left', padding + 'px');
		track.css('padding-right', padding + 'px');
	}
	
	/**
	* Slide 
	*
	*/
	// Add slide
	function add(url) {
		preloadImage(url, function() {
			carouselData.numSlides++;
			setupSlide(url);
			broadcastImageLoaded(url);
			// If first append, go to it
			if(carouselData.numSlides == 1){
				$timeout(function() {
					// Force direction to be set as 'next'
					carouselData.lastScroll.x = -Number.MAX_NUMBER;
					carouselData.position = 0;
					scrollTo(carouselData.position);
				}, 800);
			} 
		});
	}
	
	// Preload
	function preloadImage(url, callback) {
		var image = new Image();
		image.src = url;
		image.callback = callback;
		image.onload = function() {
			this.callback();
		};
	}
	
	// Append
	function setupSlide(url) {
		// Append the slide
		var slideHtml = '';
		slideHtml += '<div class="carousel-image ' + vm.slideClass + '">';
		if(url) slideHtml += '<img style="height: 100%;" draggable="false" src="' + url + '">';
		slideHtml += 	'</div>';
		track.append(slideHtml);
		// Setup the slide
		var slide = $('.carousel-image:last');
		// Slide styles
		slide.css({
			'display': 'inline-block',
			'position': 'relative',
			'top': '0',
			'left': '0',
			'opacity': '0.5',
			'height': '100%',
			'vertical-align': 'top',
			'pointer-events': 'none',
			'box-sizing': 'border-box'
		});
	}
	
	/**
	* Scrolling Events
	*
	*/
	// Scroll Next
	function scrollNext() {
		if(carouselData.numSlides > 0 &&
			carouselData.position < carouselData.numSlides - 1) {
			carouselData.lastPosition = carouselData.position;
			carouselData.position++;
			scrollTo(carouselData.position);
		}
	}
	
	// Scroll Prev
	function scrollPrev() {
		if(carouselData.position > 0 ) {
			carouselData.lastPosition = carouselData.position;
			carouselData.position--;
			scrollTo(carouselData.position);
		}
	}
	
	// Scroll To
	function scrollTo(position) {
		var newScrollX = getSlideByPosition(position);
		scrollToPoint(newScrollX);
	}
	
	// Scroll Drag
	function scrollDrag(distance) {
		carousel.scrollLeft(distance);
	}
	
	/**
	* Drag Scrolling 
	*
	*/
	// Find the nearest slide
	function findNearestSlide() {
		// Arrays
		var offsetsPos = [];
		var offsetsNeg = [];
		// Get closest 5 slides so we don't make unnecessary 
		// calculation for every slide
		var positions = [
			carouselData.position - 2,
			carouselData.position - 1,
			carouselData.position - 0,
			carouselData.position + 1,
			carouselData.position + 2,
		];
		angular.forEach(positions, function(position, key) {
			var element = $('.carousel-image').eq(position);
			if(position >= 0 && element.length) {
				console.log(position);
				var offsetCenter = getSlideOffsetCenter(element);
				var data = {index: position, offsetCenter: offsetCenter};
				if(offsetCenter > 0) {
					offsetsPos.push(data);
				} else {
					offsetsNeg.push(data);
				}
			}
		});
		var slide = determineNearestAbsOffset(offsetsPos, offsetsNeg);
		// Set new position and scroll to it
		carouselData.lastPosition = carouselData.position;
		carouselData.position = slide.index;
		scrollTo(carouselData.position);
	}

	// Determine which of the absolute offsets are nearest
	function determineNearestAbsOffset(offsetsPos, offsetsNeg) {
		// Find nearest position
		var min = {};
		min.pos = findMinOffset(offsetsPos);
		min.neg = findMinOffset(offsetsNeg);
		// Determine closest point
		var nearest = null;
		if(min.pos.offsetCenterAbs === null)
			nearest = min.neg;
		else if(min.neg.offsetCenterAbs === null)
			nearest = min.pos;
		else if(min.pos.offsetCenterAbs > min.neg.offsetCenterAbs)
			nearest = min.neg;
		else nearest = min.pos;
		// Return nearest
		return nearest;
	}


	// Get the lowest absolute value
	function findMinOffset(data) {
		var minAbs = null;
		var min = {index: null, offsetCenter: null};
		angular.forEach(data, function(data, key) {
			var offsetCenterAbs = Math.abs(data.offsetCenter);
			// Set min 
			if(offsetCenterAbs < minAbs || minAbs === null) {
				minAbs = offsetCenterAbs;
				min = data;
			}
		});
		// Set min abs
		min.offsetCenterAbs = null;
		if(min.offsetCenter !== null) {
			min.offsetCenterAbs = Math.abs(min.offsetCenter);
		}
		return min;
	}
	
	/**
	* Scrolling Helpers
	*
	*/
	// Get position
	function getSlideByPosition(position) {
		var slide = $('.carousel-image').eq(position);
		var nearest = getSlideOffsetCenter(slide);
		// Return nearest
		return carousel.scrollLeft() + nearest;
	}

	// Set focus
	function setOpacityFocus() {
		var lastSlide = $('.carousel-image').eq(carouselData.lastPosition);
		lastSlide.css('opacity', '0.5');
		var slide = $('.carousel-image').eq(carouselData.position);
		slide.css('opacity', '1');
	}

	// Get direction
	function getDirection() {
		var direction = 'none';
		// Set last position
		if(carouselData.lastPosition < carouselData.position) {
			direction = 'next';
		} 
		else if(carouselData.lastPosition > carouselData.position) {
			direction = 'prev';
		}
		return direction;
	}
	
	// Scroll to a point
	function scrollToPoint(point) {
		preScroll();
		carousel.animate({ scrollLeft: point }, 100, function() {
			var direction = getDirection();
			postScroll(direction);
		});
	}
	
	/**
	* Scrolling Helpers 
	*
	*/
	// Gets the elements center position
	function getSlideOffsetCenter(element) {
		var offset = element.offset().left + element.outerWidth() / 2;
		return offset - center;
	}
	
	/**
	* Mouse Events 
	*
	*/
	track.on("contextmenu",function(){
       return false;
    }); 

	$swipe.bind(track, {
		'start': function(position) {
			mouse.grabbed.x = position.x;
			mouse.start.x = carousel.scrollLeft();
		},
		'move': function(position) {
			calculateScrollDistance(position);
		},
		'end': findNearestSlide,
		'cancel': findNearestSlide
	});

	function calculateScrollDistance(position) {
		var newX = position.x;
		mouse.scroll.x = carousel.scrollLeft();
		mouse.distance = mouse.start.x - newX + mouse.grabbed.x;
		scrollDrag(mouse.distance);
	}
	
	/**
	* Events
	*
	*/
	function preScroll() {
		broadcastPreScroll();
	}
	
	function postScroll(direction) {
		setOpacityFocus();
		// Set this scroll position to last for next event
		carouselData.lastScroll.x = carousel.scrollLeft();
		broadcastPostScroll(direction);
	}

	/**
	* Incomming Broadcast
	*
	*/
	$rootScope.$on('carouselAddSingle', function(event, data) {
		add(data.image);
	});

	$rootScope.$on('carouselAddMany', function(event, data) {
		angular.forEach(data.images, function(image, key) {
			add(image);
		});
	});
	
	$rootScope.$on('carouselNext', function(event, data) {
		scrollNext();
	});
	
	$rootScope.$on('carouselPrev', function(event, data) {
		scrollPrev();
	});

	/**
	* Outgoing Broadcasts 
	*
	*/
	function broadcastImageLoaded(src) {
		$rootScope.$emit('carouselEventImageLoaded', {
			src: src 
		});
	} 

	function broadcastPreScroll() {
		$rootScope.$emit('carouselEventPreScroll', {});
	} 

	function broadcastPostScroll(direction) {
		$rootScope.$emit('carouselEventPostScroll', {
			position: carouselData.position,
			direction: direction 
		});
	} 
}