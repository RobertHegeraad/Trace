// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'controllers'])

.run(function($ionicPlatform, $BLE) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs).
    // The reason we default this to hidden is that native apps don't usually show an accessory bar, at 
    // least on iOS. It's a dead giveaway that an app is using a Web View. However, it's sometimes
    // useful especially with forms, though we would prefer giving the user a little more room
    // to interact with the app.
    if(window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // Set the statusbar to use the default style, tweak this to
      // remove the status bar on iOS or change it to use white instead of dark colors.
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

  $stateProvider

  .state('debug', {
    url: '/debug',
    views: {
      'MainContent': {
        templateUrl: 'debug.html'
      }
    }
  })

  .state('light', {
    url: '/light',
    views: {
      'MainContent': {
        templateUrl: 'light.html'
      }
    }
  })

  .state('start', {
    url: '/start',
    views: {
      'MainContent': {
        templateUrl: 'start.html'
      }
    }
  })
  
  .state('products', {
    url: '/products',
    views: {
      'MainContent': {
        templateUrl: 'products.html'
      }
    }
  })

  .state('badkamer', {
    url: '/badkamer',
    views: {
      'MainContent': {
        templateUrl: 'badkamer.html'
      }
    }
  })

  .state('badkameracc', {
    url: '/badkameracc',
    views: {
      'MainContent': {
        templateUrl: 'badkameracc.html'
      }
    }
  })

  $urlRouterProvider.otherwise("/start");
  // $urlRouterProvider.otherwise("/debug");
})

/*
 * https://github.com/randdusing/BluetoothLE
 *
 * https://github.com/dobots/crownstone-app/blob/master/www/js/ble.js
 */
.factory('$BLE', function($rootScope) {
    return {

      // Power Service
      powerServiceUuid:                       '5b8d0000-6f20-11e4-b116-123b93f75cba',
      // Power Service - Characteristics
      pwmUuid:                                '5b8d0001-6f20-11e4-b116-123b93f75cba',
      sampleCurrentUuid:                      '5b8d0002-6f20-11e4-b116-123b93f75cba',
      currentCurveUuid:                       '5b8d0003-6f20-11e4-b116-123b93f75cba',
      currentConsumptionUuid:                 '5b8d0004-6f20-11e4-b116-123b93f75cba',
      currentLimitUuid:                       '5b8d0005-6f20-11e4-b116-123b93f75cba',

      Init: function(s, f) {
          console.log('BLE init');
          bluetoothle.initialize(s, f, {request:true});
      },

      Subscribe: function(s, f, params) {
        bluetoothle.subscribe(s, f, params);
      },

      DiscoverServices: function(s, f, address) {
        bluetoothle.discover(s, f, {
          'address': address
        });
      },

      // value 0 - 255
      BytesToEncodedString: function(u8, value) {
        return bluetoothle.bytesToEncodedString(u8);
      },

      Write: function(s, f, params) {
        bluetoothle.write(s, f, params);
      },

      /*
       * Returns RSSI 0 - 128, higher is closer
       */
      Rssi: function(s, f, address) {
        console.log('BLE RSSI');
        bluetoothle.rssi(s, f, {
          'address': address
        });
      },

      StartScan: function(s, f) {
        bluetoothle.startScan(s, f, []);
      },

      StopScan: function(s, f) {
        bluetoothle.stopScan(s, f);
      },

      RetrieveConnected: function(s, f) {
        console.log('BLE retrieveConnected');
        bluetoothle.retrieveConnected(s, f, {});
      },

      /*
       * Discover all the devices services, characteristics and descriptors.
       * Doesn't need to be called again after disconnecting and then reconnecting.
       * Android support only.
       */
      Discover: function(s, f, address) {
        console.log('BLE discover');

        bluetoothle.discover(s, f, {
          "address": address
        });
      },

      /*
       * t5 CC:44:74:0E:08:2A
       * t5 CE:9E:48:0E:7C:52
       */
      Connect: function(s, f, address) {
        // 6C:71:D9:9D:64:EE -> Robert PC
        bluetoothle.connect(s, f, {
          'address': address
        });
      },

      Disconnect: function(s, f, address) {
        console.log('BLE disconnect');

        bluetoothle.disconnect(s, f, {
          "address": address
        })
      },

      Reconnect: function(s, f, address) {
        console.log('BLE reconnect');

        bluetoothle.reconnect(s, f, {
          "address": address
        })
      },

      Close: function(s, f, address) {
        console.log('BLE close ' + address);

        bluetoothle.close(s, f, {
          "address": address
        })
      },

      /*
       * Check if a device is connected
       */
      IsConnected: function(address) {
        var connected;
        bluetoothle.isConnected(connected, {
          "address": address
        });
        return connected;
      }
    };
})


/*
 * ID: 00:6A:8E:16:C8:EB
 * Class: 7936
 * Address: 6C:71:D9:9D:64:EE
 * Name: Naambordje
 */
.factory('$BL', function($rootScope) {
    var methods = {};

      methods.Init = function(s, f) {
          console.log('BL init');
          bluetoothSerial.enable(function(data) {
            console.log('BL init success');
            console.log(JSON.stringify(data));

            s(data);
          }, function(data) {
            console.log('BL init failed');
            console.log(JSON.stringify(data));
            f(data);
          });
      }

      /*
       * connects to a Bluetooth device. The callback is long running.
       */
      methods.Connect = function(mac, s, f) {
          console.log('BL connecting...');
          bluetoothSerial.connect('00:6A:8E:16:C8:EB', function(data) {
            console.log('BL connect success');
            console.log(JSON.stringify(data));

            s(data);
          }, function(data) {
            console.log('BL connect failed');
            console.log(JSON.stringify(data));

            f(data);

            // Attempt to reconnect once
            bluetoothSerial.connect('00:6A:8E:16:C8:EB', function(data) {
              console.log('reconnect succcess');
              console.log(JSON.stringify(data));

              s(data);
            }, function(data) {
              console.log('reconnect failed');
              console.log(JSON.stringify(data));

              f(data);
            });
          });
      }

      methods.IsConnected = function() {
        console.log('check is connected');
        bluetoothSerial.isConnected(function() {
          return true;
        }, function() {
          return false;
        });
      }

      methods.Write = function(data, s, f) {
        console.log('writing...');
        bluetoothSerial.write("hello", function(data) {
          console.log('BL write success');
          console.log(JSON.stringify(data));
        }, function(data) {
          console.log('BL write failed');
          console.log(JSON.stringify(data));
        });
      }

      methods.Read = function(s, f) {
       bluetoothSerial.read(function(data) {
        // console.log('BL read success');
        // console.log(JSON.stringify(data));

          s(data);
       }, function(data) {
        // console.log('BL read failed');
        // console.log(JSON.stringify(data));

          f(data);
       }); 
      }

      methods.Clear = function() {
        bluetoothSerial.clear(function() {
          console.log('clear success');
        }, function() {
          console.log('clear fail');
        });
      }

      methods.EndlessRead = function(s, f) {
        methods.Read(function(data) {
          s(data);
        }, function(data) {
          f(data);
        });
      }

      /*
       * Lists paired devices
       */
      methods.List = function(s, f) {
        bluetoothSerial.list(function(data) {
          console.log('BL list success');
          console.log(JSON.stringify(data));
        }, function(data) {
          console.log('BL list failed');
          console.log(JSON.stringify(data));
        });
      }

      methods.Subscribe = function() {
        bluetoothSerial.subscribe('\n', function (data) {
            console.log('BL subscribe success');
            console.log(JSON.stringify(data));
        }, function(data) {
            console.log('BL subscribe fail');
            console.log(JSON.stringify(data));
        });
      }

      methods.DiscoverUnpaired = function() {
        bluetoothSerial.discoverUnpaired(function (data) {
            console.log('BL discover unpaired success');
            console.log(JSON.stringify(data));
        }, function(data) {
            console.log('BL discover unpaired fail');
            console.log(JSON.stringify(data));
        });
      }


      return methods;
})

/* ----------------------------------------------------------------------------------------
 * NOTICES
 *
 * Notices for user
 */
.factory('$notice', function() {

  return {    
    /*
     * Check if there is a notice from a previous page
     *
     * @param The number of miliseconds to show the flash notice
     */
    check: function(ms) {
        if(store.has('notice')) {
            this.show(store.get('notice'), ms);
            store.remove('notice');
        }
    },

    /*
     * Set a notice for the next page (slide/redirect)
     *
     * @param A language string form the ./locale folder
     */
    flash: function(string) {
        store.set('notice', string);
    },

    /*
     * Show a notice for a few seconds
     *
     * @param A language string from the ./locale folder
     * @param The number of miliseconds the notice is visible
     */
    show: function(string, ms) {
        ms = ms || 2000;

        var $notice = $('#notice');

        $notice.html('<div>' + string + '</div>').fadeIn(400);

        setTimeout(function() {
            $notice.fadeOut(400);
        }, ms);
    },

    /*
     * Show a notice that can't be closed
     *
     * @param A language string form the ./locale folder
     */
    stick: function(string) {
        $('#notice').html('<div>' + string + '</div>').fadeIn(400).addClass('pulse');
    },

    /*
     * Close a notice
     */
    close: function() {
        $('#notice').fadeOut(400);
    }
  };
});