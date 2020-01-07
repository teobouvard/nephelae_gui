from django.http import JsonResponse

from nephelae_gui.models import hypercube, utils
from nephelae_gui.models.common import scenario, db_data_tags

from utm import from_latlon

nav_frame   = utils.local_frame_latlon()
flight_area = utils.flight_area_latlon()
database    = scenario.database

# Returns discovered UAVs and navigation frame info
def discover(request):
    uavs = {}
    for key in scenario.aircrafts.keys():
        uavs[key] = {}
        uavs[key]['id'] = str(key)
        uavs[key]['name'] = scenario.aircrafts[key].config.ac_name
        uavs[key]['gui_color'] = scenario.aircrafts[key].config.default_gui_color
    return JsonResponse({'origin': nav_frame,
                         'uavs':uavs,
                         'sample_tags':db_data_tags,
                         'flight_area': flight_area},
                        safe=False)


def get_positions(request):
    """Seems to be only used in 3D WebGL page (consider removal ?)"""

    # Parse request parameters
    trail_length = int(request.GET.get('trail_length'))
    uav_ids = [int(item) for item in request.GET.getlist('uav_id[]')]
    reality = request.GET.get('reality') == "true"

    positions = {}
    for uav_id in uav_ids:

        messages = [entry.data for entry in \
            database['STATUS', str(uav_id)](lambda x: x.data.position.t)[-trail_length:]]

        # Gather most recent information for display
        positions[uav_id] = {
            'heading': messages[-1].heading,
            'speed': messages[-1].speed,
            'time': messages[-1].position.t,
            'path': []
        }

        for message in messages:
            if reality:
                position = [message.lat, message.long, message.alt]
            else:
                position = [message.position.x,
                            message.position.y,
                            message.position.z]
            positions[uav_id]['path'].append(position)

    return JsonResponse({'positions':positions})


def get_positions_latlong(request):
    trail_length = int(request.GET.get('trail_length'))
    uav_ids = [int(item) for item in request.GET.getlist('uav_id[]')]

    positions = {}
    for uav_id in uav_ids:
        messages = [entry.data for entry in \
            database['STATUS', str(uav_id)](lambda x: x.data.position.t)[-trail_length:]]
        # Gather most recent information for display
        positions[uav_id] = {
            'heading': messages[-1].heading,
            'speed'  : messages[-1].speed,
            'time'   : messages[-1].position.t,
            'path'   : [],
            'times'  : []
        }
        for message in messages:
            positions[uav_id]['path'].append([message.lat,
                                              message.long,
                                              message.alt])
            positions[uav_id]['times'].append(message.position.t)

    return JsonResponse({'positions':positions})


def get_available_missions(request, aircraftId):
    response = {'aircraftId':aircraftId}
    try:
        response['mission_types'] =\
            list(scenario.aircrafts[aircraftId].mission_types())
    except AttributeError as e:
        response['mission_types'] = []
    except KeyError:
        warn("Could not find aircraft '"+aircraftId+
             "' while fetching mission types.")
        response['mission_types'] = []
    return JsonResponse(response)


