// Activate current menu in nav
$('#nav_preview').addClass('active');

// Plot settings
var layout = {
    scene: {
        xaxis:{title: 'Longitude'},
        yaxis:{title: 'Latitude'},
        zaxis:{title: 'Altitude'},
        aspectratio: {x:1.3, y:1.3, z:0.9},
        camera: {
            center: { x: 0, y: 0, z: -0.2 }, 
            eye: { x: 1.6, y: 1.6, z: 0.2 }, 
            up: { x: 0, y: 0, z: 1 }
        },
    },
    showlegend: false,
};

var config = { 
    responsive : true,
    displaylogo: false,
    displayModeBar: false,
};

// Parameters 
var parameters = {
    trail_length: 60,
    update: drawPlot,
    variable: 'WT',
    color_mapping: {WT: ['samples', 'viridis'], RCT: ['samples', 'viridis'] },
}


$(document).ready(function(){

    // // Inititalize parameters before drawing plot
    setupGUI();

});

function setupGUI(){

    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    var f1 = gui.addFolder('Controls');
    f1.add(parameters, 'trail_length', 30, 3000).step(10).name("Trail length (s)").onChange(drawPlot);
    f1.add(parameters, 'variable', ['WT', 'RCT']).name("Trail color").onChange(drawPlot);
    f1.add(parameters, 'update').name('Update plot');

    var f2 = gui.addFolder('Trails');

    $.getJSON('discover/', (response) => {

        for (var key of response.uavs){
            parameters[key] = true;
            f2.add(parameters, key).name('Drone ' + key).onChange(drawPlot);
        }

        // And then display the drones
        drawPlot();
    });
}

function drawPlot(){

    var data = [];
    var query = $.param({uav_id: getSelectedUAVs(), trail_length: parameters.trail_length, variable: parameters.variable});

    $.getJSON('update/?' + query, (response) => {

        //console.log(response)

        for (var key in response.drones){

            // Parse drones data
            var drone_id = key;
            var drone_color = global_colors[key%global_colors.length];
            var drone_path = response.drones[key].path;
            var past_latitudes = [];
            var past_longitudes = [];
            var past_altitudes = [];
            var samples = response.samples[drone_id][parameters.variable]['y'];
            console.log(samples)

            // Compute coordinates from path
            for(var i = 0; i < drone_path.length ; i++){
                past_latitudes.push(drone_path[i][0]);
                past_longitudes.push(drone_path[i][1]);
                past_altitudes.push(drone_path[i][2]);
            }

            // Display colorbar if only one UAV is selected
            var displayColorBar = getSelectedUAVs().length == 1;

            // Update chart data with new dataset and line color corresponding to the icon
            var updatePath = {
                type: 'scatter3d',
                x: past_longitudes,
                y: past_latitudes,
                z: past_altitudes,
                name: drone_id,
                mode: 'lines',
                line: {
                    width: 5,
                    shape: 'spline',
                    color: samples,
                    //colorscale: 'Electric',
                    showscale: displayColorBar,
                    colorbar: {
                        x: -0.2,
                        xpad: 30,
                    }
                },
            };
            data.push(updatePath);
        }

        // Create or update plot with new data
        Plotly.react('chart', data, layout, config);
        removeLoader();
    });
}

function getSelectedUAVs() {

    var selectedUAVs = [];

    for(key in parameters){
        if (typeof parameters[key] == 'boolean' && parameters[key] == true) selectedUAVs.push(key);
    }

    return selectedUAVs;
}