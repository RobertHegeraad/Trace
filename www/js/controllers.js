angular.module('controllers', [])

.controller('startCtrl', function($scope, $rootScope, $compile, $BLE, $location) {

  // LIFECYCLE
  // ---------
  // initialize
  // scan (if device address is unknown)
  // connect
  // discover (Android) OR services/characteristics/descriptors (iOS)
  // read/subscribe/write characteristics/descriptors
  // disconnect
  // close

  // Is trace connected
  $scope.connected = true;

  // Was a session started
  $scope.session = false;

  $scope.init = function() {
    
  }

  $scope.$on('$ionicView.loaded', function(event) {
    $scope.stopSession();
  });

  $scope.connectTrace = function() {

    // Connect
    
    $scope.connected = true;
    
    $location.path('/dashboard');
  }

  $scope.startSession = function() {
      
    // $BLE.Init(function() {
    //   $scope.connect({
    //     'address': 'C1:15:52:B4:AA:BA'
    //   });
    // });

    $rootScope.$emit('startSession');
    $scope.session = true;
  }

  $scope.stopSession = function() {
    $rootScope.$emit('stopSession');
    $scope.session = false;
    // $BLE.Disconnect();
  }

  var connected = false;
  var connecting = false;
  var connectInterval;
  $scope.connect = function(device) {
    if(!(connected || connecting)) {
      connecting = true;

      $BLE.Connect(function(data) { // Connect pending / success
        connecting = false;

        if(data.status == 'connected') {
          connected = true;
          clearInterval(connectInterval);

          // alert('connected');

          // Alleen voor test power
            // $scope.writePWM(address, 255, function() {
            //   console.log('written 255');
            // }, function() {
            //   console.log('failed to write 255');
            // });

          // Alleen voor sprint demo
          // $scope.watchRssi(paramsObj.address);


          // Discover services --------------------------------------------------------
          $scope.discoverServices(function(obj) {
            // obj.services // array
            // serviceUuid, characteristicUuid
            if(obj.status == 'discovered') {
              alert('discovering services success');

              alert(JSON.stringify(obj.services));

              var services = obj.services;
              for (var i = 0; i < services.length; ++i) {
                var serviceUuid = services[i].serviceUuid;
                var characteristics = services[i].characteristics;
                for (var j = 0; j < characteristics.length; ++j) {
                  var characteristicUuid = characteristics[j].characteristicUuid;
                  // alert("Found service " + serviceUuid + " with characteristic " + characteristicUuid);

                  if (serviceUuid == $BLE.UARTServiceUUID && characteristicUuid == $BLE.RXCharacteristicUUID) {
                      alert('Able to read');

                      var readObj = {
                        'address': device.address,
                        'service': serviceUuid,
                        'characteristic': characteristicUuid
                      };

                      alert(JSON.stringify(readObj));

                      $scope.subscribe(readObj);
                  }
                }
              }
            } else {
              console.log('failed to discover services');              
            }
          }, function(obj) {
            console.log('discovering services error: ' + obj.error + ' message: ' + obj.message);
          }, device.address);
          
        } else if(data.status == 'connecting') {
          // connecting
        } else {
          connected = false;
          $BLE.Disconnect();
        
          // connect timed out, will attempt reconnect
          alert('connection timed out, reconnecting...');
          // $scope.connect(crownstone);
          return;
        }
      
      }, function(data) { // Failed to connect
        connecting = false;
        connected = false;
        $BLE.Disconnect();

        if(data.error == 'connect') {
          // connection error, will attempt reconnect
          alert('connection failed, reconnecting...');

          // setTimeout(function() {
          //   $scope.connect(crownstone);
          // }, 2000);
          return;
        } else {
          alert('connection failed, final');
          // connection error
        }

      }, device.address);
    }
  }

  $scope.subscribe = function(params) {
    $BLE.Subscribe(function(data) {
      alert(JSON.stringify(data));
    }, function(error) {
      alert(JSON.stringify(error));
    }, params);
  }

  $scope.read = function(params) {
    $BLE.Read(function(data) {
      alert(JSON.stringify(data));
    }, function(error) {
      alert(JSON.stringify(error));
    }, params);
  }

  $scope.discoverServices = function(s, f, address) {
    $BLE.DiscoverServices(s, f, address);
  }
})

.controller('dashboardCtrl', function($scope, $rootScope, $combinations, $BLE, $location, $notice) {  /* ___________________________________________________________________________________________________________ */

  $scope.showMyTricks = true;

  $scope.tricks = [
    {
      id: 001,
      name: 'Kickflip',
      count: 2,
      trick: {
        flip: $combinations.flip.KICKFLIP
      }
    },
    {
      id: 002,
      name: 'Heelflip',
      count: 0,
      trick: {
        flip: $combinations.flip.HEELFLIP
      }
    },
    {
      id: 003,
      name: 'Pop Shove-it',
      count: 1,
      trick: {
        rotation: $combinations.rotation.HALF,
        spin: $combinations.spin.BACKSIDE
      }
    },
    {
      id: 003,
      name: 'FS Shove-it',
      count: 0,
      trick: {
        rotation: $combinations.rotation.HALF,
        spin: $combinations.spin.FRONTSIDE
      }
    },
    {
      id: 004,
      name: 'Varial kickflip',
      count: 0,
      trick: {
        rotation: $combinations.rotation.HALF,
        spin: $combinations.spin.BACKSIDE,
        flip: $combinations.flip.KICKFLIP
      }
    },
    {
      id: 005,
      name: 'Varial heelflip',
      count: 0,
      trick: {
        rotation: $combinations.rotation.HALF,
        spin: $combinations.spin.FRONTSIDE,
        flip: $combinations.flip.HEELFLIP
      }
    },
    {
      id: 006,
      name: 'Hardflip',
      count: 0,
      trick: {
        rotation: $combinations.rotation.HALF,
        spin: $combinations.spin.FRONTSIDE,
        flip: $combinations.flip.KICKFLIP
      }
    },
    {
      id: 007,
      name: 'Inward heelflip',
      count: 0,
      trick: {
        rotation: $combinations.rotation.HALF,
        spin: $combinations.spin.BACKSIDE,
        flip: $combinations.flip.HEELFLIP
      }
    },
    {
      id: 008,
      name: '360 flip',
      count: 0,
      trick: {
        rotation: $combinations.rotation.FULL,
        spin: $combinations.spin.BACKSIDE,
        flip: $combinations.flip.KICKFLIP
      }
    },
    {
      id: 009,
      name: '360 heelflip',
      count: 0,
      trick: {
        rotation: $combinations.rotation.FULL,
        spin: $combinations.spin.FRONTSIDE,
        flip: $combinations.flip.HEELFLIP
      }
    },
    {
      id: 010,
      name: '360 hardflip',
      count: 0,
      trick: {
        rotation: $combinations.rotation.FULL,
        spin: $combinations.spin.FRONTSIDE,
        flip: $combinations.flip.KICKFLIP
      }
    },
    {
      id: 011,
      name: '360 inward heelflip',
      count: 0,
      trick: {
        rotation: $combinations.rotation.FULL,
        spin: $combinations.spin.BACKSIDE,
        flip: $combinations.flip.HEELFLIP
      }
    }
  ];

  $scope.board = {
    x: 0,
    y: 0,
    z: 0
  },

  $scope.simulateInterval = null;

  $scope.init = function() {

    if($BLE.device == null) {
      $location.path('/');
    }
  }

  $rootScope.$on('startSession', function(event) {
    // Watch rotation
    // $BLE.subscribe($scope.subscribeSuccess, $scope.subscribeError, {
    //   'address': 'C1:15:52:B4:AA:BA',  // device.address = 'C1:15:52:B4:AA:BA'
    //   'service': $BLE.UARTServiceUUID,
    //   'characteristic': $BLE.RXCharacteristicUUID
    // });

    // Simulate rotation
    $scope.simulate($scope.subscribeSuccess);
  });

  $rootScope.$on('stopSession', function(event) {
    $scope.stopSimulate();
  });

  $scope.simulate = function(fn) {
    var step = 60,
          x = 0,
          y = 0;

    // simulate a random trick every 5 seconds
    $scope.simulateInterval = setInterval(function() {
      var stepX,
          stepY;

      // Get random rotation on the X axis
      var random = Math.random();
      if(random > 0.5) {
        stepX = 0;
      } else {
        stepX = 60;
      }

      // Get random rotation on the Y axis
      random = Math.random();
      if(random > 0.6) {
        stepY = 0;
      } else if(random > 0.3) {
        stepY = 30;
      } else {
        stepY = 60;
      }

      // Get random direction
      var directionX = Math.random() < 0.5 ? -1 : 1;
      var directionY = Math.random() < 0.5 ? -1 : 1;

      // Simulate rotation every 100ms
      var interval = setInterval(function() {
        x += stepX * directionX;
        y += stepY * directionY;

        fn({
          x: x,
          y: y
        });

        if(Math.abs(x) >= $combinations.endpoints.x ||
           Math.abs(y) >= $combinations.endpoints.y) {
          x = 0;
          y = 0;
          clearInterval(interval);
        }
      }, 100);
    
    }, 5000);
  }

  $scope.stopSimulate = function() {
    clearInterval($scope.simulateInterval);
  }

  $scope.subscribeSuccess = function(data) {
      if(data.x != 0 || data.y != 0)
        console.log(JSON.stringify(data));

      // Wanneer start een trick? -> beweging vanaf ruststand
      // leg je skateboard op de grond voordat je connect
      // ruststand direct meesturen met connect

      var trick = {};

      // Get directions
      trick.flip = (data.x > $scope.board.x) ? $combinations.flip.KICKFLIP : $combinations.flip.HEELFLIP;
      trick.spin = (data.y > $scope.board.y) ? $combinations.spin.FRONTSIDE : $combinations.spin.BACKSIDE;

      // Get rotation
      if(Math.abs(data.y) > ($combinations.endpoints.y / 2) - $combinations.endpoints.margin &&
         Math.abs(data.y) < ($combinations.endpoints.y / 2) + $combinations.endpoints.margin)
      {
        trick.rotation = $combinations.rotation.HALF;
      }
      else if(Math.abs(data.y) > ($combinations.endpoints.y) - $combinations.endpoints.margin &&
              Math.abs(data.y) < ($combinations.endpoints.y) + $combinations.endpoints.margin)
      {
        trick.rotation = $combinations.rotation.FULL;
      }

      // Update board
      $scope.board.x = data.x;
      $scope.board.y = data.y;

      if(Math.abs(data.x) >= $combinations.endpoints.x) { // Full flip
        // console.log('full flip');

        // Remove spin if there is no rotation
        if(trick.rotation == null) {
          delete trick.spin;
        }

        // Is het skateboard weer op zijn wielen?

        // console.log('trick complete');
        $scope.addTrick(trick);
      }
  }

  $scope.subscribeError = function(error) {
      alert(JSON.stringify(error));
  }

  $scope.addTrick = function(trick) {
    // console.log(trick);

    for(var i=0; i<$scope.tricks.length; i++) {
      // console.log(trick);
      // console.log($scope.tricks[i].trick);
      
      if(angular.equals(trick, $scope.tricks[i].trick)) {
        $scope.tricks[i].count++;
        $scope.$apply();
        console.log($scope.tricks[i]);

        $rootScope.$emit('checkMedal', { 
          id: $scope.tricks[i].id,
          name: $scope.tricks[i].name,
          count: $scope.tricks[i].count
        });

        break;

        // Refresh trick list
      }
    }
  }
})

.controller('medalsCtrl', function($scope, $rootScope, $notice) {  /* ___________________________________________________________________________________________________________ */

  $scope.medals = {
    "1": "Do 3 kickflips today",
    "8": "360 degrees (do a 360 flip)"
  };

  $scope.init = function() {

  }

  $rootScope.$on('checkMedal', function(event, args) {
    // var medal = $scope.medals[args.id];

    if(args.count % 5 == 0) {
      $notice.success("You've earned a badge: Land " + args.count + " " + args.name + "s");  
    } else {
        $notice.show("You've landed a " + args.name);
    }

    // if(medal != null) {
    //   $notice.success("You've earned a badge: " + medal);
    // }
  });
});