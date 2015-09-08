/**
 * Responsive carousel fit for asynchronous data
 * @version v0.0.2 - 2015-09-08
 * @link https://github.com/blakeandrewwood/angular-carousel-lite#readme
 * @author Blake Wood
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
/* jshint node: true */

'use strict';
angular.module('angularCarouselLite', []);

/* jshint node: true */

'use strict';
angular.module('angularCarouselLite')
.directive('carouselLite', ['$timeout', function ($timeout) {
	return {
		restrict: 'E',
		scope: {
			carouselClass: '=carouselClass',
			slideClass: '=slideClass'
		},
		link: function postLink(scope, element, attrs) {
			
			/**
			* Configuration 
			*
			*/

			// Config
			var carouselClass = attrs.carouselClass;
			var slideClass = attrs.slideClass;
			var resizeTimeout;
			
			// Elements
			var carousel,
					track;
			
			// Document center position
			var center = 0;
			
			// Data
			var carouselData = {
						position: -1,
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
				// Create carousel
				element.append(
					'<div id="carousel" class="' + carouselClass + '">' +
					'</div>'
				);
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
				carousel.append('<div id="carousel-track"></div>');
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
					if(carouselData.numSlides > 0) scrollTo(carouselData.position);
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
								carouselData.lastScroll.x = -9999;
								scrollTo(0);
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
				slideHtml += '<div class="carousel-image ' + slideClass + '">';
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
					'height': '100%',
					'vertical-align': 'top',
					'pointer-events': 'none',
					'box-sizing': 'border-box'
				});
				// Position
				var position = slide.position();
				var offset = slide.offset();
				// Size
				var width = slide.outerWidth();
				var height = slide.outerHeight();
				// Center
				var centerX = width / 2;
				var centerY = height / 2;
				var centerDiv = slide.find('.image-center:first')
					.css({top: centerY - 40, left: centerX - 40});
			}
			
			/**
			* Scrolling Events
			*
			*/

			// Scroll Next
			function scrollNext() {
				if(carouselData.numSlides > 0 &&
					carouselData.position < carouselData.numSlides - 1) {
					var newPosition = carouselData + 1;
					scrollTo(newPosition);
				}
			}
			
			// Scroll Prev
			function scrollPrev() {
				if(carouselData.position > 0 ) {
					var newPosition = carouselData - 1;
					scrollTo(newPosition);
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
			* Scrolling 
			*
			*/

			// Find the nearest slide
			function findNearestSlide(center) {
				// Arrays
				var offsetsPos = [];
				var offsetsNeg = [];

				// Calculate all offsets
				$('.carousel-image').each(function() {
					var self = $(this);
					var offsetCenter = getSlideOffsetCenter(self);
					if(offsetCenter > 0) {
						offsetsPos.push(offsetCenter);
					} else {
						offsetsNeg.push(offsetCenter);
					}
				});

				// Find nearest position
				var minPos = Array.absMin(offsetsPos);
				var minNeg = Array.absMin(offsetsNeg);
				var nearest = (minPos > minNeg) ? -minNeg : minPos;

				// Scroll to nearest
				var newScrollX = carousel.scrollLeft() + nearest;
				scrollToPoint(newScrollX);
			}
			
			// Get position
			function getSlideByPosition(position) {
				var slide = $('.carousel-image').eq(position);
				var nearest = getSlideOffsetCenter(slide);
				// Return nearest
				return carousel.scrollLeft() + nearest;
			}
			
			// Scroll to a point
			function scrollToPoint(point) {
				preScroll();
				carousel.animate({ scrollLeft: point }, 100, function() {
					var direction = getDirection();
					postScroll(direction);
				});
			}

			function getDirection() {
				var direction = 'none';
				if(carouselData.lastScroll.x < carousel.scrollLeft()) {
					direction = 'next';
					carouselData.position++;
				} 
				else if(carouselData.lastScroll.x > carousel.scrollLeft()) {
					direction = 'prev';
					carouselData.position--;
				}
				return direction;
			}
			
			/**
			* Scrolling Helpers 
			*
			*/

			// Get smallest number
			Array.absMin = function(array) {
				return Math.min.apply(Math, array.map(Math.abs));
			};
			
			// Gets the elements center position
			function getSlideOffsetCenter(element) {
				var offset = element.offset().left + element.outerWidth() / 2;
				return offset - center;
			}
			
			/**
			* Mouse Events 
			*
			*/

			// On Mouse Down 
			track.mousedown(function(e) {
				if(e.button === 0) {
					mouse.button = 0;
					mouse.grabbed.x = e.pageX;
					mouse.start.x = carousel.scrollLeft();
				} else {
					mouse.button = null;
				}
			});
			
			// On Document Mouse up
			$(document).mouseup(function(e) {
				mouse.button = null;
			});

			// On Track Mouse up
			track.mouseup(function(e) {
				findNearestSlide(center);
			});
			
			// On Mouse move
			track.mousemove(function(e) {
				if(mouse.button === 0) {
					var newX = e.pageX;
					mouse.scroll.x = carousel.scrollLeft();
					mouse.distance = mouse.start.x - newX + mouse.grabbed.x;
					scrollDrag(mouse.distance);
				}
			});
			
			/**
			* Events
			*
			*/

			function preScroll() {
				broadcastPreScroll();
			}
			
			function postScroll(direction) {
				// Set this scroll position to last for next event
				carouselData.lastScroll.x = carousel.scrollLeft();
				broadcastPostScroll(direction);
			}

			/**
			* Incomming Broadcast
			*
			*/

			scope.$on('carouselAdd', function(event, data) {
				add(data.image);
			});
			
			scope.$on('carouselNext', function(event, data) {
				scrollNext();
			});
			
			scope.$on('carouselPrev', function(event, data) {
				scrollPrev();
			});

			/**
			* Outgoing Broadcasts 
			*
			*/

			function broadcastImageLoaded(src) {
				scope.$emit('carouselEventImageLoaded', {
					src: src 
				});
			} 

			function broadcastPreScroll() {
				scope.$emit('carouselEventPreScroll', {});
			} 

			function broadcastPostScroll(direction) {
				scope.$emit('carouselEventPostScroll', {
					position: carouselData.position,
					direction: direction 
				});
			} 
			
		}
	};
}]);

