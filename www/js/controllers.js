angular.module('starter.controllers', [])

.controller('tabsCtrl', function($scope, $ionicActionSheet, $firebaseAuth, $location) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  var authObj = $firebaseAuth();

 	$scope.openMore = function() {

		var actionSheet = $ionicActionSheet.show({
			buttons: [
				{ text: 'Profile (template)' },
				{ text: 'Log Out' }
			],
			// titleText: 'Brandon Gray',
			cancelText: 'Cancel',
			cancel: function() {
				// add cancel code..
			},
			buttonClicked: function(index) {
				console.log(index);
				if(index == 0){
					$location.path('/app/profile');
				}
				if (index == 1) {
					$location.path('/login');
				}
				return true;
			}
		});
	}

	// authObj.$onAuthStateChanged(function(firebaseUser) {
	// 	console.log(firebaseUser);
	// })

})

.controller('loginCtrl', function($scope, $location, $ionicModal, $firebaseAuth) {

	// messaging.requestPermission().then(function() {
	// 	console.log('Notification permission granted.');
	// 	// TODO(developer): Retrieve an Instance ID token for use with FCM.
	// 	// ...
	// }).catch(function(err) {
	// 	console.log('Unable to get permission to notify.', err);
	// });

	$scope.$on('$ionicView.enter', function(e) {
		var authObj = $firebaseAuth();
		authObj.$signOut();
	});

	$scope.callFCM = function(){
		FCMPlugin.getToken(
			function (token) {
				alert('Token: ' + token);
				console.log('Token: ' + token);
			},
			function (err) {
				alert('error retrieving token: ' + token);
				console.log('error retrieving token: ' + err);
			}
		);
	}

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


	$scope.send = function(){
		//FCMPlugin.subscribeToTopic( topic, successCallback(msg), errorCallback(err) );
		//All devices are subscribed automatically to 'all' and 'ios' or 'android' topic respectively.
		//Must match the following regular expression: "[a-zA-Z0-9-_.~%]{1,900}".
		// FCMPlugin.subscribeToTopic('all');

		$http({
			method: "POST",
			dataType: 'jsonp',
			headers: {'Content-Type': 'application/json', 'Authorization': 'key=AIzaSyB3BQ2XI8ZGG2sE-ELiWF3E7brO9WFCv5E'},
			url: "https://fcm.googleapis.com/fcm/send",
			data: JSON.stringify({
					"notification":{
						"title":"T2T Test Notification",  //Any value
						"body": 'Test Message Body',  //Any value
						"sound": "default", //If you want notification sound
						"click_action": "FCM_PLUGIN_ACTIVITY",  //Must be present for Android
						"icon": "fcm_push_icon"  //White icon Android resource
					},
					"data":{
						"param1":"value1",  //Any data to be retrieved in the notification callback
						"param2": 'Test Message Body'
					},
					// "to":"/topics/all", //Topic or single device
					"priority":"high", //If not set, notification won't be delivered on completely closed iOS app
					"restricted_package_name":"" //Optional. Set for application filtering
			})
		}).success(function(data){
			$scope.reply = 'Test Message Body';
			alert("Success: " + JSON.stringify(data));
		}).error(function(data){
			alert("Error: " + JSON.stringify(data));
		});
	}
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
  $scope.ratings = [];
  $scope.symbols = [];
  $scope.display = 19;
  var stocks;

  $scope.data.filtered = [];

  $scope.stock = {
    company: {},
    quote: {},
    previous: {},
    logo: {},
    chart: {
      day: {}
    }
  };

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

  $scope.showDetails = function(symbol){

		$scope.comments = [];

		var fav = firebase.database().ref('users/'+uid+'/watchlist/'+symbol);
		fav.on("value", function(snapshot) {
			$scope.fav = snapshot.val();
		})

		var comments = firebase.database().ref('comments/'+symbol);
    $scope.commentsArray = $firebaseArray(comments);

		$scope.commentsArray.$loaded().then(function(){
			$location.hash('bottom');
		})

		$scope.commentsArray.$watch(function(){
			$scope.comments = $scope.commentsArray;
			$anchorScroll();
		})

    var ratings = firebase.database().ref('ratings/'+symbol);
    $scope.ratingsArray = $firebaseArray(ratings);

    $scope.ratingsArray.$watch(function(){
      $scope.ratingScore = 0;
      $scope.ratingsArray.forEach(function (obj) {
        $scope.ratingScore += obj.$value;
      })
    })


    $scope.ratingsArray.$loaded().then(function(){
    	// console.log($scope.ratingsArray.$getRecord(uid));
			if($scope.ratingsArray.$getRecord(uid)){
				$scope.rating.stars = $scope.ratingsArray.$getRecord(uid).$value;
			}else{
				$scope.rating.stars = 5;
			}
    })

		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/company').then(function(res){
			$scope.stock.company = res.data;
		});
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/quote').then(function(res){
			$scope.stock.quote = res.data;
		});
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/stats').then(function(res){
			$scope.stock.stats = res.data;
		});
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/previous').then(function(res){
			$scope.stock.previous = res.data;
		});
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/financials').then(function(res){
			$scope.stock.financials = res.data.financials;
		});
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/logo').then(function(res){
			$scope.stock.logo = res.data.url;
		});

    // First check if there's any daya for "today". If not, print the last day data
    $http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/chart/1d').then(function(res){
      $scope.points = [];

      $scope.stock.chart.day = res.data;

      var high = [],
          low = [],
          labels = [];

      for (var i = 0; i <= res.data.length - 1; i += 5) {
        $scope.points.push(res.data[i].average);
        labels.push('');
      }

      $scope.labels = labels;
      $scope.datasetOverride = {
        fill: false,
        borderWidth: 2,
        borderColor: '#f2f2f2',
        pointRadius: 0,
        borderJoinStyle: 'miter',
        borderCapStyle: 'square'
      };


    });

    $scope.modal.show();
  }

	$scope.add = function(){
		var symbol = $scope.stock.company.symbol;
		var fav = firebase.database().ref('users/'+uid+'/watchlist/'+symbol);
		fav.set(!$scope.fav);
	}

	$scope.sendComment = function(rating, reason){

		var time = new Date();
		time = time.getHours()+':'+time.getMinutes();

		var newComment = {
			time: time,
			user: uid,
			name: name
		}

		if(rating){
			newComment.rating = rating;
			if(reason){
				newComment.content = reason;
			}
		}else{
			newComment.content = $scope.data.newComment;
		}

		$scope.commentsArray.$add(newComment).then(function(ref) {
			$scope.data.newComment = null;
			$scope.rating.comment = null;

      var symbol = $scope.stock.company.symbol;
      var id = ref.key;
      var userComment = firebase.database().ref('users/'+uid+'/comments/'+symbol+'/'+id);
      userComment.set(true);
		});
	}

	$scope.rate = function(){
		var symbol = $scope.stock.company.symbol;
		var score = firebase.database().ref('ratings/'+symbol+'/'+date+'/'+uid);
		var rates = firebase.database().ref('ratings/'+symbol);

		var avg, qta;

		rates.on("value", function(snapshot) {
			if(snapshot.val()){
				avg = snapshot.val().avg;
				qta = snapshot.val().qta;
			}else{
				avg = 0;
        qta = 0;
			}
		})

		score.on("value", function(snapshot) {
			if(avg < 1){
				rates.child('avg').set(parseInt($scope.rating.stars));
				rates.child('qta').set(1);
			}else{
				if(snapshot.val()){
					console.log(snapshot.val());
					rates.child('avg').set(avg + parseInt($scope.rating.stars - snapshot.val()));
				}else{
					rates.child('avg').set(avg + parseInt($scope.rating.stars));
					rates.child('qta').set(qta + 1);
				}
			}
			score.set(parseInt($scope.rating.stars));
		})
		$scope.sendComment($scope.rating.stars, $scope.rating.comment);
	}

	$ionicModal.fromTemplateUrl('stockDetails.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.modal = modal;
	});

	$ionicModal.fromTemplateUrl('settings.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.settings = modal;
	});
})

.controller('cryptoCtrl', function($scope, $http, $ionicModal, $ionicPopover, $firebaseArray, $firebaseObject, $firebaseAuth) {

	var authObj = $firebaseAuth();
	var uid;
	var email;
	var user;
	var date = new Date();
	var date = String(date.getFullYear()) + String(date.getMonth()+1) + String(date.getDate());

	var ratings = firebase.database().ref('ratings/');
	ratings = $firebaseObject(ratings);
	ratings.$loaded().then(function(){
		$scope.ratings = ratings;
	})

	$scope.ratingText = ['Short', 'Sell', 'Hold', 'Buy', 'Strong Buy'];

	authObj.$onAuthStateChanged(function(firebaseUser) {
		if (firebaseUser) {
			uid = firebaseUser.uid;
			email = firebaseUser.email;
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

  $http.get('https://api.coinmarketcap.com/v1/ticker/?start=0&limit=20').then(function(res){
  	console.log(res.data);
  	$scope.coins = res.data;
    // for (var i = 0; i <= res.data.result.length - 1; i++) {

    //   var stock = {
    //     symbol: res.data.result[i].symbol,
    //     name: res.data.result[i].CoinName
    //   }
    //   $scope.symbols.push(stock);
    //   $scope.data.filtered.push(stock);
    // }
    // displayFirst();
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

  // function displayFirst(){
		// var ratingScore;
		// var ratings = [];
		// var ref = firebase.database().ref('ratings/');
		// ref = $firebaseArray(ref);
		//   for (var i = 0; i <= 19; i++) {

		//     $http.get('https://api.iextrading.com/1.0/stock/'+$scope.symbols[i].symbol+'/quote').then(function(res){
		//       stock = {
		//         symbol: res.data.symbol,
		//         companyName: res.data.companyName,
		//         latestPrice: res.data.latestPrice,
		//         changePercent: res.data.changePercent,
		//         rating: 0
		//       }
		//       $scope.stocks.push(stock);
		//     })
		//   }
  // }

  $scope.showDetails = function(coin){

  	var symbol = coin.symbol;
  	$scope.coin = coin;

		$scope.comments = [];
		var fav = firebase.database().ref('users/'+uid+'/watchlist/'+symbol);
		fav.on("value", function(snapshot) {
			$scope.fav = snapshot.val();
		})

		var comments = firebase.database().ref('comments/'+symbol);
    $scope.commentsArray = $firebaseArray(comments);

    $scope.commentsArray.$watch(function(){
      $scope.comments = [];

      $scope.commentsArray.forEach(function (obj) {
        $scope.comments.push(obj);
      })
    })

    var ratings = firebase.database().ref('ratings/'+symbol);
    $scope.ratingsArray = $firebaseArray(ratings);

    $scope.ratingsArray.$watch(function(){
      $scope.ratingScore = 0;
      // console.log($scope.ratingsArray.length);

      $scope.ratingsArray.forEach(function (obj) {
        $scope.ratingScore += obj.$value;
        // $scope.ratingScore = $scope.ratingScore / $scope.ratingsArray.length;
      })
    })


    $scope.ratingsArray.$loaded().then(function(){
    	// console.log($scope.ratingsArray.$getRecord(uid));
			if($scope.ratingsArray.$getRecord(uid)){
				$scope.rating.stars = $scope.ratingsArray.$getRecord(uid).$value;
			}else{
				$scope.rating.stars = 5;
			}
    })

    $scope.modal.show();
  }

	$scope.add = function(){
		var symbol = $scope.coin.symbol;
		var fav = firebase.database().ref('users/'+uid+'/watchlist/'+symbol);
		fav.set(!$scope.fav);
	}

	$scope.sendComment = function(rating){
		var time = new Date();
		time = time.getHours()+':'+time.getMinutes();

		var newComment = {
			content: $scope.data.newComment,
			time: time,
			user: email
		}
		$scope.commentsArray.$add(newComment).then(function(ref) {
			$scope.data.newComment = null;

      var symbol = $scope.coin.symbol;
      var id = ref.key;
      var userComment = firebase.database().ref('users/'+uid+'/comments/'+symbol+'/'+id);
      userComment.set(true);
		});
	}

	$scope.rate = function(){
		var symbol = $scope.coin.symbol;
		var score = firebase.database().ref('ratings/'+symbol+'/'+date+'/'+uid);
		var rates = firebase.database().ref('ratings/'+symbol);

		var avg, qta;

		rates.on("value", function(snapshot) {
			if(snapshot.val()){
				avg = snapshot.val().avg;
				qta = snapshot.val().qta;
			}else{
				avg = 0;
        qta = 0;
			}
		})

		score.on("value", function(snapshot) {
			if(avg < 1){
				rates.child('avg').set(parseInt($scope.rating.stars));
				rates.child('qta').set(1);
			}else{
				if(snapshot.val()){
					console.log(snapshot.val());
					rates.child('avg').set(avg + parseInt($scope.rating.stars - snapshot.val()));
				}else{
					rates.child('avg').set(avg + parseInt($scope.rating.stars));
					rates.child('qta').set(qta + 1);
				}
			}
			score.set(parseInt($scope.rating.stars));
			// console.log(avg, qta);
		})
	}

  $ionicModal.fromTemplateUrl('cryproDetails.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.openModal = function() {
    $scope.modal.show();
  };
  $scope.closeModal = function() {
    $scope.modal.hide();
  };

  $scope.openPopover = function($event) {
    $scope.details.show($event);
  };

  // function checkFav(symbol){
  //   return firebase.database().ref('/users/daniel/favs/'+symbol).once('value').then(function(snapshot) {
  //     var fav = (snapshot.val() || false);
  //   });
  // }
})

.controller('watchListCtrl', function($scope, $http, $ionicModal, $ionicPopover, $firebaseArray, $firebaseObject, $firebaseAuth) {

	var authObj = $firebaseAuth();
	var uid;
	var email;
	var user;
	var watchlist;

	authObj.$onAuthStateChanged(function(firebaseUser) {
		if (firebaseUser) {
			uid = firebaseUser.uid;
			email = firebaseUser.email;
			console.log(uid);
		  var watchlistRef = firebase.database().ref('users/'+uid+'/watchlist/'); 
			watchlist = $firebaseObject(watchlistRef);
			watchlist.$watch(function(stock){
				$scope.symbols = [];
				angular.forEach(watchlist, function(value, key){
					if(value){
						$scope.symbols.push(key);
					}
				})
				displayFirst();
			}) 
		} else {
			console.log("Signed out");
		}
	})

  // var database = firebase.database();

  $scope.data = {};
  $scope.filtered = {};
  $scope.fav = false;
  $scope.stocks = [];
  $scope.symbols = [];
  $scope.display = 19;
  var stocks;

  $scope.data.filtered = [];

  $scope.stock = {
    company: {},
    quote: {},
    previous: {},
    logo: {},
    chart: {
      day: {}
    }
  };



  // database.ref('/users/daniel/favs/').once('value').then(function(snapshot) {
  //   // var username = (snapshot.val() && snapshot.val().name) || 'Anonymous';
  //   var favs = snapshot.val();
  //   console.log($scope.favs);
  // })

  // $http.get('https://api.iextrading.com/1.0/ref-data/symbols').then(function(res){
  //   for (var i = 0; i <= res.data.length - 1; i++) {
  //     $scope.symbols.push(res.data[i].symbol);
  //     var stock = {
  //       symbol: res.data[i].symbol,
  //       name: res.data[i].name
  //     }
  //     $scope.data.filtered.push(stock);
  //   }
  //   console.log($scope.data.filtered);
  //   displayFirst();
  // })

  $scope.showMore = function(){

    for (var i = $scope.display - 1; i <= $scope.display + 19; i++) {
      $http.get('https://api.iextrading.com/1.0/stock/'+$scope.symbols[i]+'/quote').then(function(res){

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
      $http.get('https://api.iextrading.com/1.0/stock/'+$scope.data.filtered[i]+'/quote').then(function(res){
        // test.push(res.data);
        $scope.stocks.push(res.data);
      })
    }

    // var test = [];
    // $scope.display = 20;
    // console.log('Filtered: '+$scope.data.filtered);
    // console.log('Res.data: '+test);
  }

  function displayFirst(){
    
  	$scope.stocks = [];

    for (var i = 0; i <= 19; i++) {
    	if($scope.symbols[i]){

	      $http.get('https://api.iextrading.com/1.0/stock/'+$scope.symbols[i]+'/quote').then(function(res){

	        var stock = {
	          symbol: res.data.symbol,
	          companyName: res.data.companyName,
	          latestPrice: res.data.latestPrice,
	          changePercent: res.data.changePercent
	        }
	        $scope.stocks.push(stock);
	      })
    	}
    }
    console.log($scope.stocks);
  }

  $scope.showDetails = function(symbol){

    var fav = firebase.database().ref('users/daniel/watchlist/'+symbol);
    fav.on("value", function(snapshot) {
      $scope.fav = snapshot.val();
    })

    $http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/company').then(function(res){
      $scope.stock.company = res.data;
    });
    $http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/quote').then(function(res){
      $scope.stock.quote = res.data;
    });
    $http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/stats').then(function(res){
      $scope.stock.stats = res.data;
    });
    $http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/previous').then(function(res){
      $scope.stock.previous = res.data;
    });
    $http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/financials').then(function(res){
      $scope.stock.financials = res.data;
    });
    $http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/logo').then(function(res){
      $scope.stock.logo = res.data.url;
    });
      // PENDIG
      // First check if there's any daya for "today". If not, print the last day data
    $http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/chart/1d').then(function(res){
      $scope.stock.chart.day = res.data[res.data.length - 1];
    });
      // PENDING

    console.log($scope.stock);
    $scope.modal.show();
  }

  $scope.add = function(){
    var symbol = $scope.stock.company.symbol;
    var fav = firebase.database().ref('users/daniel/watchlist/'+symbol);
    fav.set(!$scope.fav);
  }

  $ionicModal.fromTemplateUrl('stockDetails.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.openModal = function() {
    $scope.modal.show();
    $scope.test = 12;
  };
  $scope.closeModal = function() {
    $scope.modal.hide();
  };

  $scope.openPopover = function($event) {
    $scope.details.show($event);
  };
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

.controller('connectProfileCtrl', function($scope, $http, $ionicPopover, $ionicHistory, $firebaseArray, $firebaseObject, $firebaseAuth, $stateParams) {

  var id = $stateParams.id;
  var popupTop = document.getElementById('popupTop');

	var userRef = firebase.database().ref('users/'+id+'/');
	var userObj = $firebaseObject(userRef);

	$scope.company = {};

	$scope.goBack = function(){
		$ionicHistory.goBack();
	}

	userObj.$loaded().then(function(){

		console.log(userObj);

		// userObj.commentedCount = Object.keys(userObj.comments).length;
		userObj.watchlistCount = Object.keys(userObj.watchlist).length;
		userObj.connectsCount = Object.keys(userObj.connects).length;
		userObj.ratingsCount = Object.keys(userObj.ratings).length;
		$scope.user = userObj;

		var commentsArray = [];
		// angular.forEach(userObj.comments, function(value, key) {
		// 	angular.forEach(value, function(value, key){
		// 		commentsArray.push(key);
		// 	})
		// })

		// console.log(commentsArray);
  })

  $scope.showComments = function(symbol, ids){

		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/company').then(function(res){
			$scope.company.name = res.data.companyName;
		});
		$http.get('https://api.iextrading.com/1.0/stock/'+symbol+'/logo').then(function(res){
			$scope.company.logo = res.data.url;
		});

  	$scope.comments = [];
		var commentsRef = firebase.database().ref('comments/'+symbol+'/');
		var commentsArr = $firebaseArray(commentsRef);

		commentsArr.$loaded().then(function(){
			angular.forEach(ids, function(value, key){
				var comment = commentsArr.$getRecord(key);
				$scope.comments.push(comment);
			})
				console.log($scope.comments);
		})

		$scope.popover_comments.show(popupTop);
  }

	$ionicPopover.fromTemplateUrl('comments.html', {
		scope: $scope
	}).then(function(popover) {
		$scope.popover_comments = popover;
	});
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

	// $scope.send = function(){	
	// 	$http({
	// 		method: "POST",
	// 		headers: {'Content-Type': 'application/json', 'Authorization': 'key=AIzaSyB3BQ2XI8ZGG2sE-ELiWF3E7brO9WFCv5E'},
	// 		url: "https://fcm.googleapis.com/fcm/send",
	// 		data: JSON.stringify({
	// 				"notification":{
	// 					"title":"Ionic FCM Starter",  //Any value
	// 					"body": $scope.data.message,  //Any value
	// 					"sound": "default", //If you want notification sound
	// 					"click_action": "FCM_PLUGIN_ACTIVITY",  //Must be present for Android
	// 					"icon": "fcm_push_icon"  //White icon Android resource
	// 				},
	// 				"data":{
	// 					"param1":"value1",  //Any data to be retrieved in the notification callback
	// 					"param2": $scope.data.message
	// 				},
	// 				"to":"fEVnIf_yg3M:APA91bHr01U7aHTmW_wojaLUbAXH1xHoFChpgWW_Lcku6x4eQZyB_w4iyg2ZVOfPOCtmtrQJvbwCIBeGtOhq5RpAkFzAO5KwYdN93xLG65EC9ZzG3LpmFuRV16EcbgegAauvsXhx_F3v", //Topic or single device
	// 				"priority":"high", //If not set, notification won't be delivered on completely closed iOS app
	// 				"restricted_package_name":"" //Optional. Set for application filtering
	// 		})
	// 	}).success(function(data){
	// 		console.log("Success: " + JSON.stringify(data));
	// 	}).error(function(data){
	// 		console.log("Error: " + JSON.stringify(data));
	// 	});
	// }

})