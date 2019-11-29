import io
import json
import os
import sys
import time

import matplotlib.pyplot as plt
import numpy as np
from PIL import Image

from nephelae.mapping import compute_com

imcount = 0

from . import utils
from . import common

maps      = common.scenario.maps
hypercube = common.scenario.mesonhDataset

def discover_maps():
    res = {}
    for key in maps.keys():
        if maps[key].bounds()[0] is not None:
            x = maps[key].bounds()
            boundaries = (x[0].min, x[0].max, x[1].min, x[1].max)
        else:
            boundaries = maps[key].bounds()

        res[key] = {'url':key, 'name' : maps[key].name, 'sample_size':
                maps[key].sample_size(), 'range': boundaries}
    print(res)
    return res


def print_horizontal_slice(variable_name, u_time, u_altitude, bounds, origin, thermals_cmap, clouds_cmap, transparent):
   
    x0, x1, y0, y1 = utils.bounds2indices(bounds, origin)
    # indices must be adapted to the resolution of the map. Indices are related
    # to the outer limit of the image outside the pixels, whereas coordinates
    # in maps are assumed to be relative the the center of pixels (i.e. bounds
    # must shrink by half of a pixel size).
    resx_2 = maps[variable_name].resolution()[1] / 2.0
    resy_2 = maps[variable_name].resolution()[2] / 2.0
    x0 = x0 + resx_2
    x1 = x1 - resx_2
    y0 = y0 + resy_2
    y1 = y1 - resy_2

    if "LWC" in variable_name:
        print("Printing slice,", variable_name + " : [" + 
              str(u_time) + ", " + str(x0)+':'+str(x1) + ", " + str(y0)+':'+str(y1) + ", " + str(u_altitude) + "]")
    
    if "LWC" in variable_name:
        t0 = time.time()
    h_slice = maps[variable_name][u_time, x0:x1, y0:y1, u_altitude].data.squeeze().T
    if "LWC" in variable_name:
        print("Ellapsed time :", time.time() - t0)
    rng     = maps[variable_name].range()

    # global imcount
    # if "LWC" in variable_name:
    #     print("Got slice, mean :", h_slice.ravel().mean())
    #     print("Got slice, rng  :", rng)
    #     plt.imsave(str(imcount)+".png", h_slice, origin='lower', cmap='viridis', format='png')
    #     imcount = imcount + 1


    # To be made dynamic
    if variable_name == 'clouds':
        colormap = utils.transparent_cmap(clouds_cmap) if transparent else clouds_cmap
    # elif variable_name == 'thermals':
    else:
        colormap = utils.transparent_cmap(thermals_cmap) if transparent else thermals_cmap

    # Write image to buffer
    # colormap = 'viridis'
    # rng      = maps['clouds'].range()
    if "LWC" in variable_name:
        h_slice[h_slice < 0.0] = 0.0
    
    rFactor = 4
    img = Image.fromarray(h_slice)
    # h_slice = np.array(img.resize((h_slice.shape[0]*rFactor, h_slice.shape[1]*rFactor), Image.BICUBIC))
    h_slice = np.array(img.resize((h_slice.shape[0]*rFactor, h_slice.shape[1]*rFactor), Image.NEAREST))
    # h_slice = h_slice[::2, ::2]
    buf = io.BytesIO()
    # plt.imsave(buf, h_slice, origin='lower', cmap=colormap, format='png')
    if not rng:
        plt.imsave(buf, h_slice, origin='lower', cmap=colormap, format='png')
    else:
        plt.imsave(buf, h_slice, origin='lower', vmin=rng[0].min, vmax=rng[0].max, cmap=colormap, format='png')
    plt.close()
    buf.seek(0)

    return buf


def get_horizontal_slice(variable, time_value, altitude_value, x0=None, x1=None, y0=None, y1=None):
    map0 = maps[variable][time_value, x0:x1, y0:y1, altitude_value]
    x_axis = np.linspace(map0.bounds[0].min, map0.bounds[0].max,
            map0.data.T.shape[0])
    y_axis = np.linspace(map0.bounds[1].min, map0.bounds[1].max,
            map0.data.T.shape[1])
    return (map0.data.T, x_axis, y_axis)

def get_center_of_horizontal_slice(variable, time_value, altitude_value,
        x0=None, x1=None, y0=None, y1=None):
    map0 = maps[variable][time_value, x0:x1, y0:y1, altitude_value]
    return {'data': compute_com(map0)}

def get_wind(variable, u_time, u_altitude, bounds, origin):

    """Used to fetch vector2D field from maps for the wind overlay"""

    x0, x1, y0, y1 = utils.bounds2indices(bounds, origin)
    wind = maps[variable][u_time, x0:x1, y0:y1, u_altitude].data.squeeze()

    # header template
    header = {
        'parameterUnit': 'm.s-1',
        'parameterCategory': 2,
        'parameterNumber': 2,
        'parameterNumberName': 'eastward_wid',
        'dx' : 25.0,
        'dy' : 25.0,
        'la1': bounds['north'],
        'la2': bounds['south'],
        'lo1': bounds['west'],
        'lo2': bounds['east'],
        'nx' : wind.shape[0],
        'ny' : wind.shape[1],

    }

    s1 = json.dumps({'header': header, 'data': wind[:,:,0].ravel().tolist()})

    header['parameterNumber'] = 3
    header['parameterNumberName'] = 'northward_wind'
    
    s2 = json.dumps({'header': header, 'data': wind[:,:,1].ravel().tolist()})

    return [eval(s1), eval(s2)]


def axes():
    return hypercube.dimensions[3]['data'].tolist()


def box():
    dims = hypercube.dimensions
    box = [
        {'min': dims[0]['data'][0], 'max':dims[0]['data'][-1]},
        {'min': dims[1]['data'][0], 'max':dims[1]['data'][-1]},
        {'min': dims[3]['data'][0], 'max':dims[3]['data'][-1]},
        {'min': dims[2]['data'][0], 'max':dims[2]['data'][-1]}]
    return box

