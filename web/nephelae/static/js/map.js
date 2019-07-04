// Activate current menu in nav
document.getElementById('nav_map').className = 'active';

var flight_map, zoom_home;
var tiles_overlay, path_overlay, markers_overlay, cloud_overlay;

// Data from MESO_NH, will come from mapping later
var imageBounds = [[43.432883, 1.247409], [43.490199, 1.327060]];
var max_time_index = 143;
var time_index = 0;

/*
    drones     : { key           :   drone_id,   values : value_dict }
    value_dict : { color         :   global_colors[index_icon], 
                   position      :   marker, 
                   altitude      :   float, 
                   heading       :   float,
                   polyline      :   L.Polyline,
                   past_positions:   [positions]
                   last_position :   LatLng
                 }
*/
var drones = {};

// Parameters 
var refresh_rate = 800; //milliseconds
var trail_length = length_slider.value;
var clouds_altitude = altitude_slider.value;

$(document).ready(function(){
    // Initialize document elements
    initializeMap();

    // Display initial info
    updateInfo();

    // Update elements every 'refresh_rate' ms
    displayDrones();
});

function initializeMap(){
    // Map
    flight_map = L.map('map_container', {zoomControl: false, maxZoom : 15});

    // Home button
    zoomHome = L.Control.zoomHome();

    // Create layers (add/remove .grayscale() if you want a grey/colored map)
    //tiles_overlay = L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {maxZoom: 18});
    tiles_overlay = L.tileLayer('tile/{z}/{x}/{y}', {maxZoom : 15});
    path_overlay = L.layerGroup();
    markers_overlay = L.layerGroup();
    cloud_overlay = L.imageOverlay('clouds_img/' + time_index + '/' + clouds_altitude, imageBounds); 

    // Set layers names
    var base_layers = {
    };

    var overlays = {
        "Map": tiles_overlay,
        "Trails": path_overlay,
        "Markers": markers_overlay,
        "Clouds": cloud_overlay,
    };

    // Add layers to the map
    L.control.layers(base_layers, overlays).addTo(flight_map);

    // Display everything on initialization
    for(key in overlays) { overlays[key].addTo(flight_map); }
}

function displayDrones(){
    var addedDrones = [];
    var index_icon = 0;

    $.getJSON('update/', function(response){

        // Initialize drone array with drone_id and position marker
        for (var key in response){

            // Compute color and icon of markers, increment index_icon for next drone 
            var drone_color = global_colors[index_icon%global_colors.length];
            var drone_icon = global_icons[index_icon++%global_colors.length];

            // Parse response data
            var drone_id = key;
            var drone_position = response[key].position;
            var drone_altitude = response[key].altitude;
            var drone_heading = response[key].heading;
            var drone_path = response[key].path.slice(-trail_length);
            
            // Create leaflet marker and polyline at drone position
            var marker = L.marker(drone_position, {icon: drone_icon});
            var polyline = L.polyline([drone_path], {color : drone_color, weight : '2', dashArray : '5,7'});
            
            // Update drones dictionnary with discovered drone
            drones[drone_id] = ({
                color : drone_color, 
                position : marker, 
                altitude : drone_altitude, 
                heading: drone_heading,
                path : polyline,
            });

            // Add drone marker to layer group
            drones[drone_id].position.setRotationAngle(drone_heading).addTo(markers_overlay);
            drones[drone_id].position.bindPopup(infosToString(drone_id, drone_altitude, drone_heading));
            drones[drone_id].path.addTo(path_overlay);
            addedDrones.push(drone_id);
        }

        // Log added drones 
        console.debug('drones', addedDrones, 'added to overlays');

        // Center map on drone last drone added
        if(addedDrones.length != 0){
            flight_map.setView(drone_position, 15);
            zoomHome.addTo(flight_map);
            setInterval(updateDrones, refresh_rate);
        } else {
            alert("No drones detected, try launching the simulation and restart the server");
        }
    });
}

function updateDrones(){

    // Request updated data from the server
    $.getJSON('update/', function(response){

        // Parse response
        for (var key in response){
            var drone_id = key;
            var drone_position = response[key].position;
            var drone_altitude = response[key].altitude;
            var drone_heading = response[key].heading;
            var drone_path = response[key].path.slice(-trail_length);

            // Identify corresponding drone ...
            var drone_to_update = drones[drone_id];

            // ... and update it
            if(drone_to_update){

                // Update markers
                drone_to_update.position.setLatLng(drone_position).setRotationAngle(drone_heading);
                drone_to_update.position.setPopupContent(infosToString(drone_id, drone_altitude, drone_heading));

                // Update polyline
                drone_to_update.path.setLatLngs(drone_path);
            } 
            // ... or display error message if drone id does not match -> update drones dictionnary and start tracking it
            else {
                console.error("no drone with id ", drone_id, " found !");
                initializeDrones(); // NOT SURE IF THIS IS WORKING, CAN'T TEST ?
            }
        }
        // Update home button coordinates and cloud overlay
        zoomHome.setHomeCoordinates(drone_position);
        time_index = time_index++%max_time_index;
        cloud_overlay.setUrl('clouds_img/'+ time_index++ +'/'+ clouds_altitude);
    });

}

function updateInfo(){
    if(trail_length == 1){
        length_display.innerHTML = "no trail";
    } else if (trail_length == 2){
        length_display.innerHTML = "trail length : last second";
    } else {
        length_display.innerHTML = "trail length : last " + (trail_length - 1) + " seconds";
    }

    altitude_display.innerHTML = "clouds altitude : " + clouds_altitude + " (MesoNH index)";
    cloud_overlay.setUrl('clouds_img/'+ time_index +'/'+ clouds_altitude);
}

// Update trail length, display 0 when slider is 1 to not slice(0)
length_slider.oninput = function() {
    trail_length = this.value;
    updateInfo();
}

// Update cross section altitude, display 0 when slider is 1 to not slice(0)
altitude_slider.oninput = function() {
    clouds_altitude = this.value;
    updateInfo();
}

// Print HTML formatted string so that it can be added to marker popup
function infosToString(id, altitude, heading){
    var infos = '<p style=text-align:center>';

    infos += 'Drone ';
    infos += id + ' <br> ' ;
    infos += altitude + 'm <br> ';
    infos += heading + '° <br> ';
    infos += '</p>'

    return infos;
}
