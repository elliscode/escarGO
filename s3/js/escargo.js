const title = document.getElementById('title');
const snail = document.getElementById('snail');
const shareLocation = document.getElementById('share-location');

let locationTimeout = undefined;

function getSnailLocation(userLocation) {
  let existingSnail = undefined;
  try {
    existingSnail = JSON.parse(localStorage.getItem("escargo-snail-position"));
  } catch (e) {

  }
  if (!existingSnail && userLocation) {
    const snailLat = Math.min(90, Math.max(-90, userLocation.lat + (Math.random() - 0.5)));
    const snailLong = Math.min(180, Math.max(-180, userLocation.long + (Math.random() - 0.5)));
    existingSnail = {"lat": snailLat, "long": snailLong, "time": Date.now()};
    localStorage.setItem("escargo-snail-position", JSON.stringify(existingSnail));
  }
  return existingSnail;
}

function setSnailLocation(inputSnail) {
  localStorage.setItem("escargo-snail-position", JSON.stringify(inputSnail));
}

function setUserLocation(lat, long) {
  localStorage.setItem("escargo-user-position", JSON.stringify({"lat": lat, "long": long}));
}

function getUserLocation() {
  const result = localStorage.getItem("escargo-user-position");
  if (result) {
    try {
      return JSON.parse(result)
    } catch (e) {

    }
  }
  return undefined;
}

// source https://stackoverflow.com/a/18883819
const EARTH_RADIUS_FEET = 20902260;
//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in feet)
function calcCrowFeet(lat1deg, lon1deg, lat2deg, lon2deg) {
  let R = EARTH_RADIUS_FEET; // feet
  let dLat = toRad(lat2deg-lat1deg);
  let dLon = toRad(lon2deg-lon1deg);
  let lat1 = toRad(lat1deg);
  let lat2 = toRad(lat2deg);

  let a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  let d = R * c;
  return d;
}
// Converts numeric degrees to radians
function toRad(value) {
    return value * Math.PI / 180;
}

let userLocationInterval = undefined;

function geolocateUser() {
  shareLocation.style.display = 'none';
  if (navigator.geolocation) {
    title.innerText = "Retrieving your location...";
    navigator.geolocation.getCurrentPosition(tellTheSnailYourPosition);
  } else {
    json.innerHTML = "Geolocation is not supported by this browser.";
  }
  userLocationInterval = setTimeout(geolocateUser, 9000);
}

const timeToKill = document.getElementById('ttk');
const SNAIL_SPEED_IN_FEET_PER_SECOND = 0.03281; // ft/s (feet per second)
const SNAIL_SPEED_IN_FEET_PER_MINUTE = 60 * SNAIL_SPEED_IN_FEET_PER_SECOND; // ft/min (feet per minute)

function tellTheSnailYourPosition(position) {
  const lat = position.coords.latitude;
  const long = position.coords.longitude;
  setUserLocation(lat, long);
  snail.src = 'img/snail-smiling.png';
  displayStatus();
}

function displayStatus() {
  const userLocation = getUserLocation();
  if (!userLocation) {
    return;
  }
  const snailLocation = getSnailLocation(userLocation);
  if (!snailLocation) {
    return;
  }
  const distanceInFeet = Math.max(0, Math.abs(calcCrowFeet(userLocation.lat,userLocation.long,snailLocation.lat,snailLocation.long)) - 30);
  title.innerText = `The snail is ${displayDistance(distanceInFeet)} away`;
  let timeRemaining = distanceInFeet / SNAIL_SPEED_IN_FEET_PER_MINUTE; // minutes
  timeToKill.parentElement.style.display = 'block';
  timeToKill.innerText = displayTime(timeRemaining);
  shareLocation.innerText = 'Allow your current location';
  if (shareLocation.style.display == 'none') {
    directionsButton.style.display = 'block';
  }
}

function displayTime(timeInMinutes) {
  let timeInSeconds = timeInMinutes * 60;
  if (timeInSeconds < 60) {
    return `${Math.round(timeInSeconds * 10) / 10} seconds`;
  } else if (timeInSeconds < 3600) {
    return `${Math.round(timeInSeconds / 60 * 10) / 10} minutes`;
  } else if (timeInSeconds < 86400) {
    return `${Math.round(timeInSeconds / 360 * 10) / 10} hours`;
  } 
  return `${Math.round(timeInSeconds / 86400 * 10) / 10} days`;
}

function displayDistance(distanceInFeet) {
  let outputNumber = Math.round(distanceInFeet)
  if (outputNumber < 5250) {
    return `${Math.round(outputNumber)} feet`;
  }
  return `${Math.round(outputNumber/5250)} miles`;
}

function defaultHandler(event) {
  if (!event || !event.target) {
    return undefined;
  }
  let xmlHttp = event.target;
  let result = {};
  try {
    result = JSON.parse(xmlHttp.responseText);
  } catch(e) {
    try {
      result = {'message': xmlHttp.responseText};
    } catch (e2) {
      result = undefined;
    }
  }
  return {statusCode: xmlHttp.status, responseJson: result};
}

const funFact = document.getElementById('fun-fact');

function showRandomSnailFact() {
  funFact.innerText = funFacts[Math.floor(Math.random() * funFacts.length)];
}

let snailFactInterval = setInterval(showRandomSnailFact, 10000);
showRandomSnailFact();

const directionsButton = document.getElementById('get-directions');

function moveSnail() {
  const userLocation = getUserLocation();
  if (!userLocation) {
    return;
  }
  const snailLocation = getSnailLocation();
  if (!snailLocation) {
    return;
  }
  let timeDiff = Date.now() - snailLocation.time;
  let distanceTraveled = SNAIL_SPEED_IN_FEET_PER_SECOND * (timeDiff / 1000);
  let latDiff = userLocation.lat - snailLocation.lat;
  let lonDiff = userLocation.long - snailLocation.long;
  let latNorm = latDiff / (latDiff + lonDiff);
  let lonNorm = lonDiff / (latDiff + lonDiff)
  let lonComponent = distanceTraveled * lonNorm;
  let latComponent = distanceTraveled * latNorm;
  let latPart = (latComponent / EARTH_RADIUS_FEET) * (180 / Math.PI);
  let lonPart = (lonComponent / EARTH_RADIUS_FEET) * (180 / Math.PI) / Math.cos(snailLocation.lat * Math.PI/180);
  if (userLocation.lat > snailLocation.lat) {
    snailLocation.lat = snailLocation.lat + latPart;
  } else {
    snailLocation.lat = snailLocation.lat - latPart;
  }

  if (userLocation.long > snailLocation.long) {
    snailLocation.long = snailLocation.long + lonPart;
  } else {
    snailLocation.long = snailLocation.long - lonPart;
  }
  snailLocation.time = Date.now();

  if (shareLocation.style.display != 'none') {
    return;
  }

  setSnailLocation(snailLocation);
  snail.classList.add('moving');
  displayStatus();
}

function getDirectionsToSnail() {
  const snailLocation = getSnailLocation();
  let coordsString = `${snailLocation.lat},${snailLocation.long}`;
  let googleUrl = "https://www.google.com/maps/search/?api=1&query=" + coordsString;
  let openLink = document.createElement('a');
  openLink.href=googleUrl;
  openLink.target="_blank";
  openLink.click();
}

let snailMoveInterval = setInterval(moveSnail, 1000);