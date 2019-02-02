from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler
import django
import os
import time

os.environ.setDefault("DJANGO_SETTINGS_MODULE", "settings")
django.setup()
from HEMSapp.models import *
from HEMSapp.tasks import *


# Global variable
register_list = ['OutBack_Minute']
write_values = ['3']
queue = '1'


def call_write_task():
    if len(register_list) != len(write_values):
        return False
    result = writeRegValues.apply_async(args=[register_list,write_values], queue=queue, routing_key=queue)
    tries = 0
    while result.status != 'SUCCESS':
        print(result.status)
        tries += 1
        time.sleep(1)
        if tries > 100:
            return False
    received_result = result.get()
    print(received_result)
    return received_result


def call_read_task():
    result = readRegValues.apply_async(args=[register_list], queue=queue, routing_key=queue)
    tries = 0
    while result.status != 'SUCCESS':
        print(result.status)
        tries += 1
        time.sleep(1)
        if tries > 100:
            return False
    received_result = result.get()
    print(received_result)
    return received_result


def main():
    scheduler = BlockingScheduler()
    scheduler.add_job(call_read_task, 'interval', minutes=5)
    scheduler.add_job(call_write_task, 'interval', minutes=15)
    scheduler.start()


if __name__=='__main__':
    main()
