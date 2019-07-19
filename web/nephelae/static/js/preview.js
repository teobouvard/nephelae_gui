// Activate current menu in nav
$('#nav_preview').addClass('active');

// Plot settings
var layout = {
    scene: {
        xaxis:{title: 'x'},
        yaxis:{title: 'y'},
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
    variable: [],
}


$(document).ready(function(){

    // // Inititalize parameters before drawing plot
    setupGUI();

});

function setupGUI(){

    gui = new dat.GUI({ autoplace: false });
    $('#gui_container').append(gui.domElement);

    var f1 = gui.addFolder('Controls');
    f1.add(parameters, 'trail_length', 10, 1000).step(10).name("Log length (s)").onChange(drawPlot);
    f1.add(parameters, 'update').name('Update plot');

    var f2 = gui.addFolder('Trails');

    $.getJSON('discover/', (response) => {

        f1.add(parameters, 'variable', response.sample_tags)
        .setValue(response.sample_tags[0])
        .name("Sensor variable")
        .onChange(drawPlot);

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
    var query = $.param({uav_id: getSelectedUAVs(), trail_length: parameters.trail_length, variables: parameters.variable});

    $.getJSON('update/?' + query, (response) => {

        for (var uav_id in response.data){

            var positions = response.data[uav_id][parameters.variable].positions;
            var sensor_values = response.data[uav_id][parameters.variable].values;
            var x = [];
            var y = [];
            var z = [];
            var text = [];

            // Compute coordinates from path
            for(var i = 0; i < positions.length ; i++){
                x.push(positions[i][1]);
                y.push(positions[i][2]);
                z.push(positions[i][3]);
                // hack to pass multiple data to plotly %text variable
                text.push(positions[i][0].toFixed(2) + 's<br>sensor value : ' + sensor_values[i].toFixed(3));
            }

            // Display colorbar if only one UAV is selected
            var displayColorBar = getSelectedUAVs().length == 1;
            var lay = createLayout(parameters.variable, sensor_values);

            // Update chart data with new dataset and line color corresponding to the icon
            var updatePath = {
                type: 'scatter3d',
                name: uav_id,
                x: x,
                y: y,
                z: z,
                text: text,
                meta: [uav_id],
                hovertemplate:
                    'x : %{x:.1f}m <br>' +
                    'y : %{y:.1f}m <br>' + 
                    'altitude : %{z:.1f}m <br>' +
                    'time : %{text}' +
                    '<extra>UAV %{meta[0]}</extra>',
                hoverlabel: {
                    bgcolor: 'white',
                    bordercolor: global_colors[uav_id%global_colors.length],
                    font: {family: 'Roboto', size: '15', color: global_colors[uav_id%global_colors.length]},
                    align: 'left',
                },
                mode: 'lines',
                line: {
                    width: 5,
                    shape: 'linear',
                    color: sensor_values,
                    colorscale: lay['cmap'],
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