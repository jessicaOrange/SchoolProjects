from django.shortcuts import render_to_response, render
from django.template import RequestContext
from django.contrib import auth
from django.http import HttpResponse, Http404, HttpResponseRedirect
from rest_framework import generics
from rest_framework.views import APIView

from models import *
from serializers import *

import tasks

hems_data_types = {
    "IncidentRadiation": IncidentRadiation,
    "DCPower": DCPower,
    "Energy": Energy,
    "Voltage": Voltage,
    "Current": Current,
    "ACPower": ACPower,
    "ReactivePower": ReactivePower,
    "DCACEfficiency": DCACEfficiency,
    "ChargingVoltage": ChargingVoltage,
    "ChargingCurrent": ChargingCurrent,
    "ChargingRate": ChargingRate,
    "ConverterEfficiency": ConverterEfficiency,
    "DischargingVoltage": DischargingVoltage,
    "DischargingCurrent": DischargingCurrent,
    "DischargingRate": DischargingRate,
    "StateOfCharge": StateOfCharge,
    "GridPowerNet": GridPowerNet,
}

def get_content_object(content_object):
    """
    get the appropriate queryset based on the Asset and Direction
    """
    asset_direction = content_object.rstrip('1234567890')
    asset_directions = {
        "SolarPVIn": SolarPVIn,
        "SolarPVOut": SolarPVOut,
        "InverterIn": InverterIn,
        "InverterOut": InverterOut,
        "GridIn": GridIn,
        "GridOut": GridOut,
        "LoadIn": LoadIn,
        "BatteryIn": BatteryIn,
        "BatteryOut": BatteryOut
    }

    query_set = asset_directions[asset_direction].objects.all()
    return query_set.get(unique_id=content_object)


################### Class Views ##################
class UserList(generics.ListCreateAPIView):
    queryset = HemsUser.objects.all()
    serializer_class = HemsUserSerializer


class UserDetail(generics.RetrieveAPIView):
    queryset = HemsUser.objects.all()
    serializer_class = HemsUserSerializer


class HemsBoxList(generics.ListCreateAPIView):
    queryset = HemsBox.objects.all()
    serializer_class = HemsBoxSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class HemsBoxDetail(generics.RetrieveAPIView):
    queryset = HemsBox.objects.all()
    serializer_class = HemsBoxSerializer

################## Assets ##################
class SolarPVList(generics.ListCreateAPIView):
    queryset = SolarPV.objects.all()
    serializer_class = SolarPVSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class SolarPVDetail(generics.RetrieveAPIView):
    queryset = SolarPV.objects.all()
    serializer_class = SolarPVSerializer

class InverterList(generics.ListCreateAPIView):
    queryset = Inverter.objects.all()
    serializer_class = InverterSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class InverterDetail(generics.RetrieveAPIView):
    queryset = Inverter.objects.all()
    serializer_class = InverterSerializer

class GridList(generics.ListCreateAPIView):
    queryset = Grid.objects.all()
    serializer_class = GridSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class GridDetail(generics.RetrieveAPIView):
    queryset = Grid.objects.all()
    serializer_class = GridSerializer

class LoadList(generics.ListCreateAPIView):
    queryset = Load.objects.all()
    serializer_class = LoadSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class LoadDetail(generics.RetrieveAPIView):
    queryset = Load.objects.all()
    serializer_class = LoadSerializer

class BatteryList(generics.ListCreateAPIView):
    queryset = Battery.objects.all()
    serializer_class = BatterySerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class BatteryDetail(generics.RetrieveAPIView):
    queryset = Battery.objects.all()
    serializer_class = BatterySerializer


##################### In and Out #################
class SolarPVInList(generics.ListCreateAPIView):
    queryset = SolarPVIn.objects.all()
    serializer_class = SolarPVInSerializer

class SolarPVInDetail(generics.RetrieveDestroyAPIView):
    queryset = SolarPVIn.objects.all()
    serializer_class = SolarPVInSerializer


class SolarPVOutList(generics.ListCreateAPIView):
    queryset = SolarPVOut.objects.all()
    serializer_class = SolarPVOutSerializer


class SolarPVOutDetail(generics.RetrieveAPIView):
    queryset = SolarPVOut.objects.all()
    serializer_class = SolarPVOutSerializer

class InverterInList(generics.ListCreateAPIView):
    queryset = InverterIn.objects.all()
    serializer_class = InverterInSerializer


class InverterInDetail(generics.RetrieveAPIView):
    queryset = InverterIn.objects.all()
    serializer_class = InverterInSerializer

class InverterOutList(generics.ListCreateAPIView):
    queryset = InverterOut.objects.all()
    serializer_class = InverterOutSerializer


class InverterOutDetail(generics.RetrieveAPIView):
    queryset = InverterOut.objects.all()
    serializer_class = InverterOutSerializer

class GridInList(generics.ListCreateAPIView):
    queryset = GridIn.objects.all()
    serializer_class = GridInSerializer


class GridInDetail(generics.RetrieveAPIView):
    queryset = GridIn.objects.all()
    serializer_class = GridInSerializer


class GridOutList(generics.ListCreateAPIView):
    queryset = GridOut.objects.all()
    serializer_class = GridOutSerializer


class GridOutDetail(generics.RetrieveAPIView):
    queryset = GridOut.objects.all()
    serializer_class = GridOutSerializer

class LoadInList(generics.ListCreateAPIView):
    queryset = LoadIn.objects.all()
    serializer_class = LoadInSerializer


class LoadInDetail(generics.RetrieveAPIView):
    queryset = LoadIn.objects.all()
    serializer_class = LoadInSerializer

class BatteryInList(generics.ListCreateAPIView):
    queryset = BatteryIn.objects.all()
    serializer_class = BatteryInSerializer


class BatteryInDetail(generics.RetrieveAPIView):
    queryset = BatteryIn.objects.all()
    serializer_class = BatteryInSerializer

class BatteryOutList(generics.ListCreateAPIView):
    queryset = BatteryOut.objects.all()
    serializer_class = BatteryOutSerializer


class BatteryOutDetail(generics.RetrieveAPIView):
    queryset = BatteryOut.objects.all()
    serializer_class = BatteryOutSerializer

#################### HEMS data ###################
import json
import datetime
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required


@csrf_exempt
def hemsDataCreate(request):
    data = json.loads(request.body)
    data_type = hems_data_types[data['data_type']]
    content_object = get_content_object(data['content_object'])

    try:
        obj = data_type.objects.create(content_object=content_object, value=data['value'])
        #TODO: REMOVE IF STATEMENT FOR PRODUCTION
        if data['timestamp']:
            print "at timestamp: {0}".format(data['timestamp'])
            obj.timestamp = datetime.datetime.strptime(data['timestamp'], '%Y-%m-%dT%H:%M:%SZ')
            obj.save()
        return HttpResponse(status='201')
    except:
        return HttpResponse(status='500')


@csrf_exempt
def energy_totals(request):
    month_year_str = request.GET["month"]
    date = datetime.datetime.strptime(month_year_str, '%B %Y')

    #TODO: REMOVE THIS. FOR TESTING ONLY.
    # date = date - datetime.timedelta(weeks=4)

    grid_out = GridOut.objects.filter(grid__owner=request.user)[0]
    data = GridPowerNet.objects.filter(
        object_id=grid_out.unique_id,
        timestamp__year=date.year,
        timestamp__month=date.month #May
    )
    data_tuples = [(item.timestamp.strftime('%Y-%m-%dT%H:%M:%SZ'), item.value) for item in data]
    data_dict = {"data": data_tuples}
    return HttpResponse(json.dumps(data_dict), content_type='application/json')

@csrf_exempt
def register_pi(request):
    data = request.POST.dict()
    print("data: " + str(data))
    hems_id = data["hems_id"]

    handshake_result = tasks.initial_handshake(hems_id)

    # If true, add to database and make perminant queue
    if handshake_result:
        box = HemsBox.objects.create(owner=request.user, hemsID=hems_id)
        return HttpResponseRedirect('/home')
    else:
        return HttpResponse(status='400', message='Error registering device, please make sure your device is connected to the internet and you correctly entered its ID')

@csrf_exempt
def add_asset(request):
    data = request.POST

    hems_box = HemsBox.objects.get(hemsID=data["hems_id"])
    device_type = data["device_type"]
    device_manufacturer = data["device_manufacturer"]
    device_name = data["device_name"]

    asset = Asset(name=device_name, hems_box=hems_box, manufacturer=device_manufacturer)
    return HttpResponseRedirect('/home')

@csrf_exempt
def select_device(request):
    data = request.POST
    hems_device = data["hems_devices"]
    hems_field = data["hems_field"]
    hems_method = data["hems_method"]
    hems_value = data["hems_value"]
    hems_custom = data["hems_custom"]
    hems_pi = data["hems_pi"]
    received_result = ""

    if hems_device == "Custom_Command_Input":
        if hems_custom:
            hems_device = data["hems_custom"]
            received_result = tasks.getOutBackResult(hems_custom, hems_method, hems_value, hems_pi)
        else:
            received_result = "No valid hems custom device provided, please go back and check again."
    else:
        received_result = tasks.getOutBackResult(hems_field, hems_method, hems_value, hems_pi)
    #received_result = tasks.getHEMSResult(hems_device, hems_method)
    #received_result = tasks.getResult(hems_device, hems_method)
    return render(request, "displayResult.html", {"hemsResult" : received_result, "hemsValue": hems_value})

@csrf_exempt
def add_pi_database(request):
    pass
