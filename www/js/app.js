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

		// window.plugins.OneSignal.setLogLevel({logLevel: 4, visualLevel: 4});
		
		// var notificationOpenedCallback = function(jsonData) {
		// 	console.log('notificationOpenedCallback: ' + JSON.stringify(jsonData));
		// };

		// window.plugins.OneSignal
		// .startInit("1caec118-7d90-4a79-b810-72be44e9d3ea")
		// .handleNotificationOpened(notificationOpenedCallback)
		// .endInit();
	});
})

.config(function($ionicConfigProvider, $stateProvider, $urlRouterProvider) {

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

	.state('app.stockDetails', {
		url: '/stockDetails/:symbol',
		views: {
			'app-stocks': {
				templateUrl: 'templates/stockDetails.html',
				controller: 'stockDetailsCtrl'
			}
		}
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

	.state('app.cryptoDetails', {
		url: '/cryptoDetails/:symbol',
		views: {
			'app-stocks': {
				templateUrl: 'templates/cryptoDetails.html',
				controller: 'cryptoDetailsCtrl'
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
			'app-profile': {
				templateUrl: 'templates/profile.html',
				controller: 'profileCtrl'
			}
		}
	})

	.state('app.connectProfile', {
		url: '/connectProfile/:id',
		views:{
			'app-connects': {
				templateUrl: 'templates/connectProfile.html',
				controller: 'profileCtrl'
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