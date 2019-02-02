from django.contrib import admin

from .models import *
#
# # Register your models here.

admin.site.register(HemsUser)
admin.site.register(HemsBox)

admin.site.register(SolarPV)

admin.site.register(SolarPVIn)

admin.site.register(Inverter)
admin.site.register(Grid)
admin.site.register(Load)
admin.site.register(Battery)
