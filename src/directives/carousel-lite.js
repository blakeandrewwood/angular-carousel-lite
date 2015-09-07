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
						lastPosition: -1,
						numSlides: 0,
					},
					mouse = {
						button: null,
						grabbed: {x: 0},
						scroll: {x: 0},
						start: {x: 0},
					};
			
			// Speed test
			var time = {
				start: 0,
				end: 0,
			};
			
			/**
			* Init 
			*/
			setup();
			
			/**
			* Setup 
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
					'width': '90%',
					'height': '200px',
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
			* Methods 
			*/
			function add(url) {
				
				preloadImage(url, function() {
					carouselData.numSlides++;
					setupSlide(url);
					// If first append, go to it
					if(carouselData.numSlides == 1){
						$timeout(function() {
								carouselData.position = 0;
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
			* Incomming Broadcast
			*/
			// Add image
			scope.$on('carouselAdd', function(event, data) {
				add(data.image);
			});
			
			// Scroll next
			scope.$on('carouselNext', function(event, data) {
				scrollNext();
			});
			
			// Scroll prev
			scope.$on('carouselPrev', function(event, data) {
				scrollPrev();
			});
			
			/**
			* Mouse Events 
			*/
			// Mouse Down 
			track.mousedown(function(e) {
				if(e.button === 0) {
					mouse.button = 0;
					mouse.grabbed.x = e.pageX;
					mouse.start.x = carousel.scrollLeft();
				} else {
					mouse.button = null;
				}
			});
			
			// Mouse up
			$(document).mouseup(function(e) {
				mouse.button = null;
			});
			track.mouseup(function(e) {
				findNearestSlide(center);
			});
			
			// Mouse move
			track.mousemove(function(e) {
				if(mouse.button === 0) {
					var newX = e.pageX;
					mouse.scroll.x = carousel.scrollLeft();
					mouse.distance = mouse.start.x - newX + mouse.grabbed.x;
					scrollDrag(mouse.distance);
				}
			});
			
			/**
			* Scrolling Events
			*/
			// Scroll Next
			function scrollNext() {
				if(carouselData.numSlides > 0 &&
					carouselData.position < carouselData.numSlides - 1) {
					carouselData.position++;
					scrollTo(carouselData.position, 'next');
				}
			}
			
			// Scroll Prev
			function scrollPrev() {
				if(carouselData.position > 0 ) {
					carouselData.position--;
					scrollTo(carouselData.position, 'prev');
				}
			}
			
			// Scroll To
			function scrollTo(position, direction) {
				var newScrollX = getSlideByPosition(carouselData.position);
				scrollToPoint(newScrollX, direction);
			}
			
			// Scroll Drag
			function scrollDrag(distance) {
				carousel.scrollLeft(distance);
			}
			
			/**
			* Scrolling 
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
				var direction = (minPos > minNeg) ? 'prev' : 'next';
				// Increase or decrease position
				if(direction == 'next') {
					carouselData.position++;
				} else {
					carouselData.position--;
				}
				// Scroll to nearest
				var newScrollX = carousel.scrollLeft() + nearest;
				scrollToPoint(newScrollX, direction);
			}
			
			// Get position
			function getSlideByPosition(position) {
				var slide = $('.carousel-image').eq(position);
				var nearest = getSlideOffsetCenter(slide);
				// Return nearest
				return carousel.scrollLeft() + nearest;
			}
			
			// Scroll to a point
			function scrollToPoint(point, direction) {
				preScroll(direction);
				carousel.animate({ scrollLeft: point }, 100, function() {
					postScroll(direction);
				});
			}
			
			/**
			* Scrolling Helpers 
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
			* Events
			*/
			// Pre scroll
			function preScroll(direction) {
				carouselData.lastPosition = carouselData.position - 1;
			}
			
			// Post scroll
			function postScroll(direction) {
				//
			}
			
			/**
			* Arrangment 
			*/
			// Arrange first to last 
			function moveFirstBeforeLast() {
				$('.carousel-image:first').before($('.carousel-image:last'));
			}
			
			// Arrange last to first 
			function moveLastAfterFirst() {
				$('.carousel-image:last').after($('.carousel-image:first'));
			}
			
			/**
			* Speed test 
			*/
			function startTime() {
				var newTime = new Date();
				time.start = newTime.getMilliseconds();
			}
			
			function endTime() {
				var newTime = new Date();
				time.end = newTime.getMilliseconds();
			}
			
			function getTimeElapsed() {
				return time.end - time.start;
			}
			
		}
	};
}]);

