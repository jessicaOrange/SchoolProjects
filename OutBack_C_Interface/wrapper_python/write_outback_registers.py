import sys
import InverterFactory
import logging
import csv
import json
import datetime
import re
import os.path
import requests
from read_outback_registers import *


def write_values(all_list, reg_start_index, value_start_index):

    inv = InverterFactory.InverterFactory().factory()
    count = value_start_index
    # Process each register by passing its values to local memory and database
    for index in range(reg_start_index, value_start_index):
        register = all_list[index]
        value = all_list[count]
        write_result = str(inv.write(register,value))
        print(write_result)
        count += 1


if __name__ == '__main__':
    # A register list assigned by task
    all_list = sys.argv
    reg_start_index = 1
    value_start_index = (reg_start_index+len(all_list))/2 
    write_values(all_list, reg_start_index, value_start_index)
    # Call read_outback_registers.py to record local and database changes
    progress(all_list[:value_start_index])
