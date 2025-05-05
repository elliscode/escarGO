# Move the snail really close to you, to test death conditions

pps = JSON.parse(localStorage.getItem('escargo-user-position')); localStorage.setItem('escargo-snail-position', JSON.stringify({"lat":pps.lat - 0.000025,"long":pps.long - 0.000025,"time":Date.now()}));

# Make the snail crazy fast, for testing longitude rollovers

SNAIL_SPEED_IN_FEET_PER_SECOND = 100000; SNAIL_SPEED_IN_FEET_PER_MINUTE = 60 * SNAIL_SPEED_IN_FEET_PER_SECOND;