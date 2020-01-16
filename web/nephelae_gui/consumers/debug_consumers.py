import json

from channels.generic.websocket import WebsocketConsumer

try:
    from ..models.common import scenario, db_data_tags
    from ..models.common import websockets_cloudData_ids
    from utm import from_latlon, to_latlon

    localFrame = scenario.localFrame
    windMap = scenario.windMap

except Exception as e:
    import sys
    import os
    # Have to do this because #@%*&@^*! django is hiding exceptions
    print("# Caught exception #############################################\n    ", e, flush=True)
    exc_type, exc_obj, exc_tb = sys.exc_info()
    fname = exc_tb.tb_frame.f_code.co_filename
    print(exc_type, fname, exc_tb.tb_lineno,
         end="\n############################################################\n\n\n", flush=True)
    raise e

class DebugTrackerConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        for aircraft in scenario.aircrafts.values():
            if hasattr(aircraft, 'add_debug_tracker_observer'):
                aircraft.add_debug_tracker_observer(self)
            else:
                print('No point observer detected for ' + aircraft.id)
        
    def disconnect(self, close_code):
        for aircraft in scenario.aircrafts.values():
            if hasattr(aircraft, 'remove_debug_tracker_observer'):
                aircraft.remove_debug_tracker_observer(self)
        self.channel_layer.group_discard
    
    def tracker_debug(self, debug_infos):
        print(debug_infos)
