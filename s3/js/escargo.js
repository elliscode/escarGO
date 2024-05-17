const title = document.getElementById('title');
const snail = document.getElementById('snail');
const shareLocation = document.getElementById('share-location');

let locationTimeout = undefined;

function createRandomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}


function getUserId() {
  let existingUser = localStorage.getItem("escargo-user-identifier");
  if (!existingUser) {
    existingUser = createRandomString(100);
    localStorage.setItem("escargo-user-identifier", existingUser);
  }
  return existingUser;
}

function getLocation() {
  shareLocation.style.display = 'none';
  if (navigator.geolocation) {
    title.innerText = "Retrieving your location...";
    navigator.geolocation.getCurrentPosition(tellTheSnailYourPosition);
  } else {
    json.innerHTML = "Geolocation is not supported by this browser.";
  }
}

let lat = 0;
let long = 0;
function tellTheSnailYourPosition(position) {
  title.innerText = "Notifying the snail...";
  lat = position.coords.latitude;
  long = position.coords.longitude;
  snail.src = 'img/snail-smiling.png';

  const payload = {
    userId: getUserId(),
    lat: lat,
    long: long
  };
  const url = API_DOMAIN + "/snail/notify";
  xmlHttp = new XMLHttpRequest();
  xmlHttp.open("POST", url, true);
  xmlHttp.withCredentials = true;
  xmlHttp.onload = handleSnailResponse;
  xmlHttp.send(JSON.stringify(payload));
}

function handleSnailResponse(event) {
  const result = defaultHandler(event);
  const distance = result.responseJson.distance;
  const time = result.responseJson;
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