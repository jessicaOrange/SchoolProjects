import sys
import InverterFactory
import logging
import csv
import json
import datetime
import re
import os.path
import requests


def send_data(result, register, pi_id, record_time):
    data = {'register_name': register, 'value': result, 'date_time': record_time, 'pi_id': pi_id}
    return data


def record_data(result, register, pi_id, record_time, index):
    if os.path.exists('/home/pi/HEMS/project/wrapper_python/records.json'):
        # Read data
        config = json.loads(open('records.json').read())
        json_len = len(config)
        # Update data
        if index == 1:
            data = {'interval_records': [
                {'register_name': register, 'value': result, 'date_time': record_time, 'pi_id': pi_id}
            ]}
            config.append(data)
        else:
            data = {'register_name': register, 'value': result, 'date_time': record_time, 'pi_id': pi_id}
            config[json_len-1]['interval_records'].append(data)
        # Write all data back to file
        with open('records.json', 'w') as json_data:
            #json_data.write(json.dumps(config))
            #json_data.write("\n")
            json.dump(config, json_data, indent=2)
    else:
        data = [{'interval_records': [
                {'register_name': register, 'value': result, 'date_time': record_time, 'pi_id': pi_id}
                ]}]
        with open('/home/pi/HEMS/project/wrapper_python/records.json', 'w') as outfile:
            json.dump(data, outfile, indent=2)


def clear_text(read_result):
    val_lst = re.findall(r'\d+', read_result)
    if not val_lst:
        return 'None'
    else:
        return val_lst[0]


def progress(register_list):
    with open('/home/pi/HEMS/project/wrapper_python/system.json', 'r') as json_data:
        d = json.load(json_data)
        pi_id = d["system"]["box_id"]

    inv = InverterFactory.InverterFactory().factory()
    # Process each register by passing its values to local memory and database
    for index in range(1,len(register_list)):
        register = register_list[index]
        read_result = str(inv.read(register))
        print(read_result)
        result = clear_text(read_result)
        print(result)
        record_time = datetime.datetime.now().isoformat()
        record_data(result, register, pi_id, record_time, index)
        # Send data to Database via server
        params = send_data(result, register, pi_id, record_time)
        r = requests.get('http://asuleaps.com/hems/recordValue', params)
        print(r.text)


if __name__ == '__main__':
    # A register list assigned by task
    progress(sys.argv)
