// weather.js - control scripts for the weather app
// ES6 code used regularly
// Allows user to see weather at their location or in a place they search
// Shows that location on a map
// And has some jquery animations. Because. 

"use strict";

var wapp = {}; // object to hold the app's variables
wapp.coords = [42.03, -93.63];
wapp.dbg = false; // true for debugging console logs, otherwise false
wapp.units = "F"; // C or F; default F
wapp.lockout = false; // rate limiter on API requests from clicking the random button
wapp.searchflag = false; // flag when better data exists for the place name
wapp.monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
wapp.picturelinks = {
    cloudy: "./img/cloudy.png",
    partlycloudy: "./img/partlycloudy.png",
    sunny: "./img/sunny.png",
    rain: "./img/rain.png",
    snow: "./img/snow.png"
};

$(document).ready(function ()
{
    // Get and display the default weather (Media, PA)
    getWeather();
    // Display a working/running timer
    var rightNow = new Date();
    $("#thetime").html(rightNow.toLocaleTimeString());
    $("#thedate").html(`${wapp.monthNames[rightNow.getMonth()]} ${rightNow.getDate()}, ${rightNow.getFullYear()}`);
    setInterval( () => $("#thetime").html(formattedTime()), 1000);
    // Draw the date picker
    $("#date").datepicker();
    // Button: Search for weather at a location
    $("#weathersearch").click(function () {
        if (wapp.dbg) console.log("Autocomplete object: ", wapp.autocomplete);
        //console.log(wapp.autocomplete.gm_accessors_);
        //console.log(wapp.autocomplete.gm_accessors_.place.Fc.place.geometry.viewport);
        if (!wapp.autocomplete.gm_accessors_.place.Fc.place)
        {
            $("#autocomplete").attr("placeholder", "Error: pick location before searching");
            $("#autocomplete").val("");
            return;
        }
        wapp.coords[0] = wapp.autocomplete.gm_accessors_.place.Fc.place.geometry.viewport.f.f;
        wapp.coords[1] = wapp.autocomplete.gm_accessors_.place.Fc.place.geometry.viewport.b.f;
        wapp.place = wapp.autocomplete.gm_accessors_.place.Fc.place.name;
        wapp.searchflag = true;
        $("#autocomplete").val("");
        getWeather();
    });

    // Button: Toggle C and F temp display
    $("#changeunits").click(function () {
        changeUnits();
    });

    // Button: Get weather at a random new coordinate
    $("#rnd").click(function () {
        if (wapp.lockout) {
            return;
        }
        wapp.lockout = true;
        getRandomCoord();
        getWeather();
    });

    // Button: Get weather at user's location
    $("#myloc").click(function () {
        // If we don't know where the user is, ask them
        if (!localStorage.getItem("mylat")) {
            $("#dialog-myloc").dialog("open");
        }
        else {
            // Use mylat and mylang to get the weather
            wapp.coords[0] = Number(localStorage.getItem("mylat"));
            wapp.coords[1] = Number(localStorage.getItem("mylong"));
            getWeather();
        }
    });

    // Button: Clear the cache / local storage
    $("#clearcache").click(function () {
        localStorage.clear();
    });

    // Button: Mayehm (website falls apart via dumb jquery animations)
    $("#no").click(function () {
        $("#dialog-mayhem").dialog("open");
    });

    // set up jqueryui dialog boxes:
    $("#dialog-myloc").dialog({
        autoOpen: false,
        resizable: false,
        height: "auto",
        width: 350,
        modal: true,
        buttons: {
            "Sounds good!": function () {
                getMyLocation();
                $(this).dialog("close");
            },
            Cancel: function () {
                $(this).dialog("close");
            }
        }
    }); // end dialog myloc

    $("#dialog-mayhem").dialog({
        autoOpen: false,
        resizable: false,
        height: "auto",
        width: 350,
        modal: true,
        buttons: {
            "DO IT": function () { // Animate the site exploding and then rebuilding
                $("div.flexitem").slideUp({ duration: 1000 });
                setTimeout(function () {
                    $("a.fa").toggle("explode");
                }, 1500);
                setTimeout(function () {
                    $("div#footer").toggle("explode");
                }, 2000);
                setTimeout(function () {
                    $("div#splashtop").fadeOut(500);
                }, 2500);
                setTimeout(function () {
                    $("div#footer").slideDown({ duration: 500 });
                }, 4000);
                setTimeout(function () {
                    $("a.fa").slideDown({ duration: 500 });
                }, 4500);
                setTimeout(function () {
                    $("div.flexitem").slideDown({ duration: 500 });
                }, 5000);
                setTimeout(function () {
                    $("div#splashtop").slideDown({ duration: 500 });
                }, 5500);
                $(this).dialog("close");
            },
            "Fine. Don't destroy site.": function () {
                $(this).dialog("close");
            }
        }
    }); // end diag mayhem
});

// Google Maps callback function, also initializes autocomplete feature
function initMap() {
    // Create a map object and specify the DOM element for display.
    wapp.map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: wapp.coords[0], lng: wapp.coords[1] },
        disableDefaultUI: true, // turns off user controls
        scrollwheel: false,
        zoom: 5,
        styles: [
  {
      "elementType": "geometry",
      "stylers": [
        {
            "color": "#ebe3cd"
        }
      ]
  },
  {
      "elementType": "labels.text.fill",
      "stylers": [
        {
            "color": "#523735"
        }
      ]
  },
  {
      "elementType": "labels.text.stroke",
      "stylers": [
        {
            "color": "#f5f1e6"
        }
      ]
  },
  {
      "featureType": "administrative",
      "elementType": "geometry.stroke",
      "stylers": [
        {
            "color": "#c9b2a6"
        }
      ]
  },
  {
      "featureType": "administrative.land_parcel",
      "elementType": "geometry.stroke",
      "stylers": [
        {
            "color": "#dcd2be"
        }
      ]
  },
  {
      "featureType": "administrative.land_parcel",
      "elementType": "labels",
      "stylers": [
        {
            "visibility": "off"
        }
      ]
  },
  {
      "featureType": "administrative.land_parcel",
      "elementType": "labels.text.fill",
      "stylers": [
        {
            "color": "#ae9e90"
        }
      ]
  },
  {
      "featureType": "landscape.natural",
      "elementType": "geometry",
      "stylers": [
        {
            "color": "#dfd2ae"
        }
      ]
  },
  {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [
        {
            "color": "#dfd2ae"
        }
      ]
  },
  {
      "featureType": "poi",
      "elementType": "labels.text",
      "stylers": [
        {
            "visibility": "off"
        }
      ]
  },
  {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [
        {
            "color": "#93817c"
        }
      ]
  },
  {
      "featureType": "poi.business",
      "stylers": [
        {
            "visibility": "off"
        }
      ]
  },
  {
      "featureType": "poi.park",
      "elementType": "geometry.fill",
      "stylers": [
        {
            "color": "#a5b076"
        }
      ]
  },
  {
      "featureType": "poi.park",
      "elementType": "labels.text",
      "stylers": [
        {
            "visibility": "off"
        }
      ]
  },
  {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [
        {
            "color": "#447530"
        }
      ]
  },
  {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [
        {
            "color": "#f5f1e6"
        }
      ]
  },
  {
      "featureType": "road.arterial",
      "stylers": [
        {
            "visibility": "off"
        }
      ]
  },
  {
      "featureType": "road.arterial",
      "elementType": "geometry",
      "stylers": [
        {
            "color": "#fdfcf8"
        }
      ]
  },
  {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [
        {
            "color": "#f8c967"
        }
      ]
  },
  {
      "featureType": "road.highway",
      "elementType": "geometry.stroke",
      "stylers": [
        {
            "color": "#e9bc62"
        }
      ]
  },
  {
      "featureType": "road.highway",
      "elementType": "labels",
      "stylers": [
        {
            "visibility": "off"
        }
      ]
  },
  {
      "featureType": "road.highway.controlled_access",
      "elementType": "geometry",
      "stylers": [
        {
            "color": "#e98d58"
        }
      ]
  },
  {
      "featureType": "road.highway.controlled_access",
      "elementType": "geometry.stroke",
      "stylers": [
        {
            "color": "#db8555"
        }
      ]
  },
  {
      "featureType": "road.local",
      "stylers": [
        {
            "visibility": "off"
        }
      ]
  },
  {
      "featureType": "road.local",
      "elementType": "labels",
      "stylers": [
        {
            "visibility": "off"
        }
      ]
  },
  {
      "featureType": "road.local",
      "elementType": "labels.text.fill",
      "stylers": [
        {
            "color": "#806b63"
        }
      ]
  },
  {
      "featureType": "transit.line",
      "elementType": "geometry",
      "stylers": [
        {
            "color": "#dfd2ae"
        }
      ]
  },
  {
      "featureType": "transit.line",
      "elementType": "labels.text.fill",
      "stylers": [
        {
            "color": "#8f7d77"
        }
      ]
  },
  {
      "featureType": "transit.line",
      "elementType": "labels.text.stroke",
      "stylers": [
        {
            "color": "#ebe3cd"
        }
      ]
  },
  {
      "featureType": "transit.station",
      "elementType": "geometry",
      "stylers": [
        {
            "color": "#dfd2ae"
        }
      ]
  },
  {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [
        {
            "color": "#b9d3c2"
        }
      ]
  },
  {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [
        {
            "color": "#92998d"
        }
      ]
  }
        ]
    });

    wapp.marker = new google.maps.Marker({
        position: { lat: wapp.coords[0], lng: wapp.coords[1] },
        title: "Weather",
        map: wapp.map
    });
    // initialize autocomplete stuff: Code adapted from google maps autocomplete web API
    // Create the autocomplete object, restricting the search to geographical location types.
    wapp.autocomplete = new google.maps.places.Autocomplete(
        /** @type {!HTMLInputElement} */(document.getElementById("autocomplete")),
        { types: ["geocode"] });
}

// Re-center the map with new coordinates
function updateMap() {
    var tempstr;
    if (wapp.units === "F") { tempstr = wapp.tempf; }
    else { tempstr = wapp.tempc }
    wapp.map.panTo({ lat: wapp.coords[0], lng: wapp.coords[1] });
    wapp.marker.setMap(null);
    wapp.marker = new google.maps.Marker({
        position: { lat: wapp.coords[0], lng: wapp.coords[1] },
        label: tempstr
    });
    wapp.marker.setMap(wapp.map);

    // Make the icon clickable and include some weather details
    var infowindow = new google.maps.InfoWindow({
        content: wapp.weatherstring
    });
    wapp.marker.addListener("click", function () {
        infowindow.open(wapp.map, wapp.marker);
    });
}

function getRandomCoord() {
    // Pick random coordinates that are kinda bounded by roughly where the U.S. is. 
    wapp.coords[0] = Math.floor((Math.random() * 30) + 1) + 20;
    wapp.coords[1] = Math.floor((Math.random() * 50) + 1) - 120;
    if (wapp.dbg) console.info(`New random coords: ${wapp.coords[0]}, ${wapp.coords[1]}.`);
    // if (!wapp.map) return;
}

// For testing purposes, weather data formatted as the OpenWeatherMap API returns it
function getFakeJSON() {
    var fakeJSON = {
        "coord": { "lon": 34.9719, "lat": 138.9304 },
        "sys": { "country": "JP", "sunrise": 1369769524, "sunset": 1369821049 },
        "weather": [{ "id": 804, "main": "clouds", "description": "overcast clouds", "icon": "04n" }],
        "main": { "temp": 289.5, "humidity": 89, "pressure": 1013, "temp_min": 287.04, "temp_max": 292.04 },
        "wind": { "speed": 7.31, "deg": 187.002 },
        "rain": { "3h": 0 },
        "clouds": { "all": 92 },
        "dt": 1369824698,
        "id": 1851632,
        "name": "Shuzenji",
        "cod": 200
    };
    return fakeJSON;
}


// Retrieve weather data if necessary
function getWeather() {
    /* for initial setup, use the fakeJSON
    wapp.rawData = getFakeJSON();
    wapp.rawData.stamp = Date.now();
    displayWeather();*/

    // Create or load the cache of lat/long points
    checkCache();
    // Check the cache to see if new data needs to be requested
    let keystring = "" + wapp.coords[0].toFixed(0) + wapp.coords[1].toFixed(0);
    if (wapp.dbg) console.log("Keystring: " + keystring);
    if (wapp.cache[keystring]) {
        if (wapp.dbg) console.log("Oh! I've looked up these coordinates before..");
        let timeElapsed = Date.now() - wapp.cache[keystring].stamp;
        if (timeElapsed < 1800000) {
            if (wapp.dbg) console.info(`Weather data only ${(timeElapsed / (60 * 1000)).toFixed(1)} minutes old, don't look again`);
            wapp.rawData = wapp.cache[keystring];
            setTimeout(function () {
                displayWeather();
            }, 0); // display the cached data, async because fear Zango
            return;
        } // We have data within the last 30 minutes
        else if (wapp.dbg) console.log(`Old data, last checked ${(timeElapsed / (60 * 1000)).toFixed(1)} minutes ago.`)
    }
    //Otherwise, request weather data, using promises, because it's 2017:
    var myFirstPromise = new Promise((resolve, reject) => { // cross origin hack to make it work online and not only locally:
        wapp.url = ` https://cors-anywhere.herokuapp.com/api.openweathermap.org/data/2.5/weather?lat=${wapp.coords[0]}&lon=${wapp.coords[1]}&appid=e77d7680a7c88535885d9d87ef72b5a6`;
        $.ajax({
            url: wapp.url,
            jsonp: "callback",
            dataType: "jsonp",
            data: {
                q: "",
                format: "json"
            },
            success: function (response) {
                /* wapp.rawData = response;
                wapp.rawData.stamp = Date.now();
                if (wapp.dbg) console.log(response);
                displayWeather(); */
                resolve(response);
            }
        });
        setTimeout(function () {
            reject("IT FAILED!"); // No response
        }, 120000);
    });

    myFirstPromise.then((response) => {
        wapp.lockout = false;
        if (response === "failure") {
            console.error("The open weather request failed");
            return;
        }
        wapp.rawData = response;
        wapp.rawData.stamp = Date.now();
        if (wapp.dbg) console.log("Promise Resolved!", response);
        displayWeather();
    });
}

// Show the weather data
function displayWeather() {
    // If we're nowhere, try another random location to see if we get somwhere
    if (wapp.rawData.name === "")
    {
        if (wapp.dbg) console.log("Uh oh! We're in the middle of nowhere! Roll again!");
        getRandomCoord();
        getWeather();
        return;
    }
    // Convert temperatures
    wapp.tempk = wapp.rawData.main.temp;
    // convert temp from K to C
    wapp.tempc = wapp.tempk - 273.15;
    // convert temp from K to F
    wapp.tempf = (wapp.tempk * (9 / 5)) - 459.67;
    wapp.tempf = wapp.tempf.toFixed(0);
    wapp.tempc = wapp.tempc.toFixed(0);
    if (wapp.dbg) console.info(`Temp(K): ${wapp.tempk}, temp(C): ${wapp.tempc}, temp(F): ${wapp.tempf}.`);
    // Get the weather string if we don't have a better one
    wapp.weatherstring = wapp.rawData.weather[0].description[0].toUpperCase() + wapp.rawData.weather[0].description.substring(1);
    // Get the place name if we don't have a better one from the Google API
    if (wapp.searchflag === false) {
        wapp.place = `${wapp.rawData.name}`;
    }
    wapp.searchflag = false;
    if (wapp.dbg) console.info(`Location: ${wapp.place}, Weather: ${wapp.weatherstring}`);
    // Cache the new weather data
    let latString = wapp.coords[0].toFixed(0) + "";
    let longString = wapp.coords[1].toFixed(0) + "";
    let keystring = latString + longString;
    wapp.cache[keystring] = wapp.rawData;
    if (wapp.dbg) console.info(wapp.cache);
    // reset the search box
    $("#autocomplete").attr("placeholder", "Search for weather data...");
    $("#autocomplete").val("");
    // Store the cache in local storage
    localStorage.setItem("cache", JSON.stringify(wapp.cache));
    // Show all of the data
    $("#location").html(wapp.place);
    $("#weathertext").html(wapp.weatherstring);
    if (wapp.units === "F") {
        $("span#temp").html(wapp.tempf);
    }
    else {
        $("span#temp").html(wapp.tempc);
    }
    // Choose an appropriate weather picture
    chooseWeatherPicture();
    // Snap to the new map location
    updateMap();
}

// If possible, get the user's current location from the browser
function getMyLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                wapp.coords[0] = position.coords.latitude;
                wapp.coords[1] = position.coords.longitude;
                if (wapp.dbg) console.info(`My coordinates: ${wapp.coords[0]}, ${wapp.coords[1]}`);
                let mylatstring = "" + wapp.coords[0];
                let mylongstring = "" + wapp.coords[1];
                localStorage.setItem("mylat", mylatstring);
                localStorage.setItem("mylong", mylongstring);
                getWeather();
            });
        } else {
            console.error("Something's broken");
        }
}

// Toggle betweeen C and F
function changeUnits() {
    if (wapp.units === "F") {
        $("span#temp").html(wapp.tempc);
        $("span#units").html("C");
        wapp.units = "C";
    }
    else {
        $("span#temp").html(wapp.tempf);
        $("span#units").html("F");
        wapp.units = "F";
    }
    updateMap(); // to update the marker display on the map
}

function chooseWeatherPicture() {
    // Cloudy
    if (wapp.weatherstring.toLowerCase().includes("cloud") || wapp.weatherstring.toLowerCase().includes("cast")) {
        $("img#weatherpicture").attr("src", wapp.picturelinks.partlycloudy);
    }
    // snow
    else if (wapp.weatherstring.toLowerCase().includes("snow")) {
        $("img#weatherpicture").attr("src", wapp.picturelinks.snow);
    }
    // rain
    else if (wapp.weatherstring.toLowerCase().includes("rain") || wapp.weatherstring.toLowerCase().includes("drizzle") || wapp.weatherstring.toLowerCase().includes("haze") || wapp.weatherstring.toLowerCase().includes("mist") || wapp.weatherstring.toLowerCase().includes("fog") || wapp.weatherstring.toLowerCase().includes("thunder") || wapp.weatherstring.toLowerCase().includes("storm") ) {
        $("img#weatherpicture").attr("src", wapp.picturelinks.rain);
    }
    // sun
    else if (wapp.weatherstring.toLowerCase().includes("sun") || wapp.weatherstring.toLowerCase().includes("clear")) {
        $("img#weatherpicture").attr("src", wapp.picturelinks.sunny);
    }
    // Otherwise display a fail image
    else {
        $("img#weatherpicture").attr("src", "http://i.imgur.com/CQC4Iv6.png");
    }
}

function formattedTime() {
    var now = new Date();
    return now.toLocaleTimeString();
}

function checkCache() {
    // Create a local cache if none exists
    if (!localStorage.getItem("cache")) {
        wapp.cache = {};
        localStorage.setItem("cache", JSON.stringify(wapp.cache));
        if (wapp.dbg) console.info("Created local storage");

    } else { // otherwise read it
        wapp.cache = JSON.parse(localStorage.getItem("cache"));
    }
}

// Bias the autocomplete object to the map's current location, per Google autocomplete API examples
function geolocate() {
    var geolocation = { lat: wapp.coords[0], lng: wapp.coords[1] };
    var circle = new google.maps.Circle({ center: geolocation, radius: 1 });
    wapp.autocomplete.setBounds(circle.getBounds());
}