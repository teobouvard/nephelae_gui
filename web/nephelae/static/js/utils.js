// Add CSS colors (in order corresponding to plane_icons folder) for more drones
global_colors = ["red", "green", "blue", "purple", "teal", "orange", "lime", "yellow", "fuchsia", "gray"];
global_icons = [];

// Icon class
var planeIcon = L.Icon.extend({
    options: { 
        iconSize:     [20, 20], // size of the icon
        iconAnchor:   [10, 10], // marker's location.setView([43.6047, 1.4442], 13);
        popupAnchor:  [0, 0]    // relative to the iconAnchor
    }
});

// Create an icon for each image in the icon folder
for(var i = 0; i < global_colors.length; i++){
    var random_icon = new planeIcon({iconUrl: '/map/plane_icon/' + i})
    global_icons.push(random_icon);
}


function createLayout(variable, values){

    var min_value = getMin(values);
    var max_value = getMax(values);
    var zero_value = (min_value != max_value) ? Math.abs(min_value / (max_value - min_value)) : 0.5;
    var cmap, title;

    switch(variable){
        case "WT":
            cmap = thermals_colormap(zero_value);
            title = 'Vertical wind in m/s';
            break;
        case "RCT":
            cmap = clouds_colormap(zero_value);
            title = "Liquid Water Content in kg/kg"
            break;
        default:
            cmap = 'Viridis';
            title = "Unknown variable"
            break;
    }

    return {'cmap': cmap, 'title': title}  
}

// colormap has to be adjusted for the zero value to be white
function thermals_colormap(zero_value){
    var cmap = [
        [0, 'rgb(0,0,255)'],   
        [zero_value, 'rgb(255, 255, 255)'],
        [1, 'rgb(255,0,0)']
    ];
    return cmap
}

// colormap has to be adjusted for the zero value to be white
function clouds_colormap(zero_value){
    var cmap = [
        [0, 'rgb(255, 255, 255)'],
        [zero_value, 'rgb(255, 255, 255)'],
        [1, 'rgb(128, 0, 128)']
    ];
    return cmap
}

// Utility functions to get min/max of multidimensional arrays
function getMax(a){
    return Math.max(...a.map(e => Array.isArray(e) ? getMax(e) : e));
}

function getMin(a){
    return Math.min(...a.map(e => Array.isArray(e) ? getMin(e) : e));
}
