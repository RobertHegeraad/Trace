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

  .state('start', {
    url: '/start',
    views: {
      'MainContent': {
        templateUrl: 'start.html'
      }
    }
  })

  .state('dashboard', {
    url: '/dashboard',
    views: {
      'MainContent': {
        templateUrl: 'dashboard.html'
      }
    }
  })
  
  .state('medals', {
    url: '/medals',
    views: {
      'MainContent': {
        templateUrl: 'medals.html'
      }
    }
  })

  $urlRouterProvider.otherwise("/start");
  // $urlRouterProvider.otherwise("/debug");
})

.factory('$combinations', function($rootScope) {
  return {
      flip: {
        KICKFLIP: 0,
        HEELFLIP: 1
      },

      spin: {
        FRONTSIDE: 0,
        BACKSIDE: 1
      },

      rotation: {
        HALF: 0,
        FULL: 1
      },

      endpoints: {
        x: 360,
        y: 360,
        z: 0,  // Landed
        step: 60,
        margin: 20
      }
  };
})

.factory('$notice', function($rootScope) {
  return {
      check: function(ms) {
          if(store.has('notice')) {
              this.show(store.get('notice'), ms);
              store.remove('notice');
          }
      },

      flash: function(string) {
          store.set('notice', string);
      },

      show: function(string, ms) {
          ms = ms || 2000;

          var $notice = $('#notice');

          $notice.html('<div>' + string + '</div>').fadeIn(400);

          setTimeout(function() {
              $notice.fadeOut(400);
          }, ms);
      },

      success: function(string, ms) {
          ms = ms || 2000;

          var $notice = $('#notice');

          $notice.addClass('notice-success');
          $notice.html('<div>' + string + '</div>').fadeIn(400);

          setTimeout(function() {
              $notice.fadeOut(400);
              $notice.removeClass('notice-success');
          }, ms);
      },

      stick: function(string) {
          $('#notice').html('<div>' + string + '</div>').fadeIn(400).addClass('pulse');
      },

      close: function() {
          $('#notice').fadeOut(400);
      }
  };
})

.factory('$storage', function($rootScope) {
  return {
      has: function(key) {
        var item = window.localStorage.getItem(key);
        if(item !== null && item !== undefined) {
          return true;
        }
        return false;
      },

      set: function(key, value) {
        window.localStorage[key] = JSON.stringify(value);
      },

      get: function(key) {
        return JSON.parse(window.localStorage[key]);
      },

      save: function(key, value) {
        this.set(key, value);
        return this.get(key);
      },

      remove: function(key) {
          window.localStorage.removeItem(key);
      },

      clear: function() {
          window.localStorage.clear();
      }
  };
})

/*
 * https://github.com/randdusing/BluetoothLE
 *
 * https://github.com/dobots/crownstone-app/blob/master/www/js/ble.js
 */
.factory('$BLE', function($rootScope) {
    return {

      device: null,

      device: {
        address: 'C1:15:52:B4:AA:BA'
      },

      UARTServiceUUID: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
      TXCharacteristicUUID: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
      RXCharacteristicUUID: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",

      Init: function(s, f) {
          bluetoothle.initialize(s, f, {request:true});
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
      },

      /*
       * Subsribe to a service
       */
      Subscribe: function(s, f, params) {
        bluetoothle.subscribe(s, f, params);
      },

      /*
       * Read from a service
       */
      Read: function(s, f, params) {
        bluetoothle.read(s, f, params);
      }
    };
});