
from celery import Celery
from kombu import Queue

import subprocess
import random
import os
import requests
import time
import logging
import sys
import json
import socket
import fcntl
import struct


app = Celery('interface_worker', backend='amqp', broker='amqp://Kevin:ASUi3dea@127.0.0.1/pi_env')
queue_number_str = '1'
CELERY_DEFAULT_QUEUE = 'interface'
CELERY_QUEUES = (Queue('interface', routing_key='interface'),
    Queue('updater', routing_key='updater'),
    Queue('outback', routing_key='outback'),)

@app.task(name='add')
def add(x, y):
    return x + y

def create_celery_queue(queue_name):
    CELERY_QUEUES.append(Queue(queue_name, routing_key=queue_name))
    # TODO: WRITE TO A FILE OR CREATE ALL QUEUES ON START UP FROM DATABASE

def create_celery_queue_temp(queue_name):
    CELERY_QUEUES.append(Queue(queue_name, routing_key=queue_name))
    return len(CELERY_QUEUES) - 1

def remove_celery_queue(index):
    pass

@app.task(name='check_device_status')
def check_device_status(hemsID):
    #TODO: write code that determines if pi is active
    return True

def initial_handshake(hemsID):
    # step 1 create queue
    queue = create_celery_queue(hemsID)
    # step 2 add task to queue
    status = check_device_status.apply_async(args=[hemsID], queue=queue, routing_key=queue)
    # step 3 look at result / register a timeout
    tries = 0
    while status.state != 'SUCCESS':
        print status.state
        tries += 1
        time.sleep(1)
        if tries > 4:
            return False

    return True

@app.task(name='getAlle')
def getAll(inverter_id):
    # inverter = Inverter()
    # result = inverter.getAlle("0")

    print("inverter id: {0}").format(inverter_id)
    return {"inverter_id": inverter_id}

@app.task(name='readValue')
def readValue(device_name):
    path = "HEMS/project/wrapper_python"
    os.chdir(path)
    result = subprocess.Popen(["python", "read_outback.py", device_name], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    out, err=result.communicate()
    if result.returncode != 0:
        raise OSError("covert error")
    return out

@app.task(name='writeValue')
def writeValue(device_name, value):
    path = "HEMS/project/wrapper_python"
    os.chdir(path)
    result = subprocess.Popen(["python", "write_outback.py", device_name, value], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    out, err=result.communicate()
    if result.returncode != 0:
        raise OSError("covert error")
    return out

def getOutBackResult(hems_device, hems_method, hems_value, hems_pi):
    # step 1 create queue
    #queue = create_celery_queue("1")
    # step 2 add task to queue
    print(hems_device)
    print(hems_method)
    print(hems_value)
    print(hems_pi)
    if hems_method=="read":
        # assign pi to do the tasks
        return getReadValue(hems_device, hems_pi)
    elif hems_method=="write":
        # assign pi to do the tasks
        return getWriteValue(hems_device, hems_value, hems_pi)

def getOutBackCommandResult(hems_command):
    words = hems_command.split()
    method = words[0]
    if method == "read":
        if check_read_words(words):
            return getReadValue(words[1])
        else:
            return "Please check your command line"
    elif method == "write":
        if check_write_words(words):
            return getWriteValue(words[1], words[2])
        else:
            return "Please check your command line"
    else:
        return "Please check your command line!"

# Helper Method #
def getReadValue(hems_device, hems_pi):
    if hems_pi=="2":
        result = readValueTrans.apply_async(args=[hems_device], queue="1",routing_key="1")
        tries = 0
        while result.status != 'SUCCESS':
            print(result.status)
            tries += 1
            time.sleep(1)
            if tries > 100:
                return "Cannot get result."
        # receive result from pi
        received_result = result.get()
        print(received_result)
        return received_result
    else:
        result = readValue.apply_async(args=[hems_device], queue=hems_pi,routing_key=hems_pi)
        tries = 0
        while result.status != 'SUCCESS':
            print(result.status)
            tries += 1
            time.sleep(1)
            if tries > 100:
                return "Cannot get result."
        # receive result from pi
        received_result = result.get()
        print(received_result)
        return received_result


def getWriteValue(hems_device, hems_value, hems_pi):
    if hems_pi=="2":
        result = writeValueTrans.apply_async(args=[hems_device,hems_value], queue="1",routing_key="1")
        tries = 0
        while result.status != 'SUCCESS':
            print(result.status)
            tries += 1
            time.sleep(1)
            if tries > 100:
                return "Cannot get result."
        # receive result from pi
        received_result = result.get()
        print(received_result)
        return received_result
    else:
        result = writeValue.apply_async(args=[hems_device, hems_value], queue=hems_pi,routing_key=hems_pi)
        tries = 0
        while result.status != 'SUCCESS':
            print(result.status)
            tries += 1
            time.sleep(1)
            if tries > 100:
                return "Cannot get result"
        # receive result from pi
        received_result = result.get()
        print(received_result)
        return received_result


def check_read_words(words):
    if len(words) != 2:
        return False
    return True

def check_write_words(words):
    if len(words) != 3:
        return False
    return True

@app.task(name='readRegs')
def readRegValues(register_names):
    result = subprocess.Popen(['python', 'read_outback_registers.py'] + register_names, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    out, err = result.communicate()
    if result.returncode != 0:
        print('stderr: [%s]' % err)
        print('stderr: [%s]' % out)
    return True

@app.task(name='writeRegs')
def writeRegValues(register_names, write_values):
    result = subprocess.Popen(['python','write_outback_registers.py']+register_names+write_values, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    out, err = result.communicate()
    if result.returncode != 0:
        print('stderr: [%s]' % err)
        print('stderr: [%s]' % out)
    return True

@app.task(name='readValueTrans')
def readValueTrans(device_name):
    result = trans.readValue.apply_async(args=[device_name], queue='2', routing_key='2')
    while not result.ready():
        print('waiting for result from slave')
        time.sleep(1)

    with allow_join_result():
        return result.get()

@app.task(name='writeValueTrans')
def writeValueTrans(device_name, value):
    result = trans.readValue.apply_async(args=[device_name, value], queue='2', routing_key='2')
    while not result.ready():
        print('waiting for result from slave')
        time.sleep(1)

    with allow_join_result():
        return result.get()

@app.task(name='readRegsTrans')
def readRegValuesTrans(register_names):
    result = trans.readValue.apply_async(args=[register_names], queue='2', routing_key='2')
    while not result.ready():
        print('waiting for result from slave')
        time.sleep(1)

    with allow_join_result():
        return result.get()

@app.task(name='writeRegsTrans')
def writeRegValuesTrans(register_names, write_values):
    result = trans.readValue.apply_async(args=[register_names, write_values], queue='2', routing_key='2')
    while not result.ready():
        print('waiting for result from slave')
        time.sleep(1)

    with allow_join_result():
        return result.get()
