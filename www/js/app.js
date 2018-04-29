// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'ngCordova', 'starter.controllers', 'ngSanitize', 'firebase', 'chart.js'])

.run(function($ionicPlatform) {
	$ionicPlatform.ready(function() {
		// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
		// for form inputs)
		if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
			cordova.plugins.Keyboard.disableScroll(true);

		}
		if (window.StatusBar) {
			// org.apache.cordova.statusbar required
			StatusBar.styleDefault();
		}
	});
})

.config(function($ionicConfigProvider, $stateProvider, $urlRouterProvider) {

	// Ionic uses AngularUI Router which uses the concept of states
	// Learn more here: https://github.com/angular-ui/ui-router
	// Set up the various states which the app can be in.
	// Each state's controller can be found in controllers.js

	// Place tabs at bottom
	$ionicConfigProvider.tabs.position('bottom');

	$ionicConfigProvider.views.transition('none');

	// Firebase config
	var config = {
		apiKey: "AIzaSyCwtZH38HrWT4E8x_ldcLWHfv3Eb1ik15o",
		authDomain: "stocksentiment-621f3.firebaseapp.com",
		databaseURL: "https://stocksentiment-621f3.firebaseio.com",
		projectId: "stocksentiment-621f3",
		storageBucket: "stocksentiment-621f3.appspot.com",
		messagingSenderId: "1089293620029"
	};
	firebase.initializeApp(config);

	// messaging.requestPermission().then(function() {
	// 	console.log('Notification permission granted.');
	// 	// TODO(developer): Retrieve an Instance ID token for use with FCM.
	// 	// ...
	// }).catch(function(err) {
	// 	console.log('Unable to get permission to notify.', err);
	// });

	$stateProvider

	.state('login', {
		url: '/login',
		templateUrl: 'templates/login.html',
		controller: 'loginCtrl'
	})

	.state('app', {
		url: '/app',
		abstract: true,
		templateUrl: 'templates/tabs.html',
		controller: 'tabsCtrl'
	})

	.state('app.stocks', {
		url: '/stocks',
		views: {
			'app-stocks': {
				templateUrl: 'templates/stocks.html',
				controller: 'stocksCtrl',
				cache: true,
				reload: false
			}
		},
		cache: true,
		reload: false
	})

	.state('app.crypto', {
		url: '/crypto',
		views: {
			'app-stocks': {
				templateUrl: 'templates/crypto.html',
				controller: 'cryptoCtrl',
				cache: true
			}
		}
	})

	.state('app.watchList', {
		url: '/watchList',
		views:{
			'app-watch': {
				templateUrl: 'templates/watchList.html',
				controller: 'watchListCtrl'
			}
		}
	})


	.state('app.connects', {
		url: '/connects',
		views:{
			'app-connects': {
				templateUrl: 'templates/connects.html',
				controller: 'connectsCtrl'
			}
		}
	})

	.state('app.profile', {
		url: '/profile',
		views:{
			'app-more': {
				templateUrl: 'templates/profile.html'
				// controller: 'connectsCtrl'
			}
		}
	})

	.state('app.connectProfile', {
		url: '/connectProfile/:id',
		views:{
			'app-connects': {
				templateUrl: 'templates/connectProfile.html',
				controller: 'connectProfileCtrl'
			}
		}
	})

	.state('app.privates', {
		url: '/privates',
		views:{
			'app-chats': {
				templateUrl: 'templates/chat/privates.html',
				controller: 'chatsCtrl'
			}
		}
	})

	.state('app.public', {
		url: '/public',
		views:{
			'app-chats': {
				templateUrl: 'templates/chat/public.html',
				controller: 'publicChatCtrl'
			}
		}
	})

	.state('app.chat', {
		url: '/chat/:id/:title',
		views: {
			'app-chats': {
				templateUrl: 'templates/chat/messages.html',
				controller: 'chatCtrl'
			}
		}
	})

	// if none of the above states are matched, use this as the fallback
	$urlRouterProvider.when('', '/login');
	$urlRouterProvider.otherwise('/login');
});