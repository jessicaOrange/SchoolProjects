#!/usr/bin/python

import requests
import time
import logging
import sys
import json

def setup_logger(name):
    formatter = logging.Formatter(fmt='%(asctime)s %(levelname)-8s %(message)s',
                                  datefmt='%Y-%m-%d %H:%M:%S')
    handler = logging.FileHandler('../logs/wakeup.log', mode='a')
    handler.setFormatter(formatter)
    screen_handler = logging.StreamHandler(stream=sys.stdout)
    screen_handler.setFormatter(formatter)
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    logger.addHandler(handler)
    logger.addHandler(screen_handler)
    return logger

#time.sleep(30)
logger = setup_logger('wakeup')
logger.info('Here')

logging.basicConfig(filename='../logs/wakeup.log', level=logging.DEBUG)

from tasks import app, parameters 
argv = ['worker', '-A', 'tasks', '-l', 'info', '-Q', parameters['box_id']]
app.worker_main(argv)
