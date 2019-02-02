from django.core.context_processors import csrf
from django.contrib import auth, messages
from django.http import HttpResponse, Http404, HttpResponseRedirect, JsonResponse

from models import *
import tasks

def login(request):
    username = request.POST.get('username', '')
    password = request.POST.get('password', '')
    user = auth.authenticate(username = username, password = password)

    if user:
        auth.login(request, user)
        return HttpResponseRedirect('home')

    else:

        request.path ='/'
        messages.add_message(request, messages.INFO, 'Invalid Login')
        return HttpResponseRedirect(request.path)


def logout(request):
    auth.logout(request)
    return HttpResponseRedirect('login')

def registerDevice_api(request):
    print request.POST
    user = request.user
    hemsID = request.POST['hemsID']

    HemsBox.objects.create(owner=user, hemsID=hemsID)


def get_inverter_data(request, inverter_id):

    result = tasks.getAll.apply_async(args=[inverter_id], queue='outback', routing_key='outback')

    tries = 0
    while result.state != 'SUCCESS':
        print result.state
        tries += 1
        time.sleep(1)
        if tries > 4:
            break

    if tries > 4:
        result_json = '{}'
    else:
        result_json = result.get()

    print("result: {0}").format(result_json)
    return JsonResponse(result_json)

def wakeup(request):
    params = dict(request.GET.iterlists())
    box_status = BoxStatusInfo.objects.filter(box_id=params['box_id'][0])
    if not len(box_status) > 0:
        return HttpResponse("This box does not exist", content_type="text/plain")

    box_status = box_status[0]
    box_status.isOn = True
    box_status.save()

    local_ip = params['local_ip'][0]
    context = {}

    if box_status.rank == 'slave':
        # Update with most recent local ip
        box = HemsBox.objects.get(id=box_status.box_id)
        box.local_ip = params['local_ip'][0]
        box.save()

        context['rank'] = 'slave'
        context['master_local_ip'] = box_status.master.local_ip
        master_box = BoxStatusInfo.objects.get(box_id=box_status.master.id)
        context['master_isOn'] = master_box.isOn


    elif box_status.rank == 'master':
        box = HemsBox.objects.get(id=box_status.box_id)
        box.local_ip = params['local_ip'][0]
        box.save()

        context['rank'] = 'master'
        context['slaves'] = [slave.box_id for slave in box.slave_set.all()]
    return JsonResponse(context)

def check_in(request):
    params = dict(request.GET.iterlists())
    box_status = BoxStatusInfo.objects.filter(box_id=params['box_id'][0])
    if not len(box_status) > 0:
        return HttpResponse("This box does not exist", content_type="text/plain")

    box_status = box_status[0]
    box_status.lastCheckIn = datetime.now() # update the last checkin time
    box_status.isOn = True
    box_status.save()

    return HttpResponse(status='200', content=box_status.lastCheckIn)

def record_value(request):
    params = dict(request.GET.iterlists())
    item = RegisterValueInfo(register_name=params['register_name'][0], value=params['value'][0])
    time = datetime.strptime(params['date_time'][0], '%Y-%m-%dT%H:%M:%S.%f')
    pi_id = params['pi_id'][0]
    item.recordTime = time
    item.box_id = pi_id
    item.save()

    return HttpResponse("Record is created successfully.")
