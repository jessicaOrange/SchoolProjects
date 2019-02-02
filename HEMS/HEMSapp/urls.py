from django.conf.urls import url, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework.schemas import get_schema_view

from . import views, requests, apiViews

app_name = 'HEMSapp'
urlpatterns = [
url(r'^hems/', include([
    #views
    url(r'^$', views.index, name='index'),
    url(r'^home$', views.home, name='home'),
    url(r'^registerDevice$', views.registerDevice, name='registerDevice'),
    url(r'^addAsset$', views.addAsset, name='addAsset'),
    url(r'^selectDevice$', views.selectDevice, name='selectDevice'),
    url(r'^simpleUpload$', views.simpleUpload, name='simpleUpload'),
    url(r'^autoWriteOutbackSeries$', views.autoWriteOutbackSeries, name='autoWriteOutbackSeries'),

    #Request views
    url(r'^login$', requests.login, name='login'),
    url(r'^logout$', requests.logout, name='logout'),
    url(r'^api/inverter_data/(?P<inverter_id>\d+)/$', requests.get_inverter_data, name='get_inverter_data'),
    url(r'^registerDevice_api$', requests.registerDevice_api, name='registerDevice_api'),
    url(r'^wakeup$', requests.wakeup, name='wakeup'),
    url(r'^checkIn$', requests.check_in, name='wakcheckIneup'),
    url(r'^recordValue$', requests.record_value, name='recordValue'),

    #API views
    url(r'^users/$', apiViews.UserList.as_view()),
    url(r'^users/(?P<pk>[0-9]+)/$', apiViews.UserDetail.as_view()),
    url(r'^hemsboxes/$', apiViews.HemsBoxList.as_view()),
    url(r'^hemsboxes/(?P<pk>[0-9]+)/$', apiViews.HemsBoxDetail.as_view()),
    url(r'^solarpvs/$', apiViews.SolarPVList.as_view()),
    url(r'^solarpvs/(?P<pk>[0-9]+)/$', apiViews.SolarPVDetail.as_view()),
    url(r'^solarpvins/$', apiViews.SolarPVInList.as_view()),
    url(r'^solarpvins/(?P<pk>[a-zA-Z]+[0-9]+)/$', apiViews.SolarPVInDetail.as_view()),
    url(r'^solarpvouts/$', apiViews.SolarPVOutList.as_view()),
    url(r'^solarpvouts/(?P<pk>[a-zA-Z]+[0-9]+)/$', apiViews.SolarPVOutDetail.as_view()),
    url(r'^hems_data/$', apiViews.hemsDataCreate),
    url(r'^energy_totals/$', apiViews.energy_totals),
    url(r'^register_pi/$', apiViews.register_pi),
    url(r'^add_asset/$', apiViews.add_asset),
    url(r'^select_device/$', apiViews.select_device),
])),
]
