angular.module('controllers', [])


// CROWNSTONE CONTROLLER ------------------------------------------------------------------------------------------------------ 

.controller('crownstoneCtrl', function($scope, $compile, $BLE) {
    // Scan crownstones
    // Connect to closest crownstone
    // Read/Write to crownstone

    // Power Service
  var powerServiceUuid =                       '5b8d0000-6f20-11e4-b116-123b93f75cba';
  // Power Service - Characteristics
  var pwmUuid =                                '5b8d0001-6f20-11e4-b116-123b93f75cba';
  var sampleCurrentUuid =                      '5b8d0002-6f20-11e4-b116-123b93f75cba';
  var currentCurveUuid =                       '5b8d0003-6f20-11e4-b116-123b93f75cba';
  var currentConsumptionUuid =                 '5b8d0004-6f20-11e4-b116-123b93f75cba';
  var currentLimitUuid =                       '5b8d0005-6f20-11e4-b116-123b93f75cba';

  $scope.TogglePower = function() {
    $('.light-bulb').toggleClass('light-bulb-on');
  }

  $scope.PowerOn = function() {
    $('.light-bulb').addClass('light-bulb-on');
  }

  $scope.PowerOff = function() {
    $('.light-bulb').removeClass('light-bulb-on');
  }

  $scope.init = function() {
    console.log("Find crownstones");
      
    $BLE.Init(function() {
      var map = {};

      $scope.findCrownstones(function(obj) {
        // Crownstone found
        console.log(JSON.stringify(obj));
        
        if(obj.status != "scanStarted") {
          map[obj.address] = {'name': obj.name, 'rssi': obj.rssi, 'address': obj.address};

          var closest_rssi = -128,
              closest;
          for (var el in map) {
            console.log(el);
            if (map[el]['rssi'] > closest_rssi) {
              closest_rssi = map[el]['rssi'];
              closest = map[el];
            }
          }

          $BLE.StopScan();
          clearInterval(findTimer);

          console.log('CLOSEST');
          console.log(JSON.stringify(closest));

          // Connect to the closest
          $scope.connect(closest);
        }
      });
    });
  }

  var findTimer;
  $scope.findCrownstones = function(callback) {

      $BLE.StartScan(callback);
      findTimer = setInterval(function() {
        console.log("restart scan");
        $BLE.StopScan();
        $BLE.StartScan(callback);
      }, 2000);
  }

  $scope.stopSearching = function() {
    console.log('stop searching');
    $BLE.StopScan();
    $BLE.Disconnect();
    clearInterval(findTimer);
    clearInterval(rssiInterval);
  }

  var connected = false;
  var connecting = false;
  var connectInterval;
  $scope.connect = function(crownstone) {
    if(!(connected || connecting)) {
      connecting = true;

      // var paramsObj = {"address": crownstone.address};
      var paramsObj = {"address": 'CE:9E:48:0E:7C:52'};
      // var paramsObj = {"address": '9C:D3:5B:1D:11:14'};

      $BLE.Connect(function(data) { // Connect pending / success
        connecting = false;

        if(data.status == 'connected') {
          connected = true;
          clearInterval(connectInterval);

          console.log('connected');


          // Discover services --------------------------------------------------------
          $scope.discoverServices(function(obj) {
            // obj.services // array
            // serviceUuid, characteristicUuid
            if(obj.status == 'discovered') {
              console.log('discovering services success');

              console.log(JSON.stringify(obj.services));


              var services = obj.services;
              for (var i = 0; i < services.length; ++i) {
                var serviceUuid = services[i].serviceUuid;
                var characteristics = services[i].characteristics;
                for (var j = 0; j < characteristics.length; ++j) {
                  var characteristicUuid = characteristics[j].characteristicUuid;
                  console.log("Found service " + serviceUuid + " with characteristic " + characteristicUuid);

                  if (serviceUuid == powerServiceUuid) {
                    if (characteristicUuid == pwmUuid) {
                      console.log('Able to sent power');

                      $scope.watchRssi(data.address);
                    }
                  }
                }
              }
            } else {
              console.log('failed to discover services');              
            }
          }, function(obj) {
            console.log('discovering services error: ' + obj.error + ' message: ' + obj.message);
          }, paramsObj.address);
          
        } else if(data.status == 'connecting') {
          // connecting
        } else {
          connected = false;
          $BLE.Disconnect();
        
          // connect timed out, will attempt reconnect
          console.log('connection timed out, reconnecting...');
          // $scope.connect(crownstone);
          return;
        }
      
      }, function(data) { // Failed to connect
        connecting = false;
        connected = false;
        $BLE.Disconnect();

        if(data.error == 'connect') {
          // connection error, will attempt reconnect
          console.log('connection failed, reconnecting...');

          setTimeout(function() {
            $scope.connect(crownstone);
          }, 2000);
          return;
        } else {
          console.log('connection failed');
          // connection error
        }

      }, paramsObj.address); // 'CE:9E:48:0E:7C:52' = crownstone
    }
  }

  var rssiInterval;
  var latest;
  $scope.watchRssi = function(address) {
    // if(connected) {
      setInterval(function() {
        $BLE.Rssi(function(data) {

          $('#rssi').html(data.rssi);

          console.log('rssi success');
          console.log(JSON.stringify(data));
          // console.log(data.rssi);

          latest = data.rssi;

          if(data.rssi > -60) { // -60 = ~20cm??

            if(latest >= data.rssi) {
              // Turn on light
              $scope.PowerOn();

              $scope.writePWM(address, 255, function() {
                console.log('written 255');
              }, function() {
                console.log('failed to write 255');
              });
            }

          } else {  // Restart scan??
            // Turn off light
            $scope.PowerOff();

            if(latest <= data.rssi) {
              $scope.writePWM(address, 0, function() {
                console.log('written 0');
              }, function() {
                console.log('failed to write 0');
              });
            }
          }
        }, function(data) {
          console.log('rssi failed');
          console.log(JSON.stringify(data));
          // Turn off light
            $scope.PowerOff();

          $scope.writePWM(address, 0, function() {
            console.log('written 0');
          }, function() {
              console.log('failed to write 0');
          });
        }, address); 
      }, 4000);
    // }
  }

  $scope.writePWM = function(address, value, successCB, errorCB) {
    var u8 = new Uint8Array(1);
    u8[0] = value;
    var v = $BLE.BytesToEncodedString(u8);
    console.log("Write " + v + " at service " + powerServiceUuid + ' and characteristic ' + pwmUuid + ' to address ' + address);
    var paramsObj = {"address": address, "serviceUuid": powerServiceUuid, "characteristicUuid": pwmUuid , "value" : v};
    $BLE.Write(function(obj) { // write success
        if (obj.status == 'written') {
          console.log('Successfully written to pwm characteristic - ' + obj.status);

          if (successCB) successCB();
        } else {
          console.log('Writing to pwm characteristic was not successful' + obj);

          if (errorCB) errorCB();
        }
      },
      function(obj) { // write error
        console.log("Error in writing to pwm characteristic: " + obj.error + " - " + obj.message);

        if (errorCB) errorCB();
      },
      paramsObj);
  }

  $scope.discoverServices = function(s, f, address) {
    $BLE.DiscoverServices(s, f, address);
  }
})



// START CONTROLLER ------------------------------------------------------------------------------------------------------ 

.controller('startCtrl', function($scope, $compile, $BL, $BLE) {

  // Power Service
  var powerServiceUuid =                       '5b8d0000-6f20-11e4-b116-123b93f75cba';
  // Power Service - Characteristics
  var pwmUuid =                                '5b8d0001-6f20-11e4-b116-123b93f75cba';
  var sampleCurrentUuid =                      '5b8d0002-6f20-11e4-b116-123b93f75cba';
  var currentCurveUuid =                       '5b8d0003-6f20-11e4-b116-123b93f75cba';
  var currentConsumptionUuid =                 '5b8d0004-6f20-11e4-b116-123b93f75cba';
  var currentLimitUuid =                       '5b8d0005-6f20-11e4-b116-123b93f75cba';

  $scope.interval = false;

  $scope.oldData = "";
  


  /*
   * Notification if an area is busy
   */
  $scope.Notify = function() {
    // Check if a message was sent

    // Check nearby employees

    // Show message

    console.log("De slaapkamer afdeling kan wat hulp gebruiken");
  }

  // setInterval($scope.Notify, 2000);

  $scope.writePWM = function(address, value, successCB, errorCB) {
    var u8 = new Uint8Array(1);
    u8[0] = value;
    var v = $BLE.BytesToEncodedString(u8);
    console.log("Write " + v + " at service " + powerServiceUuid + ' and characteristic ' + pwmUuid + ' to address ' + address);
    var paramsObj = {"address": address, "serviceUuid": powerServiceUuid, "characteristicUuid": pwmUuid , "value" : v};
    $BLE.Write(function(obj) { // write success
        if (obj.status == 'written') {
          console.log('Successfully written to pwm characteristic - ' + obj.status);

          if (successCB) successCB();
        } else {
          console.log('Writing to pwm characteristic was not successful' + obj);

          if (errorCB) errorCB();
        }
      },
      function(obj) { // write error
        console.log("Error in writing to pwm characteristic: " + obj.error + " - " + obj.message);

        if (errorCB) errorCB();
      },
      paramsObj);
  }


  $scope.ReadEmployee = function() {
    $BL.Read(function(data) {
      console.log('Read success');
      console.log(JSON.stringify(data));

      if(data != "" && data != undefined && data != null && data != "emplyee_busy:false" && data != $scope.oldData) {

        // Change the status
        $scope.ToggleStatus();
        $BL.Clear();
      } else {
        console.log('data undefined');
      }
    }, function(data) {
      console.log('Read fail, turn on lamp');
      console.log(JSON.stringify(data));
      
      // Turn on
      $scope.TurnOn();

      $statusBtn.removeClass('status-busy');
      $statusBtn.addClass('status-ready');
      $statusBtn.html('Je bent beschikbaar');
    });

    // Clear the previous interval
    clearInterval($scope.interval);

    // if($BL.inConnected) {
      console.log('reading again');
      // Read again after 1 second
      $scope.interval = window.setInterval($scope.ReadEmployee, 2000);
    // }
  }

  $scope.PairEmployee = function() {
    // connect and subscribe to arduino

  // $BLE.Connect(function(data) { // Connect pending / success
  //   console.log('connect');
  // }, function(data) { // Failed to connect
  //   if(data.error == 'connect') {
  //     // connection error, will attempt reconnect
  //     console.log('connection failed, reconnecting...');
  //   } else {
  //     console.log('connection failed');
  //     // connection error
  //   }
  // }, 'FD:48:E6:0E:D6:EE'); // 'CE:9E:48:0E:7C:52' = crownstone

    $BLE.Subscribe(function(data) {
      console.log(data.status);

      if(data.status == 'subscribedResult') {
        $scope.ToggleStatus();
      }
    }, function(data) {
      console.log('subscribe failed');
    }, {
      "address": 'FD:48:E6:0E:D6:EE',
      "serviceUuid": "00002220-0000-1000-80000-00805f9b34fb",
      "characteristicUuid": "00002221-0000-1000-80000-00805f9b34fb",
      "isNotification" : true
    });

    // // loop read
    // console.log('Pair employee');
    // $BL.Init(function(data) {

    //   console.log('employee init');
    //   if( ! $BL.IsConnected()) {
    //     console.log('employee not connected');

    //     $BL.Connect('', function(data) {
    //       console.log('employee connect');

    //       $scope.ReadEmployee();
          
    //     }, function(data) {
    //         console.log('empolyee connect fail');
    //       // connect error
    //     });
    //   } else {
    //     console.log('empolyee connected');

    //     $scope.ReadEmployee();
    //   }
    // }, function(data) {
    //   // init fail
    // });
  }

  /*
   * Toggle the status
   */
  $scope.ToggleStatus = function() {
    var $statusBtn = $('#status-btn');

    if($statusBtn.hasClass('status-ready')) {
      $statusBtn.removeClass('status-ready');
      $statusBtn.addClass('status-busy');
      $statusBtn.html('Je bent bezig');

      $scope.TurnOff();
    } else {
      $statusBtn.removeClass('status-busy');
      $statusBtn.addClass('status-ready');
      $statusBtn.html('Je bent beschikbaar');

      $scope.TurnOn();
    }
  }

  /*
   * Turn the light on
   */
  $scope.TurnOn = function() {
    // $BLE.Init(function() {
      $scope.writePWM('CE:9E:48:0E:7C:52', 255, function() {
        console.log('written 255');
      }, function() {
          console.log('failed to write 255');
      });
    // });
  }

  /*
   * Turn the light off
   */
  $scope.TurnOff = function() {
    // $BLE.Init(function() {
      $scope.writePWM('CE:9E:48:0E:7C:52', 0, function() {
        console.log('written 0');
      }, function() {
          console.log('failed to write 0');
      });
    // });
  }
})



// PRODUCT CONTROLLER ------------------------------------------------------------------------------------------------------ 


.controller('productCtrl', function($scope, $BLE, $notice) {

  $scope.chosenColor = 'red';

  // Connect to the target crownstone and power the lamp

  var connected = false;
  var connecting = false;
  var connectInterval;
  $scope.connect = function(crownstone) {
    if(!(connected || connecting)) {
      connecting = true;

      // var paramsObj = {"address": crownstone.address};
      var paramsObj = {"address": 'CE:9E:48:0E:7C:52'};

      $BLE.StopScan();
      $BLE.Disconnect();

      $BLE.Connect(function(data, toggle) { // Connect pending / success
        connecting = false;

        if(data.status == 'connected') {
          connected = true;
          clearInterval(connectInterval);

          console.log('connected');


          // Discover services --------------------------------------------------------
          $scope.discoverServices(function(obj) {
            // obj.services // array
            // serviceUuid, characteristicUuid
            if(obj.status == 'discovered') {
              console.log('discovering services success');

              console.log(JSON.stringify(obj.services));


              var services = obj.services;
              for (var i = 0; i < services.length; ++i) {
                var serviceUuid = services[i].serviceUuid;
                var characteristics = services[i].characteristics;
                for (var j = 0; j < characteristics.length; ++j) {
                  var characteristicUuid = characteristics[j].characteristicUuid;
                  console.log("Found service " + serviceUuid + " with characteristic " + characteristicUuid);

                  if (serviceUuid == powerServiceUuid) {
                    if (characteristicUuid == pwmUuid) {
                      console.log('Able to sent power');

                      // Color meesturen?

                      if(toggle === true) {
                        $scope.writePWM(address, 255, function() {
                          console.log('written 255');
                        }, function() {
                            console.log('failed to write 255');
                        });
                      } else {
                        $scope.writePWM(address, 0, function() {
                          console.log('written 0');
                        }, function() {
                            console.log('failed to write 0');
                        });
                      }


                    }
                  }
                }
              }
            } else {
              console.log('failed to discover services');
            }
          }, function(obj) {
            console.log('discovering services error: ' + obj.error + ' message: ' + obj.message);
          }, paramsObj.address);
          
        } else if(data.status == 'connecting') {
          // connecting
        } else {
          connected = false;
          $BLE.Disconnect();
        
          // connect timed out, will attempt reconnect
          console.log('connection timed out, reconnecting...');
          // $scope.connect(crownstone);
          return;
        }
      
      }, function(data) { // Failed to connect
        connecting = false;
        connected = false;
        $BLE.Disconnect();

        if(data.error == 'connect') {
          // connection error, will attempt reconnect
          console.log('connection failed, reconnecting...');

          setTimeout(function() {
            $scope.connect(crownstone);
          }, 2000);
          return;
        } else {
          console.log('connection failed');
          // connection error
        }

      }, paramsObj.address); // 'CE:9E:48:0E:7C:52' = crownstone
    }
  }

  // Power Service
  var powerServiceUuid =                       '5b8d0000-6f20-11e4-b116-123b93f75cba';
  // Power Service - Characteristics
  var pwmUuid =                                '5b8d0001-6f20-11e4-b116-123b93f75cba';
  var sampleCurrentUuid =                      '5b8d0002-6f20-11e4-b116-123b93f75cba';
  var currentCurveUuid =                       '5b8d0003-6f20-11e4-b116-123b93f75cba';
  var currentConsumptionUuid =                 '5b8d0004-6f20-11e4-b116-123b93f75cba';
  var currentLimitUuid =                       '5b8d0005-6f20-11e4-b116-123b93f75cba';

  $scope.writePWM = function(address, value, successCB, errorCB) {
    var u8 = new Uint8Array(1);
    u8[0] = value;
    var v = $BLE.BytesToEncodedString(u8);
    console.log("Write " + v + " at service " + powerServiceUuid + ' and characteristic ' + pwmUuid + ' to address ' + address);
    var paramsObj = {"address": address, "serviceUuid": powerServiceUuid, "characteristicUuid": pwmUuid , "value" : v};
    $BLE.Write(function(obj) { // write success
        if (obj.status == 'written') {
          console.log('Successfully written to pwm characteristic - ' + obj.status);

          if (successCB) successCB();
        } else {
          console.log('Writing to pwm characteristic was not successful' + obj);

          if (errorCB) errorCB();
        }
      },
      function(obj) { // write error
        console.log("Error in writing to pwm characteristic: " + obj.error + " - " + obj.message);

        if (errorCB) errorCB();
      },
      paramsObj);
  }

  $scope.discoverServices = function(s, f, address) {
    $BLE.DiscoverServices(s, f, address);
  }

  $scope.color = function() {

    $('#color-picker').fadeToggle(200);
  },

  $scope.setColor = function(color, $event) {
    $scope.chosenColor = color;
    $('.color-picker-toggle').css('backgroundColor', color);
    $('#color-picker').fadeOut(200);
  },

  $scope.onToggle = function(value) {

    var $lampBtn = $('#lamp-btn');

    var colorvalue;
    if($scope.chosenColor == 'red') {
      colorvalue = 'rode';
    } else if($scope.chosenColor == 'blue') {
      colorvalue = 'blauwe';
    } else if($scope.chosenColor == 'green') {
      colorvalue = 'groene';
    } else if($scope.chosenColor == 'yellow') {
      colorvalue = 'gele';
    }

    if($lampBtn.data('toggle') == true) {
      $lampBtn.data('toggle', false);
      $lampBtn.addClass('lamp-btn-off').removeClass('lamp-btn-on').html('Lamp');

      $BLE.Init(function() {
        $scope.writePWM('CE:9E:48:0E:7C:52', 0, function() {
          console.log('written 0');
        }, function() {
            console.log('failed to write 0');
        });
      });

      $notice.show('Je hebt de lamp uitgezet');
    } else {
      $lampBtn.data('toggle', true);
      $lampBtn.addClass('lamp-btn-on').removeClass('lamp-btn-off').html('Lamp');
      
      $BLE.Init(function() {
        $scope.writePWM('CE:9E:48:0E:7C:52', 255, function() {
          console.log('written 255');
        }, function() {
            console.log('failed to write 255');
        });
      });

      $notice.show('Je hebt een ' + colorvalue + ' lamp aangezet');
    }
  }
})












/* ------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------- */


.controller('debugCtrl', function($scope, $BLE, $compile, $BL) {

  // LIFECYCLE
  // ---------
  // initialize
  // scan (if device address is unknown)
  // connect
  // discover (Android) OR services/characteristics/descriptors (iOS)
  // read/subscribe/write characteristics/descriptors
  // disconnect
  // close

  $scope.address = '6C:71:D9:9D:64:EE';

  $scope.status = function(message) {
      document.getElementById('status').innerHTML = message;
  }

  $scope.Init = function() {
    $BLE.Init(function(o) {
      console.log('Properly connected to BLE chip');
      $scope.status(o.message);

      console.log(JSON.stringify(o));
    }, function(o) {
      console.log('Failed to connect to BLE chip');
      console.log(JSON.stringify(o));
    });
  },

  $scope.StartScan = function(callback) {
    // $BLE.StopScan(function(o) {
    //   console.log('Scan stopped successful');
    //   $scope.status(o.message);

    //   console.log(JSON.stringify(o));
    // }, function(o) {
    //   console.log('Scan stopped failed');
    //   $scope.status(o.message);

    //   console.log(JSON.stringify(o));
    // });

    /*
      {
        "status": "scanStarted"
      }

      {
        "status": "scanResult",
        "advertisement": "awArG05L",
        "rssi": -58,
        "name": "Polar H7 3B321015",
        "address": "ECC037FD-72AE-AFC5-9213-CA785B3B5C63"
      }
    */
    $BLE.StartScan(function(obj) {
      callback(); // callback normaal alleen in success

      if (obj.status == 'scanResult') {
          console.log('scan result');
        } else if (obj.status == 'scanStarted') {
          console.log('Endless scan was started successfully');
        } else {
          console.log('Unexpected start scan status: ' + obj.status);
          console.log('Stopping scan');
          $BLE.StopScan();
        }
      },
      function(obj) { // start scan error
        console.log('Scan error', obj.status);
        $BLE.StopScan();
      },
      {});
  },

  /*
   * Stop scanning
   */
  $scope.StopScan = function() {
    $BLE.StopScan(function(o) {
      console.log('Scan stopped');
    }, function(o) {
      console.log('Scan failed to stop');
    });
  },

  /*
     {
      "address": "00:22:D0:3B:32:10",
      "status": "discovered",
      "services": [
        {
          "characteristics": [
            {
              "descriptors": [

              ],
              "characteristicUuid": "2a00",
              "properties": {
                "write": true,
                "writeWithoutResponse": true,
                "read": true
              }
            },
          ]
        }
      ]
    }
  */
  $scope.Discover = function(addressObj) {
    $BLE.Discover(function(o) {
      console.log('Discover successful');

      console.log(JSON.stringify(o));

      var html = '';
      for(item in o) {
        html += '<li>Name: ' + item.name + '</li>';
      }
      
      document.getElementById('list').innerHTML = html;
    }, function(o) {
      console.log('Discover failed');

      console.log(JSON.stringify(o));
    }, addressObj);
  },

  
    [
      {
        "name": "Polar H7 3B321015",
        "address": "ECC037FD-72AE-AFC5-9213-CA785B3B5C63"
      }
    ]
   
  $scope.RetrieveConnected = function() {
    $BLE.RetrieveConnected(function(o) {
      console.log('Retrieve connected successful');
      $scope.status(o.message);

      $('#connected-list').html('');

      for(var i=0; i<o.length; i++) {
        $el = $('<li>' + o[i].name + ' ' + o[i].address + ' <button class="btn connect-btn" data-ng-click="AddressClick($event)" data-address="' + o[i].address + '">Select</button></li>').appendTo('#connected-list');
        $compile($el)($scope);
      }

      console.log(JSON.stringify(o));
    }, function(o) {
      console.log('Retrieve connected failed');
      $scope.status(o.message);
      
      console.log(JSON.stringify(o));
    });
  },

  /*
    {
      "name": "Polar H7 3B321015",
      "address": "ECC037FD-72AE-AFC5-9213-CA785B3B5C63",
      "status": "connecting" / "connected" / "diconnected"
    }
   */

   // timeout toevoegen
  $scope.Connect = function() {
    var timeout = 5000;

    $BLE.Connect(function(o) {
      console.log('Connect successful');
      
      console.log(JSON.stringify(o));

      return o;
    }, function(o) {
      console.log('Connect failed');
      
      console.log(JSON.stringify(o));

      return o;
    }, $scope.address);

    var timer = setTimeout(function() {
      return false;
    }, timeout);
  },

  $scope.Disconnect = function() {
    $BLE.Disconnect(function(o) {
      console.log('Disconnect successful');
      
      console.log(JSON.stringify(o));
    }, function(o) {
      console.log('Disconnect failed');
      
      console.log(JSON.stringify(o));
    }, $scope.address);
  },

  $scope.Reconnect = function() {
    $BLE.Reconnect(function(o) {
      console.log('Reconnect successful');
      console.log(JSON.stringify(o));
    }, function(o) {
      console.log('Reconnect failed');

      console.log(JSON.stringify(o));
    }, $scope.address);
  },

  $scope.IsConnected = function(addressObj) {
    console.log(JSON.stringify($BLE.IsConnected(addressObj)));
  },

  $scope.Close = function() {
    $BLE.Close(function(o) {
      console.log('Close successful');
      
      console.log(JSON.stringify(o));
    }, function(o) {
      console.log('Close failed');
      
      console.log(JSON.stringify(o));
    }, $scope.address);
  },



  /*
   * When the connect button is pressed for an address
   */
  $scope.AddressClick = function($event) {
    var address = $($event.target).data('address');

    $scope.address = address;
  },



  $scope.InitBL = function() {
    $BL.Init(function(data) {

    }, function(data) {

    });
  },

  /*
   * Connect, voor button pair medewerker
   */
  $scope.ConnectBL = function() {
    $BL.Connect('', function(data) {

    }, function(data) {

    });
  },

  $scope.WriteBL = function() {
    $BL.Write('', function(data) {

    }, function(data) {

    });
  },

  $scope.ReadBL = function() {
    $BL.Read(function(data) {
      // update status van medewerker
    }, function(data) {
      // set status op beschikbaar
    });
  },

  $scope.ListBL = function() {
    $BL.List(function(data) {

    }, function(data) {

    });
  },

  $scope.SubscribeBL = function() {
    console.log('Subscribing...')
    $BL.Subscribe(function(data) {

    }, function(data) {

    });
  },

  $scope.DiscoverUnpairedBL = function() {
    $BL.DiscoverUnpaired(function(data) {

    }, function(data) {

    });
  }
});