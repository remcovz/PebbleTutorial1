// Listen for when the watchface is opened
Pebble.addEventListener('ready', 
  function(e) {
    console.log("PebbleKit JS ready!");
    
    // Get the initial weather
    getWeather();
  }
);

// Listen for when an AppMessage is received
Pebble.addEventListener('appmessage',
  function(e) {
    console.log("AppMessage received! :", e);
    getWeather();
  }                     
);

var options = {};
Pebble.addEventListener('showConfiguration', 
  function(e) {
    // Show config page
    console.log('Configuration window opened');
    Pebble.openURL('http://www.zuijlen.eu/pebble/tutorial1.html?'+encodeURIComponent(JSON.stringify(options)));
  }
);

// [PHONE] pebble-app.js:?: JS: Tutorial 1: Configuration window closed and returned: {"scale":"fahrenheit"}
// [PHONE] pebble-app.js:?: JS: Tutorial 1: Temperature Scale setting = celcius
// [DEBUG] main.c:147: Tempscale = celcius
Pebble.addEventListener("webviewclosed", function(e) {
  console.log('Configuration window closed and returned: ' + e.response);
  // webview closed
  //Using primitive JSON validity and non-empty check
  if (e.response.charAt(0) == "{" && e.response.slice(-1) == "}" && e.response.length > 5) {
    options = JSON.parse(decodeURIComponent(e.response));
    //options = JSON.parse(e.response);
    //console.log('Configuration stringified: ' +JSON.stringify(options));
    var tempscale = options.scale;
    console.log('Temperature Scale setting = '+tempscale);
    
    var dictionary = {
        "KEY_TEMPSCALE": tempscale
    };
    sendAppMessage(dictionary);
  } else {
    console.log("Configuration cancelled");
  }
});

var xhrRequest = function (url, type, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    callback(this.responseText);
  };
  xhr.open(type, url);
  xhr.send();
};

function locationSuccess(pos) {
  // We will request the weather here
  // Construct URL
  var myAPIKey = '9240715bd56d39c48ab9f636b9aefd06';
  var url = "http://api.openweathermap.org/data/2.5/weather?lat=" +
      pos.coords.latitude + "&lon=" + pos.coords.longitude + "&appid=" + myAPIKey;
  console.log("Using URL: " + url);
  
  // Send request to OpenWeatherMap
  xhrRequest(url, 'GET', 
    function(responseText) {
      // responseText contains a JSON object with weather info
      var json = JSON.parse(responseText);

      // Temperature in Kelvin requires adjustment
      var temperature = Math.round(json.main.temp - 273.15);
      console.log("Temperature is " + temperature);

      // Conditions
      var conditions = json.weather[0].main;      
      console.log("Conditions are " + conditions);

      var dictionary = {
        "KEY_TEMPERATURE": temperature,
        "KEY_CONDITIONS": conditions
      };
      
      // Send to Pebble
      sendAppMessage(dictionary);
    }
  );
}

function sendAppMessage(dictionary) {
  console.log("Pushing data to Pebble");
  Pebble.sendAppMessage(dictionary, 
    function(e) {
      console.log("Weather info sent to Pebble successfully!");
    },
    function(e) {
      console.log("Error sending weather info to Pebble!");
    }
  );
}

function locationError(err) {
  console.log("Error requesting location!");
}

function getWeather() {
  navigator.geolocation.getCurrentPosition(
    locationSuccess,
    locationError,
    {timeout: 15000, maximumAge: 60000}
  );
}
