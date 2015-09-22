'use strict';

angular
	.module('demoApp', ['angularCarouselLite'])
	.controller('MainController', MainController);

MainController.$inject = ['$rootScope'];

function MainController($rootScope) {

	var vm = this;
    vm.position = 1;
	vm.numImages = 1;

	var interval = setInterval(function() {
		var image = 'http://lorempixel.com/400/300/animals/' + vm.numImages;
        $rootScope.$broadcast('carouselAddSingle', {image: image});
        vm.numImages++;
        if(vm.numImages > 6) {
        	clearInterval(interval);
        }
	}, 1000);

	// On image load 
    $rootScope.$on('carouselEventImageLoaded', function(event, data) {
    	console.log('Image Loaded');
    });

    // On carousel scroll
    $rootScope.$on('carouselEventPostScroll', function(event, data) {
        vm.position = data.position;
        console.log(data);
    });

}
