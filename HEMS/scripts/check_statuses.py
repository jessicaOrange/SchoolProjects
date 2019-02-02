from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler
import django

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")
django.setup()
from HEMSapp.models import *

def status_check():
    boxes = BoxStatusInfo.objects.all()
    for box in boxes:
        diff = datetime.now() - box.lastCheckIn

        if diff.total_seconds() > 5:
            print("diff: {}".format(diff.total_seconds()))
            box.isOn = False
            box.save()

def main():
    scheduler = BlockingScheduler()
    scheduler.add_job(status_check, 'interval', seconds=5)
    scheduler.start()

if __name__ == '__main__':
    main()
