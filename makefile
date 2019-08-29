ECHO = @echo
FETCH = @curl --silent

pip_options =
DATABASE=$(PWD)/demo/demo_db.neph

.PHONY: demo runserver install assets requirements


help:
	$(ECHO) "- help		: Display this message"
	$(ECHO) "- runserver	: Run server"
	$(ECHO) "- install	: Donwload external assets and Python packages"
	$(ECHO) "- clean-maps	: Delete all downloaded maps"
	$(ECHO) "- clean-assets	: Delete external assets"
	$(ECHO) "- simulation	: Launch paparazzi simulation"


install : assets requirements

assets :
	$(ECHO) -n "Creating static folders ... "
	@mkdir -p web/nephelae_gui/static/js/libs web/nephelae_gui/static/css/libs/images web/nephelae_gui/static/map_tiles web/nephelae_gui/static/css/libs/icons
	$(ECHO) "OK"

	$(ECHO) -n "Downloading javascript libraries ... "
	$(FETCH) --output web/nephelae_gui/static/js/libs/jquery.js 'https://code.jquery.com/jquery-3.4.1.min.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/cookies.js 'https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/jqueryUI.js 'https://code.jquery.com/ui/1.12.1/jquery-ui.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/dat.gui.js 'https://raw.githubusercontent.com/dataarts/dat.gui/master/build/dat.gui.min.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/leaflet.js 'https://unpkg.com/leaflet@1.5.1/dist/leaflet.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/leafletRotatedMarker.js 'https://raw.githubusercontent.com/bbecquet/Leaflet.RotatedMarker/master/leaflet.rotatedMarker.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/materialize.js 'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/three.js 'https://cdnjs.cloudflare.com/ajax/libs/three.js/107/three.min.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/OrbitControls.js 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/js/controls/OrbitControls.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/GLTFLoader.js 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/loaders/GLTFLoader.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/plotly.js 'https://cdn.plot.ly/plotly-latest.min.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/googleCharts.js 'https://www.gstatic.com/charts/46.2/js/jsapi_compiled_format_module.js'
	$(FETCH) 'https://www.gstatic.com/charts/46.2/js/jsapi_compiled_default_module.js' >> web/nephelae_gui/static/js/libs/googleCharts.js
	$(FETCH) 'https://www.gstatic.com/charts/46.2/js/jsapi_compiled_ui_module.js' >> web/nephelae_gui/static/js/libs/googleCharts.js
	$(FETCH) 'https://www.gstatic.com/charts/46.2/js/jsapi_compiled_fw_module.js' >> web/nephelae_gui/static/js/libs/googleCharts.js
	$(FETCH) 'https://www.gstatic.com/charts/46.2/third_party/dygraphs/dygraph-tickers-combined.js' >> web/nephelae_gui/static/js/libs/googleCharts.js
	$(FETCH) 'https://www.gstatic.com/charts/46.2/js/jsapi_compiled_timeline_module.js' >> web/nephelae_gui/static/js/libs/googleCharts.js
	$(ECHO) "OK"

	$(ECHO) -n "Downloading css files ... "
	$(FETCH) --output web/nephelae_gui/static/css/libs/leaflet.css 'https://unpkg.com/leaflet@1.5.1/dist/leaflet.css'
	$(FETCH) --output web/nephelae_gui/static/css/libs/materialize.css 'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css'
	$(FETCH) --output web/nephelae_gui/static/css/libs/material-icons.css 'https://fonts.googleapis.com/icon?family=Material+Icons'
	$(ECHO) "OK"

	$(ECHO) -n "Downloading images ... "
	$(FETCH) --output web/nephelae_gui/static/css/libs/images/layers.png 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.5.1/images/layers.png'
	$(ECHO) "OK"

	$(ECHO) -n "Downloading icons ... "
	$(FETCH) --output web/nephelae_gui/static/css/libs/icons/MaterialIcons-Regular.ttf 'https://raw.githubusercontent.com/google/material-design-icons/master/iconfont/MaterialIcons-Regular.ttf'
	$(ECHO) "OK"

	$(ECHO) -n "Downloading fonts ... "
	$(FETCH) --output web/nephelae_gui/static/css/libs/icons/MaterialIcons-Regular.ttf 'https://raw.githubusercontent.com/google/material-design-icons/master/iconfont/MaterialIcons-Regular.ttf'
	$(ECHO) "OK"

	$(ECHO) -n "Tuning libraries ... "
	@sed -i 's/Open Controls/Open Controls (H to hide)/g' web/nephelae_gui/static/js/libs/dat.gui.js
	@sed -i 's/Close Controls/Close Controls (H to hide)/g' web/nephelae_gui/static/js/libs/dat.gui.js
	@sed -i 's/src.*/src:url("icons\/MaterialIcons-Regular.ttf") format("truetype");/g' web/nephelae_gui/static/css/libs/material-icons.css
	$(ECHO) "OK"


requirements :
	$(ECHO) -n "Installing requirements ... "

	@pip3 install $(pip_options) wheel
	@pip3 install $(pip_options) -r requirements.txt

# @if [ -d "nephelae_base" ]; then \
# 	git -C nephelae_base pull; \
# else \
# 	git clone git://redmine.laas.fr/laas/users/simon/nephelae/nephelae-devel/nephelae_base.git nephelae_base; \
# fi
# @if [ -d "nephelae_mesonh" ]; then \
# 	git -C nephelae_mesonh pull; \
# else \
# 	git clone git://redmine.laas.fr/laas/users/simon/nephelae/nephelae-devel/nephelae_mesonh.git nephelae_mesonh; \
# fi
# @if [ -d "nephelae_paparazzi" ]; then \
# 	git -C nephelae_paparazzi pull; \
# else \
# 	git clone git://redmine.laas.fr/laas/users/simon/nephelae/nephelae-devel/nephelae_paparazzi.git nephelae_paparazzi; \
# fi
# 
# @pip3 install $(pip_options) ./nephelae_base
# @pip3 install $(pip_options) ./nephelae_mesonh
# @pip3 install $(pip_options) ./nephelae_paparazzi
# @rm -rf ./nephelae_base ./nephelae_mesonh ./nephelae_paparazzi

clean-maps :
	@rm -rf web/nephelae_gui/static/map_tiles/*

clean-assets :
	@rm -rf web/nephelae_gui/static/js/libs web/nephelae_gui/static/css/libs/images web/nephelae_gui/static/map_tiles web/nephelae_gui/static/css/libs/icons


runserver: check-meso
	$(ECHO) "Starting server ..."

#dev server (easy to kill, reloads on file changes, used in demo)
	@-cd web && python3 manage.py runserver 0.0.0.0:8000

#prod server (hard to kill, doesn't reload)
	# -@cd ./web && daphne -b 0.0.0.0 -p 8000 --access-log /dev/null IHM.asgi:application


demo: check-meso
	-@export PPRZ_DB=$(DATABASE) && cd web/ && python3 manage.py runserver 0.0.0.0:8000


simulation: check-pprz
	@$(PAPARAZZI_HOME)/sw/simulator/pprzsim-launch -b 127.255.255.255 -a Microjet_neph_0 -t sim --boot --norc &
	@$(PAPARAZZI_HOME)/sw/simulator/pprzsim-launch -b 127.255.255.255 -a Microjet_neph_1 -t sim --boot --norc &
	@$(PAPARAZZI_HOME)/sw/simulator/pprzsim-launch -b 127.255.255.255 -a Microjet_neph_2 -t sim --boot --norc &
	@$(PAPARAZZI_HOME)/sw/simulator/pprzsim-launch -b 127.255.255.255 -a Microjet_neph_3 -t sim --boot --norc &
	@$(PAPARAZZI_HOME)/sw/ground_segment/cockpit/gcs -layout large_left_col.xml &
	@$(PAPARAZZI_HOME)/sw/ground_segment/tmtc/server -n


check-meso:
ifndef MESO_NH
	$(error MESO_NH is not defined)
endif


check-pprz:
ifndef PAPARAZZI_HOME
	$(error PAPARAZZI_HOME is not defined)
endif

# fix a dependency issue in pptk (Ubuntu 18.04)
#mv venv/lib/python3.6/site-packages/pptk/libs/libz.so.1 venv/lib/python3.6/site-packages/pptk/libs/libz.so.1.old
#sudo ln --silent  /lib/x86_64-linux-gnu/libz.so.1 venv/lib/python3.6/site-packages/pptk/libs/
