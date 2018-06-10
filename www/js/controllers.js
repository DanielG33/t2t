angular.module('starter.controllers', [])

.controller('tabsCtrl', function($scope, $ionicActionSheet, $firebaseAuth, $location) {

	// With the new view caching in Ionic, Controllers are only called
	// when they are recreated or on app start, instead of every page change.
	// To listen for when this page is active (for example, to refresh data),
	// listen for the $ionicView.enter event:
	//$scope.$on('$ionicView.enter', function(e) {
	//});
})

.controller('loginCtrl', function($scope, $location, $ionicModal, $firebaseAuth) {

	$scope.openBrowser = function(link){
		cordova.InAppBrowser.open(link,'_blank','location=yes'); 
	};

	$scope.$on('$ionicView.enter', function(e) {
		var authObj = $firebaseAuth();
		authObj.$signOut();
	});

	$scope.loginData = {};
	$scope.signupData = {};
	var authObj = $firebaseAuth();

	$scope.doLogin = function(user, pass){
		if(!user){
			user = $scope.loginData.email;
		}
		if(!pass){
			pass = $scope.loginData.pass;
		}

		authObj.$signInWithEmailAndPassword(user, pass).then(function(firebaseUser) {
			$location.path('/app/stocks');
		}).catch(function(error) {
			console.error("Authentication failed:", error);
			alert(error.message);
		});
	}

	$scope.signup = function(){
		if($scope.signupData.pass != $scope.signupData.confirm){
			alert('Password doesn\'t match!');
		}else{
			createUser();
		}
	}

	function createUser(){
		authObj.$createUserWithEmailAndPassword($scope.signupData.email, $scope.signupData.pass).then(function(firebaseUser) {
			console.log("User " + firebaseUser.uid + " created successfully!");
			var newUser = firebase.database().ref('users/'+firebaseUser.uid);
			var data = {
				firstName: $scope.signupData.firstName,
				lastName: $scope.signupData.lastName,
				name: $scope.signupData.firstName+' '+$scope.signupData.lastName,
				email: $scope.signupData.email,
				country: $scope.signupData.country,
				exp: $scope.signupData.exp,
				gender: $scope.signupData.gender
			}
			newUser.set(data);
			$scope.modal.hide();
			$location.path('/app/stocks');

		}).catch(function(error) {
			console.error("Error: ", error);
		});
	}

	$ionicModal.fromTemplateUrl('signup.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.modal = modal;
	});
})

.controller('stocksCtrl', function($scope, $location, $anchorScroll, $http, $ionicModal, $ionicPopover, $firebaseArray, $firebaseObject, $firebaseAuth) {

	var authObj = $firebaseAuth();
	var uid;
	var name;
	var date = new Date();
	var date = String(date.getFullYear()) + String(date.getMonth()+1) + String(date.getDate());

	$scope.ratingText = ['Short', 'Sell', 'Hold', 'Buy', 'Strong Buy'];
	$scope.rating = {};

	var ratings = firebase.database().ref('ratings/');
		ratings = $firebaseObject(ratings);
		ratings.$loaded().then(function(){
		$scope.ratings = ratings;
		console.log(ratings);
	})


	authObj.$onAuthStateChanged(function(firebaseUser) {
		if (firebaseUser) {
			uid = firebaseUser.uid;
			var user = firebase.database().ref('users/'+uid+'/name');
			user.on("value", function(snapshot) {
				name = snapshot.val();
			})
		}
	})

	$scope.data = {};
	$scope.filtered = {};
	$scope.fav = false;
	$scope.stocks = [];
	// $scope.ratings = [];
	$scope.symbols = [];
	$scope.display = 19;
	var stocks;

  $scope.data.filtered = [];

  $http.get('https://api.iextrading.com/1.0/ref-data/symbols').then(function(res){
    for (var i = 0; i <= res.data.length - 1; i++) {

      var stock = {
        symbol: res.data[i].symbol,
        name: res.data[i].name
      }
      $scope.symbols.push(stock);
      $scope.data.filtered.push(stock);
    }

    displayFirst();
  })

  $scope.showMore = function(){

    for (var i = $scope.display - 1; i <= $scope.display + 19; i++) {
      $http.get('https://api.iextrading.com/1.0/stock/'+$scope.symbols[i].symbol+'/quote').then(function(res){

        stock = {
          symbol: res.data.symbol,
          companyName: res.data.companyName,
          latestPrice: res.data.latestPrice,
          changePercent: res.data.changePercent
        }
        $scope.stocks.push(res.data);
      })
    }

    $scope.display += 20;
  }

  $scope.filterStocks = function(){
    $scope.display = 20;
    $scope.stocks = [];

    console.log($scope.data.filtered);

    for (var i = 0; i <= $scope.display - 1; i++) {
    	if($scope.data.filtered[i]){
		    $http.get('https://api.iextrading.com/1.0/stock/'+$scope.data.filtered[i].symbol+'/quote').then(function(res){
		    	stock = {
		        symbol: res.data.symbol,
		        companyName: res.data.companyName,
		        latestPrice: res.data.latestPrice,
		        changePercent: res.data.changePercent,
		        rating: 0
		      }
		      $scope.stocks.push(stock);
		    })
    	}
    }
  }

	function displayFirst(){
		var ratings = [];
		for (var i = 0; i <= 19; i++) {
			$http.get('https://api.iextrading.com/1.0/stock/'+$scope.symbols[i].symbol+'/quote').then(function(res){
				var ratingScore = 0;
				var todayRatingScore = 0;

				stock = {
					symbol: res.data.symbol,
					companyName: res.data.companyName,
					latestPrice: res.data.latestPrice,
					changePercent: res.data.changePercent
				}
				$scope.stocks.push(stock);
			})
		}
	}


	$ionicModal.fromTemplateUrl('settings.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.settings = modal;
	});
})

.controller('stockDetailsCtrl', function($scope, $stateParams, $ionicHistory, $filter, $http, $firebaseArray, $firebaseObject, $firebaseAuth, $ionicModal){

	$scope.goBack = function(){
		$ionicHistory.goBack();
	}

	$scope.openBrowser = function(link){
		cordova.InAppBrowser.open(link,'_blank','location=yes'); 
	};

	var symbol = $stateParams.symbol;

	var authObj = $firebaseAuth();
	var uid;
	var date = new Date();
	var date = String(date.getFullYear()) + String(date.getMonth()+1) + String(date.getDate());

	$scope.ratingText = ['Short', 'Sell', 'Hold', 'Buy', 'Strong Buy'];

	$scope.rating = {
		stars: 5,
		comment: '',
		chart: [0, 0, 0, 0, 0]
	};

	authObj.$onAuthStateChanged(function(firebaseUser) {
		if (firebaseUser) {
			uid = firebaseUser.uid;
			var user = firebase.database().ref('users/'+uid+'/name');
			user.on("value", function(snapshot) {
				name = snapshot.val();
			})
			var fav = firebase.database().ref('users/'+uid+'/watchlist/stocks/'+symbol);
			fav.on("value", function(snapshot) {
				$scope.fav = snapshot.val();
			})
		}
	})

	$scope.chart = {
		data: [],
		labels: [],
		range: '1d',
		shownItems: 10,
		shownRange: 0,
		ranges: [
			'1d',
			'1m',
			'3m',
			'6m',
			'ytd',
			'1y',
			'2y',
			'5y'
		],
		points: {},
		series: [
			'High',
			'Low',
			'Open',
			'Close'
		],
		rangeLabels: {
			'1d': [],
			'1m': [],
			'3m': [],
			'6m': [],
			'ytd': [],
			'1y': [],
			'2y': [],
			'5y': []
		},
		datasetOverride: [
			{
				fill: false,
				borderWidth: 1,
				// borderColor: '#f2f2f2',
				pointRadius: 1
			},
			{
				fill: false,
				borderWidth: 1,
				// borderColor: '#f2f2f2',
				pointRadius: 1
			},
			{
				fill: false,
				borderWidth: 1,
				// borderColor: '#f2f2f2',
				pointRadius: 1
			},
			{
				fill: false,
				borderWidth: 1,
				// borderColor: '#f2f2f2',
				pointRadius: 1
			}
		]
		,
		options: {
			animation: {
				duration: 0
			},
			scales: {
				yAxes: [{
					stacked: false,
					display: true
				}],
				xAxes: [{
					stacked: false,
					display: true
				}]
			},
			legend: {
				display: true,
				labels: {
					boxWidth: 20,
					fontColor: '#f2f2f2'
				}
			}
		}
	};

	for (var i = 0; i <= $scope.chart.ranges.length - 1; i++) {
		getData($scope.chart.ranges[i]);
	}
	
	$scope.showData = function(range){
		if(range){
			$scope.chart.range = range;
		}else{
			range = $scope.chart.range;
		}

		if($scope.chart.shownRange >= $scope.chart.rangeLabels[$scope.chart.range].length - $scope.chart.shownItems){
			$scope.chart.shownRange = $scope.chart.rangeLabels[$scope.chart.range].length - $scope.chart.shownItems;
		}

		$scope.chart.data[0] = $filter('limitTo')($scope.chart.points[range][0], $scope.chart.shownItems, $scope.chart.shownRange);
		$scope.chart.data[1] = $filter('limitTo')($scope.chart.points[range][1], $scope.chart.shownItems, $scope.chart.shownRange);
		$scope.chart.data[2] = $filter('limitTo')($scope.chart.points[range][2], $scope.chart.shownItems, $scope.chart.shownRange);
		$scope.chart.data[3] = $filter('limitTo')($scope.chart.points[range][3], $scope.chart.shownItems, $scope.chart.shownRange);
		// $scope.chart.data = $scope.chart.points[range];
		$scope.chart.labels = $filter('limitTo')($scope.chart.rangeLabels[range], $scope.chart.shownItems, $scope.chart.shownRange);

		// console.log($scope.chart.shownItems, $scope.chart.shownRange);
		// console.log($scope.chart.points[range]);
	}

	$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/company').then(function(res){
		$scope.company = res.data;
	});
	$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/quote').then(function(res){
		$scope.quote = res.data;
	});
	$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/stats').then(function(res){
		$scope.stats = res.data;
	});

	var comments = firebase.database().ref('comments/'+symbol);
	comments = $firebaseArray(comments);

	comments.$watch(function(){
		$scope.comments = comments;
	})

	var rates = firebase.database().ref('ratings/'+symbol+'/'+date);
	rates = $firebaseArray(rates);

	rates.$watch(function(){
		// $scope.rating.chart = [0, 0, 0, 0, 0];
		rates.forEach(function (obj) {
			$scope.rating.chart[obj.$value - 1] ++;
			console.log($scope.rating.chart);
		})
	})

	function getData(index){
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/chart/'+index).then(function(res){
			var high = [], low = [], open = [], close = [];
			for (var x = 0; x <= res.data.length - 1; x ++) {
				high.push(res.data[x].high);
				low.push(res.data[x].low);
				open.push(res.data[x].open);
				close.push(res.data[x].close);
				$scope.chart.rangeLabels[index].push(res.data[x].label);
			}
			$scope.chart.points[index] = [high, low];
			if(open){
				$scope.chart.points[index].push(open);
				$scope.chart.points[index].push(close);
			}
			if(index == '1d'){
				$scope.showData('1d');
			}
		});
	}

	$scope.add = function(){
		var fav = firebase.database().ref('users/'+uid+'/watchlist/stocks/'+symbol);
		fav.set(!$scope.fav);
	}

	$scope.rate = function(){
		var score = firebase.database().ref('ratings/'+symbol+'/'+date+'/'+uid);
		var rates = firebase.database().ref('ratings/'+symbol);
		var rate_avg = firebase.database().ref('ratings/'+symbol+'/avg');
		var rate_qta = firebase.database().ref('ratings/'+symbol+'/qta');
		var user_rating = firebase.database().ref('users/'+uid+'/ratings/'+symbol+'/'+date);

		// rate_avg.set('rate_avg');

		var avg = 0, qta = 0;

		rates.on("value", function(snapshot) {
			if(snapshot.val()){
				avg = snapshot.val().avg;
				qta = snapshot.val().qta;
			}
		})

		score.on("value", function(snapshot) {
			if(avg < 1){
				rate_avg.set(parseInt($scope.rating.stars));
				rate_qta.set(1);
			}else{
				if(snapshot.val()){
					rate_avg.set(avg + parseInt($scope.rating.stars - snapshot.val()));
				}else{
					rate_avg.set(avg + parseInt($scope.rating.stars));
					rate_qta.set(qta + 1);
				}
			}
			score.set(parseInt($scope.rating.stars));
			user_rating.set(parseInt($scope.rating.stars));
		})
		$scope.sendComment($scope.rating.stars, $scope.rating.comment);
	}

	$scope.sendComment = function(rating, reason){
		var time = new Date();
		time = time.getHours()+':'+time.getMinutes();

		var userComment_content;
		var newComment = {
			time: time,
			user: uid,
			name: name
		}

		if(rating){
			userComment_content = $scope.ratingText[rating - 1];
			newComment.rating = rating;
			if(reason){
				newComment.content = reason;
				userComment_content += ' - '+reason;
			}
		}else{
			newComment.content = $scope.rating.comment;
			userComment_content = $scope.rating.comment;
		}

		comments.$add(newComment).then(function(ref) {
			$scope.rating.comment = '';
			var id = ref.key;
			var userComment = firebase.database().ref('users/'+uid+'/comments/'+symbol+'/'+id);
			userComment.set(userComment_content);
		});
	}

	/*Display data box*/
	$scope.displayDataBox = function(){

		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/company').then(function(res){
			$scope.company = res.data;
		});
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/quote').then(function(res){
			$scope.quote = res.data;
		});
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/stats').then(function(res){
			$scope.stats = res.data;
		});
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/previous').then(function(res){
			$scope.previous = res.data;
		});
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/financials').then(function(res){
			$scope.financials = res.data.financials;
		});
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/logo').then(function(res){
			$scope.logo = res.data.url;
		});

		$scope.moreDetails.show();
	}

	$scope.displayRatingCommentsBox = function(){
		$scope.pielabels = ["Short", "Sell", "Hold", "Buy", "Strong Buy"];
		$scope.piedata = $scope.rating.chart;
		$scope.datasetOverride = {
			backgroundColor: [
                '#ff0000',
                '#800000',
                '#ffcc00',
                '#008000',
                '#33cd5f',
            ],
            borderColor: [
            	'rgba(0, 0, 0, 0)',
            	'rgba(0, 0, 0, 0)',
            	'rgba(0, 0, 0, 0)',
            	'rgba(0, 0, 0, 0)',
            	'rgba(0, 0, 0, 0)'
            ]
        }

		$scope.rating_comments.show();
	}

	$scope.resize = function(element) {
		var element = document.getElementById(element);
		$scope.initialHeight = $scope.initialHeight || element.style.height;
		element.style.height = $scope.initialHeight;
		element.style.height = "" + element.scrollHeight + "px";
	}

	$ionicModal.fromTemplateUrl('moreDetails.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.moreDetails = modal;
	});

	$ionicModal.fromTemplateUrl('templates/include/rating_comments.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.rating_comments = modal;
	});
})

.controller('cryptoCtrl', function($scope, $http, $ionicModal, $ionicPopover, $firebaseArray, $firebaseObject, $firebaseAuth) {

	var authObj = $firebaseAuth();
	var uid;
	var user;
	var date = new Date();
	var date = String(date.getFullYear()) + String(date.getMonth()+1) + String(date.getDate());

	var ratings = firebase.database().ref('ratings/');
	ratings = $firebaseObject(ratings);
	ratings.$loaded().then(function(){
		$scope.ratings = ratings;
	})

	authObj.$onAuthStateChanged(function(firebaseUser) {
		if (firebaseUser) {
			uid = firebaseUser.uid;
		} else {
			console.log("Signed out");
		}
	})

  $scope.data = {};
  $scope.filtered = {};
	$scope.fav = false;
  $scope.stocks = [];
  $scope.symbols = [];
  var stocks;

  $scope.data.filtered = [];

  $scope.coins = {};

  $scope.rating = {};

	$http.get('https://api.coinmarketcap.com/v2/ticker/?start=0&limit=20').then(function(res){
		console.log(res.data.data);
		$scope.coins = res.data.data;
	})

  $scope.showMore = function(){
    for (var i = $scope.display - 1; i <= $scope.display + 19; i++) {
      $http.get('https://api.iextrading.com/1.0/stock/'+$scope.symbols[i].symbol+'/quote').then(function(res){

        stock = {
          symbol: res.data.symbol,
          companyName: res.data.companyName,
          latestPrice: res.data.latestPrice,
          changePercent: res.data.changePercent
        }
        $scope.stocks.push(res.data);
      })
    }

    $scope.display += 20;
  }

  $scope.filterStocks = function(){
    $scope.display = 20;
    $scope.stocks = [];

    console.log($scope.data.filtered);

    for (var i = 0; i <= $scope.display - 1; i++) {
    	if($scope.data.filtered[i]){
		    $http.get('https://api.iextrading.com/1.0/stock/'+$scope.data.filtered[i].symbol+'/quote').then(function(res){
		    	stock = {
		        symbol: res.data.symbol,
		        companyName: res.data.companyName,
		        latestPrice: res.data.latestPrice,
		        changePercent: res.data.changePercent,
		        rating: 0
		      }
		      $scope.stocks.push(stock);
		    })
    	}
    }
  }

  $scope.openPopover = function($event) {
    $scope.details.show($event);
  };

  // function checkFav(symbol){
  //   return firebase.database().ref('/users/daniel/favs/'+symbol).once('value').then(function(snapshot) {
  //     var fav = (snapshot.val() || false);
  //   });
  // }
})

.controller('cryptoDetailsCtrl', function($scope, $stateParams, $ionicHistory, $filter, $http, $firebaseArray, $firebaseObject, $firebaseAuth, $ionicModal){

	$scope.goBack = function(){
		$ionicHistory.goBack();
	}

	$scope.openBrowser = function(link){
		cordova.InAppBrowser.open(link,'_blank','location=yes'); 
	};

	var symbol = $stateParams.symbol;
	var comments;
	var rates;

	var authObj = $firebaseAuth();
	var uid;
	var date = new Date();
	var date = String(date.getFullYear()) + String(date.getMonth()+1) + String(date.getDate());

	$scope.rating = {};
	$scope.coin = {
		info: {},
		usd: {}
	};

	$scope.ratingText = ['Short', 'Sell', 'Hold', 'Buy', 'Strong Buy'];
	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	authObj.$onAuthStateChanged(function(firebaseUser) {
		if (firebaseUser) {
			uid = firebaseUser.uid;
			var fav = firebase.database().ref('users/'+uid+'/watchlist/crypto/'+symbol);
			fav.on("value", function(snapshot) {
				$scope.fav = snapshot.val();
			})
		}
	})

	$http.get('https://min-api.cryptocompare.com/data/coin/generalinfo?fsyms='+symbol+'&tsym=USD').then(function(res){
		$scope.coin.info = res.data.Data[0].CoinInfo;
		console.log(res.data.Data[0].CoinInfo);
	})

	$http.get('https://min-api.cryptocompare.com/data/pricemultifull?fsyms='+symbol+'&tsyms=USD').then(function(res){
		$scope.coin.usd = res.data.RAW[symbol].USD;
		console.log(res.data.RAW[symbol].USD);
	})

	comments = firebase.database().ref('comments/'+symbol);
	comments = $firebaseArray(comments);

	comments.$watch(function(){
		$scope.comments = comments;
	})

	rates = firebase.database().ref('ratings/'+symbol+'/'+date);
	rates = $firebaseArray(rates);

	rates.$watch(function(){
		$scope.rating.chart[0] = 0;
		$scope.rating.chart[1] = 0;
		$scope.rating.chart[2] = 0;
		$scope.rating.chart[3] = 0;
		$scope.rating.chart[4] = 0;
		rates.forEach(function (obj) {
			$scope.rating.chart[obj.$value - 1] ++;
			console.log($scope.rating.chart);
		})
	})

	$scope.rating = {
		stars: 5,
		comment: '',
		chart: [0, 0, 0, 0, 0]
	};

	authObj.$onAuthStateChanged(function(firebaseUser) {
		if (firebaseUser) {
			uid = firebaseUser.uid;
			var user = firebase.database().ref('users/'+uid+'/name');
			user.on("value", function(snapshot) {
				name = snapshot.val();
			})
			var fav = firebase.database().ref('users/'+uid+'/watchlist/crypto/'+symbol);
			fav.on("value", function(snapshot) {
				$scope.fav = snapshot.val();
			})
		}
	})

	$scope.chart = {
		data: [],
		labels: [],
		range: '24h',
		shownItems: 10,
		shownRange: 0,
		ranges: [
			'24h'
		],
		points: {},
		series: [
			'High',
			'Low',
			'Open',
			'Close'
		],
		rangeLabels: {
			'24h': []
		},
		datasetOverride: [
			{
				fill: false,
				borderWidth: 1,
				// borderColor: '#f2f2f2',
				pointRadius: 1
			},
			{
				fill: false,
				borderWidth: 1,
				// borderColor: '#f2f2f2',
				pointRadius: 1
			},
			{
				fill: false,
				borderWidth: 1,
				// borderColor: '#f2f2f2',
				pointRadius: 1
			},
			{
				fill: false,
				borderWidth: 1,
				// borderColor: '#f2f2f2',
				pointRadius: 1
			}
		]
		,
		options: {
			animation: {
				duration: 0
			},
			scales: {
				yAxes: [{
					stacked: false,
					display: true
				}],
				xAxes: [{
					stacked: false,
					display: true
				}]
			},
			legend: {
				display: true,
				labels: {
					boxWidth: 20,
					fontColor: '#f2f2f2'
				}
			}
		}
	};

	for (var i = 0; i <= $scope.chart.ranges.length - 1; i++) {
		getData($scope.chart.ranges[i]);
	}
	
	$scope.showData = function(range){
		if(range){
			$scope.chart.range = range;
		}else{
			range = $scope.chart.range;
		}

		if($scope.chart.shownRange >= $scope.chart.rangeLabels[$scope.chart.range].length - $scope.chart.shownItems){
			$scope.chart.shownRange = $scope.chart.rangeLabels[$scope.chart.range].length - $scope.chart.shownItems;
		}

		$scope.chart.data[0] = $filter('limitTo')($scope.chart.points[range][0], $scope.chart.shownItems, $scope.chart.shownRange);
		$scope.chart.data[1] = $filter('limitTo')($scope.chart.points[range][1], $scope.chart.shownItems, $scope.chart.shownRange);
		$scope.chart.data[2] = $filter('limitTo')($scope.chart.points[range][2], $scope.chart.shownItems, $scope.chart.shownRange);
		$scope.chart.data[3] = $filter('limitTo')($scope.chart.points[range][3], $scope.chart.shownItems, $scope.chart.shownRange);
		$scope.chart.labels = $filter('limitTo')($scope.chart.rangeLabels[range], $scope.chart.shownItems, $scope.chart.shownRange);
	}

	function getData(index){

		$http.get('https://min-api.cryptocompare.com/data/histohour?fsym='+symbol+'&tsym=USD&limit=24').then(function(res){
			var high = [], low = [], open = [], close = [];
			for (var x = 0; x <= res.data.Data.length - 1; x ++) {
				high.push(res.data.Data[x].high);
				low.push(res.data.Data[x].low);
				open.push(res.data.Data[x].open);
				close.push(res.data.Data[x].close);
				$scope.chart.rangeLabels[index].push(Unix_timestamp(res.data.Data[x].time));
			}
			$scope.chart.points[index] = [high, low];
			if(open){
				$scope.chart.points[index].push(open);
				$scope.chart.points[index].push(close);
			}
			console.log($scope.chart.points[index]);
			if(index == '24h'){
				$scope.showData('24h');
			}
			console.log(res.data.Data);
		})
	}

	$scope.add = function(){
		var fav = firebase.database().ref('users/'+uid+'/watchlist/crypto/'+symbol);
		fav.set(!$scope.fav);
	}

	$scope.rate = function(){
		var score = firebase.database().ref('ratings/'+symbol+'/'+date+'/'+uid);
		var rates = firebase.database().ref('ratings/'+symbol);
		var rate_avg = firebase.database().ref('ratings/'+symbol+'/avg');
		var rate_qta = firebase.database().ref('ratings/'+symbol+'/qta');
		var user_rating = firebase.database().ref('users/'+uid+'/ratings/'+symbol+'/'+date);

		var avg = 0, qta = 0;

		rates.on("value", function(snapshot) {
			if(snapshot.val()){
				avg = snapshot.val().avg;
				qta = snapshot.val().qta;
			}
		})

		score.on("value", function(snapshot) {
			if(avg < 1){
				rate_avg.set(parseInt($scope.rating.stars));
				rate_qta.set(1);
			}else{
				if(snapshot.val()){
					rate_avg.set(avg + parseInt($scope.rating.stars - snapshot.val()));
				}else{
					rate_avg.set(avg + parseInt($scope.rating.stars));
					rate_qta.set(qta + 1);
				}
			}
			score.set(parseInt($scope.rating.stars));
			user_rating.set(parseInt($scope.rating.stars));
		})
		$scope.sendComment($scope.rating.stars, $scope.rating.comment);
	}

	$scope.sendComment = function(rating, reason){
		var time = new Date();
		time = time.getHours()+':'+time.getMinutes();

		var userComment_content;
		var newComment = {
			time: time,
			user: uid,
			name: name
		}

		if(rating){
			userComment_content = $scope.ratingText[rating - 1];
			newComment.rating = rating;
			if(reason){
				newComment.content = reason;
				userComment_content += ' - '+reason;
			}
		}else{
			newComment.content = $scope.rating.comment;
			userComment_content = $scope.rating.comment;
		}

		comments.$add(newComment).then(function(ref) {
			$scope.rating.comment = '';
			var id = ref.key;
			var userComment = firebase.database().ref('users/'+uid+'/comments/'+symbol+'/'+id);
			userComment.set(userComment_content);
		});
	}

	$scope.displayDataBox = function(){

		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/company').then(function(res){
			$scope.company = res.data;
		});
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/quote').then(function(res){
			$scope.quote = res.data;
		});
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/stats').then(function(res){
			$scope.stats = res.data;
		});
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/previous').then(function(res){
			$scope.previous = res.data;
		});
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/financials').then(function(res){
			$scope.financials = res.data.financials;
		});
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/logo').then(function(res){
			$scope.logo = res.data.url;
		});

		$scope.moreDetails.show();
	}

	$scope.displayRatingCommentsBox = function(){
		$scope.pielabels = ["Short", "Sell", "Hold", "Buy", "Strong Buy"];
		$scope.piedata = $scope.rating.chart;
		$scope.datasetOverride = {
			backgroundColor: [
                '#ff0000',
                '#800000',
                '#ffcc00',
                '#008000',
                '#33cd5f',
            ],
            borderColor: [
            	'rgba(0, 0, 0, 0)',
            	'rgba(0, 0, 0, 0)',
            	'rgba(0, 0, 0, 0)',
            	'rgba(0, 0, 0, 0)',
            	'rgba(0, 0, 0, 0)'
            ]
        }

		$scope.rating_comments.show();
	}

	$scope.resize = function(element) {
		var element = document.getElementById(element);
		$scope.initialHeight = $scope.initialHeight || element.style.height;
		element.style.height = $scope.initialHeight;
		element.style.height = "" + element.scrollHeight + "px";
	}

	function Unix_timestamp(t){
		var dt = new Date(t*1000);
		var month = months[dt.getMonth()];
		var day = dt.getDate();
		var hr = dt.getHours();
		var m = "0" + dt.getMinutes();
		return day+'/'+month+' '+hr+':'+m.substr(-2);
	}

	$ionicModal.fromTemplateUrl('moreDetails.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.moreDetails = modal;
	});

	$ionicModal.fromTemplateUrl('templates/include/rating_comments.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.rating_comments = modal;
	});
})

.controller('watchList_stocksCtrl', function($scope, $http, $ionicModal, $ionicPopover, $firebaseArray, $firebaseObject, $firebaseAuth) {

	var authObj = $firebaseAuth();
	var uid;
	var user;
	var watchlist;

	$scope.stocks = [];

	authObj.$onAuthStateChanged(function(firebaseUser) {
		if (firebaseUser) {
			uid = firebaseUser.uid;
		  var watchlistRef = firebase.database().ref('users/'+uid+'/watchlist/stocks/'); 
			watchlist = $firebaseArray(watchlistRef);
			watchlist.$watch(function(event){
				console.log(event);
				if(event.event == 'child_added'){
					displayStock(event.key);
				}
			}) 
		} else {
			console.log("Signed out");
		}
	})

	var ratings = firebase.database().ref('ratings/');
		ratings = $firebaseObject(ratings);
		ratings.$loaded().then(function(){
		$scope.ratings = ratings;
		console.log(ratings);
	})

  function displayStock(symbol){
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/quote').then(function(res){

			var stock = {
				symbol: res.data.symbol,
				companyName: res.data.companyName,
				latestPrice: res.data.latestPrice,
				changePercent: res.data.changePercent
			}

			$scope.stocks.push(stock);
		})
  }
})

.controller('watchList_cryptoCtrl', function($scope, $http, $ionicModal, $ionicPopover, $firebaseArray, $firebaseObject, $firebaseAuth) {

	var authObj = $firebaseAuth();
	var uid;
	var user;
	var watchlist;

	$scope.stocks = [];

	authObj.$onAuthStateChanged(function(firebaseUser) {
		if (firebaseUser) {
			uid = firebaseUser.uid;
		  var watchlistRef = firebase.database().ref('users/'+uid+'/watchlist/stocks/'); 
			watchlist = $firebaseArray(watchlistRef);
			watchlist.$watch(function(event){
				console.log(event);
				if(event.event == 'child_added'){
					displayStock(event.key);
				}
			}) 
		} else {
			console.log("Signed out");
		}
	})

	var ratings = firebase.database().ref('ratings/');
		ratings = $firebaseObject(ratings);
		ratings.$loaded().then(function(){
		$scope.ratings = ratings;
		console.log(ratings);
	})


  function displayStock(symbol){
		$http.get('https://min-api.cryptocompare.com/data/coin/generalinfo?fsyms='+symbol+'&tsym=USD').then(function(res){
			$scope.coin.info = res.data.Data[0].CoinInfo;
			console.log(res.data.Data[0].CoinInfo);
		})
		// $http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/quote').then(function(res){

		// 	var stock = {
		// 		symbol: res.data.symbol,
		// 		companyName: res.data.companyName,
		// 		latestPrice: res.data.latestPrice,
		// 		changePercent: res.data.changePercent
		// 	}

		// 	$scope.stocks.push(stock);
		// })
  }
})

.controller('connectsCtrl', function($scope, $ionicActionSheet, $firebaseArray, $firebaseObject, $firebaseAuth) {

	var uid;
	var connectsArr

	var authObj = $firebaseAuth();
	authObj.$onAuthStateChanged(function(firebaseUser) {
		if (firebaseUser) {
			uid = firebaseUser.uid;
			var connectsRef = firebase.database().ref('users/'+uid+'/connects/');
			connectsArr = $firebaseArray(connectsRef);
			$scope.connects = [];

			connectsArr.$watch(function(event){
				if(event.event == 'child_added'){
					var userRef = firebase.database().ref('users/'+event.key+'/');
					var userObj = $firebaseObject(userRef);
					userObj.$loaded().then(function(){
						if(userObj.comments){
							userObj.commentedCount = Object.keys(userObj.comments).length;
						}
						if(userObj.watchlist){
							userObj.watchlistCount = Object.keys(userObj.watchlist).length;
						}
						if(userObj.connects){
							userObj.connectsCount = Object.keys(userObj.connects).length;
						}
						if(userObj.ratings){
							userObj.ratingsCount = Object.keys(userObj.ratings).length;
						}
						$scope.connects.push(userObj);
						console.log($scope.connects);
					})
				}
			})
		} else {
			$location.path('/login');
		}
	})

	$scope.delete = function(index, obj){

		connectsArr.$remove(connectsArr[index]).then(function(ref) {
			$scope.connects.splice(index, index+1);
		});
	}

	$scope.checkChat = function(connect){

		var chatsRef = firebase.database().ref('/chats/');
		var chatsArray = $firebaseArray(chatsRef);
		
		var userChatsRef = firebase.database().ref('users/'+uid+'/chats/'+connect);
		var connectChatsRef = firebase.database().ref('users/'+connect+'/chats/'+uid);

		var chat = firebase.database().ref('users/'+uid+'/chats/'+connect);
		chat.on("value", function(snapshot) {
			if(snapshot.val()){
				console.log(snapshot.val());
				// If the chat exist, don't create, just go to it
			}else{
				chatsArray.$add({lastMessage: 'nothing yet!'}).then(function(ref) {
					var id = ref.key;
					userChatsRef.set(id);
					connectChatsRef.set(id);
					// console.log("added record with id " + id);
				});
			}
		})
	}
})

.controller('profileCtrl', function($scope, $http, $ionicPopover, $ionicHistory, $firebaseArray, $firebaseObject, $firebaseAuth, $stateParams) {

	$scope.goBack = function(){
		$ionicHistory.goBack();
	}

	var uid;

	var authObj = $firebaseAuth();
	authObj.$onAuthStateChanged(function(firebaseUser) {
		if (firebaseUser) {
			uid = firebaseUser.uid;
			load_user();
			load_comments();
			load_ratings();
			load_watchlist();
		}
	})

	$scope.ratingText = ['Short', 'Sell', 'Hold', 'Buy', 'Strong Buy'];

	$scope.comments = [];
	$scope.ratings = [];
	$scope.watchlist = [];

	function load_user(){
		var user = firebase.database().ref('users/'+uid);
		user = $firebaseObject(user);
		user.$loaded().then(function(){
			$scope.user = user;
			console.log($scope.user);
		})
	}

	function load_comments(){
		var comments = firebase.database().ref('users/'+uid+'/comments/');
		comments = $firebaseObject(comments);
		comments.$loaded().then(function(){
			comments.forEach(function(obj, key){
				$scope.comments.push({'symbol': key, 'obj': obj});
			})
		})
	}

	function load_ratings(){
		var ratings = firebase.database().ref('users/'+uid+'/ratings/');
		ratings = $firebaseObject(ratings);
		ratings.$loaded().then(function(){
			ratings.forEach(function(obj, key){
				$scope.ratings.push({'symbol': key, 'obj': obj});
			})
		})
	}

	function load_watchlist(){
		var watchlist = firebase.database().ref('users/'+uid+'/watchlist/');
		watchlist = $firebaseObject(watchlist);
		watchlist.$loaded().then(function(){
			watchlist.forEach(function(obj, key){
				$scope.watchlist.push(obj);
			})
			$scope.watchlist = Object.assign({}, $scope.watchlist[0], $scope.watchlist[1]);
		})
	}

			// comments.$watch(function(){
			// 	$scope.comments = comments;
			// 	$scope.comments.forEach(function (obj) {
			// 		obj;
			// 	})
			// })

	// $scope.ratings = [
	// 	'20180508': {
	// 		'A': 5,
	// 		'B': 5,
	// 		'C': 2,
	// 		'D': 3,
	// 		'E': 1,
	// 		'F': 4
	// 	},
	// 	'20180409': {
	// 		'A': 5,
	// 		'B': 5,
	// 		'C': 2,
	// 		'D': 3,
	// 		'E': 1,
	// 		'F': 4
	// 	}
	// ];

	// var id;
	// var authObj = $firebaseAuth();
	// authObj.$onAuthStateChanged(function(firebaseUser) {
	// 	if (firebaseUser) {
	// 		id = firebaseUser.uid;
	// 		$scope.init();
	// 	}
	// })

	// $scope.init = function(){
	// 	var userRef = firebase.database().ref('users/'+id+'/');
	// 	var userObj = $firebaseObject(userRef);

	// 	userObj.$loaded().then(function(){

	// 		// console.log(userObj);

	// 		userObj.commentedCount = Object.keys(userObj.comments).length;
	// 		userObj.watchlistCount = Object.keys(userObj.watchlist).length;
	// 		userObj.connectsCount = Object.keys(userObj.connects).length;
	// 		userObj.ratingsCount = Object.keys(userObj.ratings).length;
	// 		$scope.user = userObj;

	// 		var commentsArray = [];
	// 		angular.forEach(userObj.comments, function(value, key) {
	// 			angular.forEach(value, function(value, key){
	// 				commentsArray.push(key);
	// 			})
	// 		})

	// 		console.log(commentsArray);
	// 	})
	// }


	// $scope.showComments = function(symbol, ids){

	// 	$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/company').then(function(res){
	// 		$scope.company.name = res.data.companyName;
	// 	});
	// 	$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/logo').then(function(res){
	// 		$scope.company.logo = res.data.url;
	// 	});

	// 	$scope.comments = [];
	// 	var commentsRef = firebase.database().ref('comments/'+symbol+'/');
	// 	var commentsArr = $firebaseArray(commentsRef);

	// 	commentsArr.$loaded().then(function(){
	// 		angular.forEach(ids, function(value, key){
	// 			var comment = commentsArr.$getRecord(key);
	// 			$scope.comments.push(comment);
	// 		})
	// 			console.log($scope.comments);
	// 	})

	// 	$scope.popover_comments.show(popupTop);
	// }

	// $ionicPopover.fromTemplateUrl('comments.html', {
	// 	scope: $scope
	// }).then(function(popover) {
	// 	$scope.popover_comments = popover;
	// });
})

.controller('publicChatCtrl', function($scope, $ionicPopup, $ionicActionSheet, $location, $anchorScroll, $firebaseArray, $firebaseAuth) {

	$scope.data = {};

	var authObj = $firebaseAuth();
	var name;

	authObj.$onAuthStateChanged(function(firebaseUser) {
		if (firebaseUser) {
			$scope.uid = firebaseUser.uid;
			var user = firebase.database().ref('users/'+$scope.uid+'/name');
			user.on("value", function(snapshot) {
				name = snapshot.val();
			})
		} else {
			console.log("Signed out");
		}
	})

	var messagesRef = firebase.database().ref('chats/public/messages');
	var messagesArray = $firebaseArray(messagesRef);

	messagesArray.$watch(function(){
		$scope.messages = messagesArray;
		$anchorScroll();
	})

	messagesArray.$loaded().then(function(){
		$location.hash('bottom');
	})

	function urlify(text) {
		var urlRegex = /(https?:\/\/[^\s]+)/g;
		return text.replace(urlRegex, function(url) {
			return '<a href=\'' + url + '\'>' + url + '</a>';
		})
	}

	$scope.sendMessage = function(){

		var time = new Date();
		time = time.getHours()+':'+time.getMinutes();

		var newMessage = {
			text: urlify($scope.data.message),
			time: time,
			uid	: $scope.uid,
			name: name
		}
		messagesArray.$add(newMessage).then(function(ref) {
			$scope.data.message = null;
			document.getElementById('textarea').focus();
		});
	}

	$scope.showPopup = function(user, email) {
		$scope.data = {};
		$scope.user = user;

		var hideSheet = $ionicActionSheet.show({
			buttons: [
				{ text: 'Connect' },
				{ text: 'Profile' }
			],
			destructiveText: 'Block',
			destructiveButtonClicked: function(){
				alert('Block');
				return true;
			},
			titleText: 'Brandon Gray',
			cancelText: 'Cancel',
			cancel: function() {
				// add cancel code..
			},
			buttonClicked: function(index) {
				console.log(index);
				if(index == 0){
					addConnect();
				}
				return true;
			}
		});
	}

	function addConnect(){
		var newConnect = firebase.database().ref('users/'+$scope.uid+'/connects/'+$scope.user);
		newConnect.set(true);
		alert('connect added!');
	}
})

.controller('chatsCtrl', function($scope, $firebaseAuth, $firebaseArray, $firebaseObject) {

	var authObj = $firebaseAuth();
	$scope.items = [];
	$scope.users = {};
	$scope.chats = {};

	// var users = firebase.database().ref('users/');
	// users = $firebaseObject(users);
	// users.$loaded().then(function(){
	// 	$scope.users = users;
	// })

	authObj.$onAuthStateChanged(function(firebaseUser) {
		if (firebaseUser) {
			$scope.uid = firebaseUser.uid;
			var userChats = firebase.database().ref('users/'+$scope.uid+'/chats/');
			userChats = $firebaseArray(userChats);
			userChats.$watch(function(e){
				if(e.event == 'child_added'){
					var item = userChats.$getRecord(e.key);
					var user = $firebaseObject(firebase.database().ref('users/'+item.$id));
					user.$loaded().then(function(){
						$scope.users[item.$id] = user;
					})

					var user = $firebaseObject(firebase.database().ref('users/'+item.$id));
					user.$loaded().then(function(){
						$scope.users[item.$id] = user;
					})

					// var chat = $firebaseObject(firebase.database().ref('chats/'+item.$value));
					var chat = $firebaseObject(firebase.database().ref('chats/'+item.$value));
					chat.$watch(function(){
						$scope.chats[item.$value] = chat;
						if(chat.messages){
							var length = Object.keys(chat.messages).length; 
							// console.log(Object.keys(chat.messages).length);
							console.log(chat.messages);
						}else{
							console.log('There\'s no message');
						}
					})
					
					$scope.items.push(item);
					// $scope.items[item.$value] = item.$id;
				}
			})
		} else {
			console.log("Signed out");
		}
	})

	// function addChat(user, chatId){

	// 	var name;
	// 	var item = {};

	// 	var user = firebase.database().ref('users/'+user+'/name');
	// 	user.on("value", function(snapshot) {
	// 		name = snapshot.val();
	// 		var chat = firebase.database().ref('chats/'+chatId);
	// 		chat.on("value", function(snapshot){
	// 			chat = snapshot.val();
	// 			console.log(chat.messages);
	// 		})
	// 	})
	// }
})

.controller('chatCtrl', function($scope, $stateParams, $location, $anchorScroll, $ionicHistory, $http, $firebaseArray, $firebaseObject, $firebaseAuth) {
  
  var id = $stateParams.id;
  $scope.title = $stateParams.title;
  console.log($stateParams);

  $scope.goBack = function(){
		$ionicHistory.goBack();
	}

  $scope.data = {};

  var authObj = $firebaseAuth();
	var name;

	authObj.$onAuthStateChanged(function(firebaseUser) {
		if (firebaseUser) {
			$scope.uid = firebaseUser.uid;
			var user = firebase.database().ref('users/'+$scope.uid+'/name');
			user.on("value", function(snapshot) {
				name = snapshot.val();
			})
		} else {
			console.log("Signed out");
		}
	})

  var messages = firebase.database().ref('chats/'+id+'/messages');
  messages = $firebaseArray(messages);
  
  messages.$loaded().then(function(){
		$location.hash('bottom');
  })

  messages.$watch(function(){
		$anchorScroll();
  	$scope.messages = messages;
  })

  $scope.sendMessage = function(){
    var date = new Date();
    var time = date.getHours()+':'+date.getMinutes();
    var timestamp = String(date.getUTCFullYear())+String(date.getUTCMonth())+String(date.getUTCDate())+String(date.getUTCHours())+String(date.getUTCMinutes())+String(date.getUTCSeconds())+String(date.getUTCMilliseconds());

    var newMessage = {
      name: name,
      text: $scope.data.message,
      time: time,
      timestamp: timestamp,
      uid: $scope.uid
    }
    messages.$add(newMessage).then(function(ref) {
      $scope.data.message = null;      
      document.getElementById('textarea').focus();
      var lastMessage = firebase.database().ref('chats/'+id+'/lastMessage');
      lastMessage.set(newMessage);
    });
  }
})