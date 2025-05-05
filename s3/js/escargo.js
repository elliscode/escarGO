const title = document.getElementById('title');
const snail = document.getElementById('snail');
const shareLocation = document.getElementById('share-location');
const playAgain = document.getElementById('play-again');
const directionsButton = document.getElementById('get-directions');
const getDirectionsToDeath = document.getElementById('get-directions-to-death');
const DEATH_RADIUS_IN_FEET = 10;
const timeToKill = document.getElementById('ttk');

let locationWatch = undefined;
let snailWatch = undefined;

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
  getDirectionsToDeath.style.display = 'none';
  if (navigator.geolocation) {
    title.innerText = "Retrieving your location...";
    locationWatch = navigator.geolocation.watchPosition(storeYourPosition, showAnErrorToTheUser);
    snailWatch = setInterval(moveSnail, 100);
  } else {
    json.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function showAnErrorToTheUser() {
  title.innerText = `We could not get your location, check your system settings and allow location services, then refresh the page`;
  playAgain.style.display = 'none';
  directionsButton.style.display = 'none';
  getDirectionsToDeath.style.display = 'none';
  shareLocation.style.display = 'none';
}
let SNAIL_SPEED_IN_FEET_PER_SECOND = 0.03281; // ft/s (feet per second)
let SNAIL_SPEED_IN_FEET_PER_MINUTE = 60 * SNAIL_SPEED_IN_FEET_PER_SECOND; // ft/min (feet per minute)

function storeYourPosition(position) {
  const lat = position.coords.latitude;
  const long = position.coords.longitude;
  setUserLocation(lat, long);
}

let fetchedLocation = false;

let snailMarker = undefined;
let playerMarker = undefined;

let snailIcon = undefined;

function displayStatus(distanceInFeet, timeRemainingInMinutes) {
  const userLocation = getUserLocation();
  if (!userLocation) {
    return;
  }
  const snailLocation = getSnailLocation(userLocation);
  if (!snailLocation) {
    return;
  }
  
  // Add marker
  if (!snailMarker) {
    snailIcon = document.createElement('img');
    snailIcon.src = 'img/snail.png'; // Path to your icon
    snailIcon.style.width = '40px'; // Adjust size as needed
    snailIcon.style.height = '40px';
    snailIcon.style.transition = 'width 0.2s, height 0.2s';

    snailMarker = new maplibregl.Marker({ element: snailIcon, rotationAlignment: 'screen' }).setLngLat([snailLocation.long, snailLocation.lat]).addTo(map);

    snailMarker.getElement().classList.add('moving');

    map.on('zoom', () => {
      resizeMarker(map.getZoom());
    });
  }
  snailMarker.setLngLat([snailLocation.long, snailLocation.lat]);
  
  // Add marker
  if (!playerMarker) {
    map.setCenter([userLocation.long, userLocation.lat]);
    snail.style.display = 'none';
    playerMarker = new maplibregl.Marker({ color: 'blue' }).setLngLat([userLocation.long, userLocation.lat]).addTo(map);

    const bounds = new maplibregl.LngLatBounds();

    bounds.extend(snailMarker.getLngLat());
    bounds.extend(playerMarker.getLngLat());
    
    map.fitBounds(bounds, {
      padding: Math.round(window.innerHeight / 5),
      duration: 3000
    });
  }
  playerMarker.setLngLat([userLocation.long, userLocation.lat]);

  if (playerMarker.getElement().getBoundingClientRect().x < snailMarker.getElement().getBoundingClientRect().x) {
    if (!snailIcon.src.includes('img/snail-icon-left.png')) {
      snailIcon.src = 'img/snail-icon-left.png';
    }
  } else {
    if (!snailIcon.src.includes('img/snail-icon-right.png')) {
      snailIcon.src = 'img/snail-icon-right.png';
    }
  }

  if (distanceInFeet == 0 || localStorage.getItem('where-you-died')) {
    displayDead();
  } else {
    let titleText = `The snail is ${displayDistance(distanceInFeet)} away`;
    if (title.textContent != titleText) {
      title.innerText = titleText;
    }
    timeToKill.parentElement.style.display = 'block';
    let newTime = displayTime(timeRemainingInMinutes);
    if (timeToKill.textContent != newTime) {
      timeToKill.innerText = newTime;
    }
    // directionsButton.style.display = 'block';
    getDirectionsToDeath.style.display = 'none';
    shareLocation.style.display = 'none';
    playAgain.style.display = 'none';
  }
}

// Function to resize based on zoom
function resizeMarker(zoom) {
  const size = 20 + getZoomSize(zoom);
  snailIcon.style.width = `${size}px`;
  snailIcon.style.height = `${size}px`;
}

function getZoomSize(zoom) {
  if (21 < zoom && zoom <= 22) { // 400
    return Math.round(((zoom - 21) * 200) + 200);
  } else if (20 < zoom && zoom <= 21) { // 200
    return Math.round(((zoom - 20) * 100) + 100);
  } if (19 < zoom && zoom <= 20) { // 100
    return Math.round(((zoom - 19) * 50) + 50);
  } else if (18 < zoom && zoom <= 19) { // 50
    return Math.round(((zoom - 18) * 10) + 40);
  } else if (17 < zoom && zoom <= 18) { // 50
    return Math.round(((zoom - 17) * 10) + 30);
  } else if (16 < zoom && zoom <= 17) { // 50
    return Math.round(((zoom - 16) * 10) + 20);
  } else {
    return 20;
  }
}

function restartTheGame() {
  localStorage.removeItem("escargo-snail-position");
  localStorage.removeItem('where-you-died');
  geolocateUser();
}

function displayTime(timeRemainingInMinutes) {
  let timeInSeconds = timeRemainingInMinutes * 60;
  if (timeInSeconds < 60) {
    return `${Math.round(timeInSeconds * 10) / 10} seconds`;
  } else if (timeInSeconds < 3600) {
    return `${Math.round(timeInSeconds / 60 * 10) / 10} minutes`;
  } else if (timeInSeconds < 86400) {
    return `${Math.round(timeInSeconds / 3600 * 10) / 10} hours`;
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
  let distanceInFeet = Math.max(0, snailUserDistance - DEATH_RADIUS_IN_FEET);
  let timeRemainingInMinutes = distanceInFeet / SNAIL_SPEED_IN_FEET_PER_MINUTE; // minutes
  if (snailUserDistance > DEATH_RADIUS_IN_FEET) {
    let timeDiff = Date.now() - snailLocation.time;
    let distanceTraveled = Math.min(SNAIL_SPEED_IN_FEET_PER_SECOND * (timeDiff / 1000), snailUserDistance);
    let percentageTraveled = distanceTraveled / snailUserDistance;

    // latitude is easy
    let latDiff = Math.abs(userLocation.lat - snailLocation.lat);
    let latPart = latDiff * percentageTraveled;
    if (userLocation.lat > snailLocation.lat) {
      snailLocation.lat = snailLocation.lat + latPart;
    } else {
      snailLocation.lat = snailLocation.lat - latPart;
    }

    // longitude is annoying due to the fact that it restarts at -180 and 180
    let longDiff = Math.abs(userLocation.long - snailLocation.long);
    let reverser = 1;
    if (longDiff > 180) {
      reverser = -1;
      longDiff = longDiff - 180;
    }
    let longPart = longDiff * percentageTraveled;
    if (userLocation.long > snailLocation.long) {
      snailLocation.long = snailLocation.long + (reverser * longPart);
    } else {
      snailLocation.long = snailLocation.long - (reverser * longPart);
    }

    distanceInFeet = Math.max(0, snailUserDistance - DEATH_RADIUS_IN_FEET);
    timeRemainingInMinutes = distanceInFeet / SNAIL_SPEED_IN_FEET_PER_MINUTE; // minutes
  }
  snailLocation.time = Date.now();
  setSnailLocation(snailLocation);

  if (shareLocation.style.display != 'none') {
    return;
  }
  snail.classList.add('moving');
  if (fetchedLocation) {
    displayStatus(distanceInFeet, timeRemainingInMinutes);
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

function getDirectionsToYourDeath() {
  let deathLocation = undefined;
  try {
    deathLocation = JSON.parse(localStorage.getItem("where-you-died"));
  } catch (e) {

  }
  let coordsString = `${deathLocation.lat},${deathLocation.long}`;
  let googleUrl = "https://www.google.com/maps/search/?api=1&query=" + coordsString;
  let openLink = document.createElement('a');
  openLink.href=googleUrl;
  openLink.target="_blank";
  openLink.click();
}

function checkIfDead() {
  if (localStorage.getItem('where-you-died')) {
    displayDead();
  }
}

function displayDead() {
  snail.src='img/dead.png';
  snail.classList.remove('moving');
  title.innerText = `The snail caught you, and you died.`;
  localStorage.setItem('where-you-died', localStorage.getItem("escargo-snail-position"));
  clearTimeout(snailLocationTimeout);
  clearTimeout(userLocationTimeout);
  navigator.geolocation.clearWatch(locationWatch);
  clearInterval(snailWatch);
  timeToKill.parentElement.style.display = 'none';
  playAgain.style.display = 'block';
  getDirectionsToDeath.style.display = 'block';
  directionsButton.style.display = 'none';
  shareLocation.style.display = 'none';
}

checkIfDead();

let map = undefined;
window.addEventListener('DOMContentLoaded', () => {
  // Initialize map using MapLibre
  map = new maplibregl.Map({
    container: 'map',
    style: `https://api.maptiler.com/maps/basic/style.json?key=${CLIENT_SIDE_MAPS_API_KEY}`,
    zoom: 16
  });

  // Add navigation controls
  map.addControl(new maplibregl.NavigationControl());
});