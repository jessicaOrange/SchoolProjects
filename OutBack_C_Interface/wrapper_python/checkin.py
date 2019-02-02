import json
import requests
from apscheduler.schedulers.blocking import BlockingScheduler

def check_in():
    params = {}
    
    with open('/home/pi/HEMS/project/wrapper_python/system.json', 'r') as json_data:
        d = json.load(json_data)
        params = d['system']

    #r = requests.get('http://172.20.10.5:8000/hems/checkIn', params=params)
    r = requests.get('http://asuleaps.com/hems/checkIn', params=params)
    print(r.text) 
  
def main():
    scheduler = BlockingScheduler()
    scheduler.add_job(check_in, 'interval', seconds=4)
    scheduler.start()

if __name__ == '__main__':
    main()
