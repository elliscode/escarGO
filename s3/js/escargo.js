const title = document.getElementById('title');
const snail = document.getElementById('snail');
const shareLocation = document.getElementById('share-location');
const playAgain = document.getElementById('play-again');

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
  if (inputSnail.long < -180) {
    inputSnail.long = inputSnail.long + 360;
  }
  if (inputSnail.long > 180) {
    inputSnail.long = inputSnail.long - 360;
  }
  if (inputSnail.lat < -90) {
    inputSnail.lat = inputSnail.lat + 180;
  }
  if (inputSnail.lat > 90) {
    inputSnail.lat = inputSnail.lat - 180;
  }
  localStorage.setItem("escargo-snail-position", JSON.stringify(inputSnail));
}

function setUserLocation(lat, long) {
  if (long < -180) {
    long = long + 360;
  }
  if (long > 180) {
    long = long - 360;
  }
  if (lat < -90) {
    lat = lat + 180;
  }
  if (lat > 90) {
    lat = lat - 180;
  }
  localStorage.setItem("escargo-user-position", JSON.stringify({"lat": lat, "long": long}));
  fetchedLocation = true;
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
  return Math.abs(d);
}
// Converts numeric degrees to radians
function toRad(value) {
    return value * Math.PI / 180;
}

let userLocationTimeout = undefined;
let snailLocationTimeout = undefined;

function geolocateUser() {
  shareLocation.style.display = 'none';
  playAgain.style.display = 'none';
  if (navigator.geolocation) {
    title.innerText = "Retrieving your location...";
    navigator.geolocation.getCurrentPosition(tellTheSnailYourPosition, showAnErrorToTheUser);
  } else {
    json.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function showAnErrorToTheUser() {
  title.innerText = `We could not get your location, check your system settings and allow location services, then refresh the page`;
  playAgain.style.display = 'none';
  directionsButton.style.display = 'none';
  shareLocation.style.display = 'none';
}

const timeToKill = document.getElementById('ttk');
const SNAIL_SPEED_IN_FEET_PER_SECOND = 880; // 0.03281; // ft/s (feet per second)
const SNAIL_SPEED_IN_FEET_PER_MINUTE = 60 * SNAIL_SPEED_IN_FEET_PER_SECOND; // ft/min (feet per minute)

function tellTheSnailYourPosition(position) {
  moveSnail();
  const lat = position.coords.latitude;
  const long = position.coords.longitude;
  setUserLocation(lat, long);
  snail.src = 'img/snail-smiling.png';
  if (userLocationTimeout) {
    clearTimeout(userLocationTimeout);
    userLocationTimeout = undefined;
  }
  userLocationTimeout = setTimeout(geolocateUser, 9000);
  if (snailLocationTimeout) {
    clearTimeout(snailLocationTimeout);
    snailLocationTimeout = undefined;
  }
  snailLocationTimeout = setTimeout(moveSnail, 1000);
}

let fetchedLocation = false;

function displayStatus() {
  const userLocation = getUserLocation();
  if (!userLocation) {
    return;
  }
  const snailLocation = getSnailLocation(userLocation);
  if (!snailLocation) {
    return;
  }
  const distanceInFeet = Math.max(0, calcCrowFeet(userLocation.lat,userLocation.long,snailLocation.lat,snailLocation.long) - 30);

  if (distanceInFeet == 0) {
    snail.src='img/dead.png';
    snail.classList.remove('moving');
    title.innerText = `The snail caught you, and you died.`;
    clearTimeout(snailLocationTimeout);
    clearTimeout(userLocationTimeout);
    timeToKill.parentElement.style.display = 'none';
    playAgain.style.display = 'block';
    directionsButton.style.display = 'none';
    shareLocation.style.display = 'none';
  } else {
    title.innerText = `The snail is ${displayDistance(distanceInFeet)} away`;
    let timeRemaining = distanceInFeet / SNAIL_SPEED_IN_FEET_PER_MINUTE; // minutes
    timeToKill.parentElement.style.display = 'block';
    timeToKill.innerText = displayTime(timeRemaining);
    directionsButton.style.display = 'block';
    shareLocation.style.display = 'none';
    playAgain.style.display = 'none';
  }
}

function restartTheGame() {
  localStorage.removeItem("escargo-snail-position");
  geolocateUser();
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
    return `${Math.round(outputNumber * 10) / 10} feet`;
  }
  return `${Math.round(outputNumber / 5250 * 10) / 10} miles`;
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
  const snailLocation = getSnailLocation(userLocation);
  if (!snailLocation) {
    return;
  }
  let snailUserDistance = calcCrowFeet(userLocation.lat,userLocation.long,snailLocation.lat,snailLocation.long);
  if (snailUserDistance > 30) {
    let timeDiff = Date.now() - snailLocation.time;
    let distanceTraveled = Math.min(SNAIL_SPEED_IN_FEET_PER_SECOND * (timeDiff / 1000), snailUserDistance);
    let percentageTraveled = distanceTraveled / snailUserDistance;
    let latDiff = Math.abs(userLocation.lat - snailLocation.lat);
    let lonDiff = Math.abs(userLocation.long - snailLocation.long);
    let latPart = latDiff * percentageTraveled;
    let lonPart = lonDiff * percentageTraveled;

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
    if (snailLocationTimeout) {
      clearTimeout(snailLocationTimeout);
      snailLocationTimeout = undefined;
    }
    snailLocationTimeout = setTimeout(moveSnail, 1000);
  }
  snailLocation.time = Date.now();
  setSnailLocation(snailLocation);

  if (shareLocation.style.display != 'none') {
    return;
  }
  snail.classList.add('moving');
  if (fetchedLocation) {
    displayStatus();
  }
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