'use strict';

angular
	.module('demoApp', ['angularCarouselLite'])
	.controller('MainController', MainController);

MainController.$inject = ['$rootScope'];

function MainController($rootScope) {

	var vm = this;

	var numImages = 1;
	var interval = setInterval(function() {
		var image = 'http://lorempixel.com/400/300/animals/' + numImages;
        $rootScope.$broadcast('carouselAddSingle', {image: image});
        numImages++;
        if(numImages > 6) {
        	clearInterval(interval);
        }
	}, 1000);

	// On image load 
    $rootScope.$on('carouselEventImageLoaded', function(event, data) {
    	console.log('Image Loaded');
    });

    // On carousel scroll
    $rootScope.$on('carouselEventPostScroll', function(event, data) {
    	console.log(data);
    });

}
