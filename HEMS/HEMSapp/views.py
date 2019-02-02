from django.shortcuts import render, redirect
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from . import forms
from models import GridOut, GridPowerNet, get_assets
import csv
import os
import json
import unicodedata
import pandas as pd
import ast
import tasks

def index(request):
    form = forms.NameForm()
    return render(request, 'HEMSapp/index.html', {'form': form})


def home(request):
    first_name = request.user.first_name
    last_name = request.user.last_name
    context = {
        'first_name': first_name,
        'last_name': last_name,
    }
    grid_out = GridOut.objects.filter(grid__owner=request.user)
    if len(grid_out) > 0:
        grid_out = grid_out[0]
	first_data = GridPowerNet.objects.filter(object_id=grid_out.unique_id).first()
    	first_month = first_data.timestamp.strftime('%B %Y') # so we know where to start our chart
        context['first_month'] = first_month
    boxes = get_assets(request.user.hemsbox_set.all()) #func comes from models.py

    context['boxes'] = boxes


    return render(request, 'HEMSapp/ratePayerDash.html', context)


def registerDevice(request):
    return render(request, 'HEMSapp/registerDevice.html')


def addAsset(request):
    return render(request, 'HEMSapp/addAsset.html')


def selectDevice(request):
    # Open .csv file if there exists on file system
    if has_previous_file('category_field.txt') and has_previous_file('field_value.txt'):
        category_field_json = open_previous_file('category_field.txt')
        print(category_field_json)
        field_value_json = open_previous_file('field_value.txt')
        print(field_value_json)
        return render(request, 'HEMSapp/selectDevice.html', {
            'category_field_list': category_field_json,
            'field_value_list': field_value_json
        })
    return render(request, 'HEMSapp/selectDevice.html', {
            'category_field_list': json.dumps(None),
            'field_value_list': json.dumps(None)
    })


def simpleUpload(request):

    if request.method == "POST" and request.FILES['csv_file']:
        # Delete pre-existing csv file on file System
        if has_previous_file('category_field.txt') and has_previous_file('field_value.txt'):
            delete_previous_file('category_field.txt')
            delete_previous_file('field_value.txt')

        csv_file = request.FILES['csv_file']

        # Parse uploaded csv file into pandas DataFrame format
        data_category_field = csv_read("Category", "Field", csv_file)
        data_field_value = csv_read("Field", "Value", csv_file)
        category_field_data_frame = to_data_frame(data_category_field, 'Category', 'Field')
        field_value_data_frame = to_data_frame(data_field_value, 'Field', 'Value')

        # Convert data frame format to json
        category_field_json = to_json_format(category_field_data_frame)
        print(category_field_json)
        field_value_json = to_json_format(field_value_data_frame)
        print(field_value_json)

        # Save newly created json data to txt file
        save_file(category_field_json, field_value_json)

        return render(request, 'HEMSapp/selectDevice.html', {
            'category_field_list': eval(json.dumps(category_field_json)),
            'field_value_list': eval(json.dumps(field_value_json))
        })

    return render(request, 'HEMSapp/selectDevice.html')

def autoWriteOutbackSeries(request):
    write_box = request.POST["write_box"]
    field_value_json = open_previous_file('field_value.txt')
    write_value_outback(field_value_json, write_box)

############## Helper functions ##############


def csv_read(group, aggregate, csv_file):
    data = []
    i = 0
    reader = csv.DictReader(csv_file)
    for row in reader:
        if not data:
            data.append([row[group],row[aggregate]])
        else:
            if row[group] == data[i-1][0] and row[aggregate] == data[i-1][1]:
                continue
            data.append([row[group],row[aggregate]])
        i += 1
    return data


def to_data_frame(data, group, aggregate):
    df = pd.DataFrame(data=data, columns=[group, aggregate])
    gp = df.groupby(group).agg({aggregate: lambda x: ','.join(x)})
    return gp


def to_json_format(data):
    json_str = data.to_json(orient='index')
    json_loads = json.loads(json_str)
    for majorkey, subdict in json_loads.iteritems():
        for subkey, value in subdict.iteritems():
            value = value.split(',')
            json_loads[majorkey] = value
    return json_loads


def open_previous_file(file_name):
    if os.path.exists(file_name):
        with open(file_name) as infile:
            return eval(json.dumps(json.load(infile)))


def save_file(category_field_json, field_value_json):
    with open('category_field.txt', 'w') as outfile:
        json.dump(category_field_json, outfile)

    with open('field_value.txt', 'w') as outfile:
        json.dump(field_value_json, outfile)


def has_previous_file(file_name):
    return os.path.exists(file_name)


def delete_previous_file(file_name):
    os.remove(file_name)


def unicode_convert(unicode_dictionary):
    # Convert a unicode to string
    #return ast.literal_eval(json.dumps(unicode_dictionary))
    return json.dumps(unicode_dictionary)

def write_value_outback(field_value_json, write_box):
    for key in field_value_json:
        tasks.getWriteValue(key, field_value_json[key],write_box)
