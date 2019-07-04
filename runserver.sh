#!/bin/bash

function finish() {
	echo "Killing server"
	echo "Deactivating virtual environement"
	exit
}

trap finish SIGINT

echo "Activating virtual environement"
source venv/bin/activate
echo "Starting server on 0.0.0.0:8000"
COMMAND="$(nproc)"
N_WORKERS=$((${COMMAND}))
cd ./web
gunicorn --workers=1 --reload --bind 0.0.0.0:8000 IHM.wsgi

