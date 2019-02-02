from __future__ import unicode_literals
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, ContentType
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.db.models.signals import *
from rest_framework import serializers

import time
from datetime import datetime

def get_previous_pk(objectType):
    if objectType.objects.last():
        oldpk = str(objectType.objects.last().pk)
        old_number = oldpk.replace(objectType.__name__, "")
        new_number = int(old_number) + 1
        return str(new_number)
    else:
        return "1"

def increment_in_out_id(objectType):
    return objectType.__name__ + get_previous_pk(objectType)

def get_assets(box_instances):
    boxes = {}
    for box in list(box_instances):
        boxes[box.hemsID] = {
            "assets":{
                "solarPVs": box.solarPV_set.all(),
                "inverters": box.inverter_set.all(),
                "grid": box.grid_set.all(),
                "load": box.load_set.all(),
                "battery": box.battery_set.all()
            },
            "status": box.status_set.isOn
        }
    print "Boxes: {0}".format(boxes)
    return boxes

######################## User Info ##########################
class HemsUserManager(BaseUserManager):
    def create_user(self, email, first_name, last_name, password):

        user = self.model(
            email=self.normalize_email(email),
            first_name=first_name,
            last_name=last_name,
        )

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, first_name, last_name, password):

        user = self.create_user(
            email,
            first_name=first_name,
            last_name=last_name,
            password=password,
        )
        user.is_admin = True
        user.save(using=self._db)
        return user



class HemsUser(AbstractBaseUser):
    email = models.EmailField(
        verbose_name='email address',
        max_length=255,
        unique=True,
    )
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)

    objects = HemsUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = [ 'first_name', 'last_name']

    def get_full_name(self):
        return self.first_name + " " + self.last_name

    def get_short_name(self):
        # The user is identified by their email address
        return self.first_name

    def __str__(self):              # __unicode__ on Python 2
        return self.email

    def has_perm(self, perm, obj=None):
        "Does the user have a specific permission?"
        # Simplest possible answer: Yes, always
        return True

    def has_module_perms(self, app_label):
        "Does the user have permissions to view the app `app_label`?"
        # Simplest possible answer: Yes, always
        return True

    @property
    def is_staff(self):
        "Is the user a member of staff?"
        # Simplest possible answer: All admins are staff
        return self.is_admin

class Address(models.Model):
    street = models.CharField(max_length=100)
    city = models.CharField(max_length=30)
    state = models.CharField(max_length=2)
    zipCode = models.IntegerField()

    def format(self):
        return self.street1 + "\n" + self.street2 + "\n" + self.city + ", " + self.state + " " + str(self.zip)

    class Meta:
        verbose_name = "Address"


###################### HEMS BOX ##########################
#our HEMS box
class HemsBox(models.Model):
    #hemsID is our version of a serial number for the box
    hemsID = models.CharField(max_length=40, default="NoIdEstablished")
    local_ip = models.CharField(max_length=20, default="0.0.0.0")
    owner = models.ForeignKey(HemsUser, on_delete=models.CASCADE, related_name='hemsbox_set')

    def __str__(self):              # __unicode__ on Python 2
        return str(self.hemsID)

    class Meta:
        verbose_name = "Hemx Box"

###################### Devices ##########################
#Devices attached to HEMS box are called "assets"
class Asset(models.Model):
    #editable
    name = models.CharField(max_length=100, default="Untitled Node")
    status = models.BooleanField(default=True)
    hems_box = models.ForeignKey(HemsBox, on_delete=models.CASCADE)
    manufacturer = models.CharField(max_length=40, default="N/A")


    #Non-editable
    created_date = models.DateField(auto_now_add=True)

    def __str__(self):              # __unicode__ on Python 2
        return str(self.id)

    class Meta:
        abstract = True

#Asset Subclasses
class SolarPV(Asset):
    #Information Unique to a SolarPV
    owner = models.ForeignKey(HemsUser, on_delete=models.CASCADE, related_name='solarPV_set')

    class Meta:
        default_related_name = 'solarPV_set'

class Inverter(Asset):
    #Information Unique to a Inverter
    owner = models.ForeignKey(HemsUser, on_delete=models.CASCADE, related_name='inverter_set')

    class Meta:
        default_related_name = 'inverter_set'

class Grid(Asset):
    #Information Unique to a Grid
    owner = models.ForeignKey(HemsUser, on_delete=models.CASCADE, related_name='grid_set')

    class Meta:
        default_related_name = 'grid_set'

class Load(Asset):
    #Information Unique to a Load
    owner = models.ForeignKey(HemsUser, on_delete=models.CASCADE, related_name='load_set')

    class Meta:
        default_related_name = 'load_set'

class Battery(Asset):
    #Information Unique to a Battery
    owner = models.ForeignKey(HemsUser, on_delete=models.CASCADE, related_name='battery_set')

    class Meta:
        default_related_name = 'battery_set'


########################### Data Objects ####################
class HemsData(models.Model):
    value = models.FloatField(default=-1)
    timestamp = models.DateTimeField(auto_now_add=True)
    id = models.AutoField(primary_key=True)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=20)
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        unique_together   = ('content_type', 'object_id')
        abstract = True

class IncidentRadiation(HemsData):
    unit = "W/m^2"
    unit_verbose = "Watts per Meter Squared"

    class Meta:
        default_related_name = 'incidentRadiation_set'


class DCPower(HemsData):
    unit = "kW"
    unit_verbose = "Kilowatt"

    class Meta:
        default_related_name = 'dc_power_set'

class Energy(HemsData):
    unit = "kWh"
    unit_verbose = "Kilowatt Hours"

    class Meta:
        default_related_name = 'energy_set'

class Voltage(HemsData):
    unit = "V"
    unit_verbose = "Volts"

    class Meta:
        default_related_name = 'voltage_set'

class Current(HemsData):
    unit = "A"
    unit_verbose = "Amps"

    class Meta:
        default_related_name = 'current_set'

class ACPower(HemsData):
    unit = "kW"
    unit_verbose = "Kilowatt Hours"

    class Meta:
        default_related_name = 'ac_power_set'

class ReactivePower(HemsData):
    unit = "Vars"
    unit_verbose = ""

    class Meta:
        default_related_name = "related_power_set"

class DCACEfficiency(HemsData):
    unit = "%%"
    unit_verbose = "Percent"

    class Meta:
        default_related_name = "dc_ac_efficiency_set"

class ChargingVoltage(HemsData):
    unit = "V"
    unit_verbose = "Voltage"

    class Meta:
        default_related_name = "charging_voltage_set"

class ChargingCurrent(HemsData):
    unit = "A"
    unit_verbose = "Amps"

    class Meta:
        default_related_name = "charging_current_set"

class ChargingRate(HemsData):
    unit = ""
    unit_verbose = ""

    class Meta:
        default_related_name = "charging_rate_set"

class ConverterEfficiency(HemsData):
    unit = "%%"
    unit_verbose = "Percent"

    class Meta:
        default_related_name = "converter_efficiency_set"

class DischargingVoltage(HemsData):
    unit = "V"
    unit_verbose = "Voltage"

    class Meta:
        default_related_name = "discharging_voltage_set"

class DischargingCurrent(HemsData):
    unit = "A"
    unit_verbose = "Amps"

    class Meta:
        default_related_name = "discharging_current_set"

class DischargingRate(HemsData):
    unit = ""
    unit_verbose = ""

    class Meta:
        default_related_name = "discharging_rate_set"

class StateOfCharge(HemsData):
    unit = "%%"
    unit_verbose = "Percent"

    class Meta:
        default_related_name = "state_of_charge_set"

class GridPowerNet(HemsData):
    unit = "kW"
    unit_verbose = "Kilowatt"

    class Meta:
        default_related_name = "grid_power_net_set"




######################## IN and OUT #######################
class SolarPVIn(models.Model):
    unique_id = models.CharField(max_length=20, primary_key=True)
    solarPV = models.OneToOneField(SolarPV, on_delete=models.CASCADE, related_name='in_set', null=True)
    incidentRadiations = GenericRelation(IncidentRadiation)

    def save(self, *args, **kwargs):

        if not self.pk:  # object is being created, thus no primary key field yet
            self.unique_id = increment_in_out_id(type(self))
        super(SolarPVIn, self).save(*args, **kwargs)

class SolarPVOut(models.Model):
    unique_id = models.CharField(max_length=20, primary_key=True)
    solarPV = models.OneToOneField(SolarPV, on_delete=models.CASCADE, related_name='out_set', null=True)
    dc_powers = GenericRelation(DCPower)
    energies = GenericRelation(Energy)
    voltages = GenericRelation(Voltage)
    currents = GenericRelation(Current)

    def save(self, *args, **kwargs):
        if not self.pk:  # object is being created, thus no primary key field yet
            self.unique_id = increment_in_out_id(type(self))
        super(SolarPVOut, self).save(*args, **kwargs)

class InverterIn(models.Model):
    unique_id = models.CharField(max_length=20, primary_key=True)
    inverter = models.OneToOneField(Inverter, on_delete=models.CASCADE, related_name='in_set')
    dc_powers = GenericRelation(DCPower)
    energies = GenericRelation(Energy)
    voltages = GenericRelation(Voltage)
    currents = GenericRelation(Current)

    def save(self, *args, **kwargs):
        if not self.pk:  # object is being created, thus no primary key field yet
            self.unique_id = increment_in_out_id(type(self))
        super(InverterIn, self).save(*args, **kwargs)

class InverterOut(models.Model):
    unique_id = models.CharField(max_length=20, primary_key=True)
    inverter = models.OneToOneField(Inverter, on_delete=models.CASCADE, related_name='out_set')
    ac_powers = GenericRelation(ACPower)
    energies = GenericRelation(Energy)
    voltages = GenericRelation(Voltage)
    currents = GenericRelation(Current)

    def save(self, *args, **kwargs):
        if not self.pk:  # object is being created, thus no primary key field yet
            self.unique_id = increment_in_out_id(type(self))
        super(InverterOut, self).save(*args, **kwargs)

class GridIn(models.Model):
    unique_id = models.CharField(max_length=20, primary_key=True)
    grid = models.OneToOneField(Grid, on_delete=models.CASCADE, related_name='in_set')
    ac_powers = GenericRelation(ACPower)
    energies = GenericRelation(Energy)
    voltages = GenericRelation(Voltage)
    currents = GenericRelation(Current)

    def save(self, *args, **kwargs):
        if not self.pk:  # object is being created, thus no primary key field yet
            self.unique_id = increment_in_out_id(type(self))
        super(GridIn, self).save(*args, **kwargs)

class GridOut(models.Model):
    unique_id = models.CharField(max_length=20, primary_key=True)
    grid = models.OneToOneField(Grid, on_delete=models.CASCADE, related_name='out_set')
    ac_powers = GenericRelation(ACPower)
    energies = GenericRelation(Energy)
    voltages = GenericRelation(Voltage)
    currents = GenericRelation(Current)
    power_net = GenericRelation(GridPowerNet)

    def save(self, *args, **kwargs):
        if not self.pk:  # object is being created, thus no primary key field yet
            self.unique_id = increment_in_out_id(type(self))
        super(GridOut, self).save(*args, **kwargs)

class LoadIn(models.Model):
    unique_id = models.CharField(max_length=20, primary_key=True)
    load = models.OneToOneField(Load, on_delete=models.CASCADE, related_name='in_set')
    ac_powers = GenericRelation(ACPower)
    energies = GenericRelation(Energy)
    voltages = GenericRelation(Voltage)
    currents = GenericRelation(Current)

    def save(self, *args, **kwargs):
        if not self.pk:  # object is being created, thus no primary key field yet
            self.unique_id = increment_in_out_id(type(self))
        super(LoadIn, self).save(*args, **kwargs)

class BatteryIn(models.Model):
    unique_id = models.CharField(max_length=20, primary_key=True)
    battery = models.OneToOneField(Battery, on_delete=models.CASCADE, related_name='in_set')
    #TODO: CHANGE AC TO DC
    ac_powers = GenericRelation(ACPower)
    energies = GenericRelation(Energy)
    charging_voltage = GenericRelation(ChargingVoltage)
    charging_current = GenericRelation(ChargingCurrent)
    charging_rate = GenericRelation(ChargingRate)
    converter_efficiency = GenericRelation(ConverterEfficiency)

    def save(self, *args, **kwargs):
        if not self.pk:  # object is being created, thus no primary key field yet
            self.unique_id = increment_in_out_id(type(self))
        super(BatteryIn, self).save(*args, **kwargs)

class BatteryOut(models.Model):
    unique_id = models.CharField(max_length=20, primary_key=True)
    battery = models.OneToOneField(Battery, on_delete=models.CASCADE, related_name='out_set')
    dc_powers = GenericRelation(DCPower)
    energies = GenericRelation(Energy)
    discharging_voltage = GenericRelation(DischargingVoltage)
    discharging_current = GenericRelation(DischargingCurrent)
    discharging_rate = GenericRelation(DischargingRate)
    converter_efficiency = GenericRelation(ConverterEfficiency)
    state_of_charge = GenericRelation(StateOfCharge)
    #TODO: ADD BATTERY CAPACITY AS AMPHOURS OR KILOWATHOURS

    def save(self, *args, **kwargs):
        if not self.pk:  # object is being created, thus no primary key field yet
            self.unique_id = increment_in_out_id(type(self))
        super(BatteryOut, self).save(*args, **kwargs)

# this is used for the inital wake up call
class BoxStatusInfo(models.Model):
    rank = models.CharField(max_length=20) #either "master" or "slave"
    isOn = models.BooleanField(default=False)
    box = models.OneToOneField(HemsBox, on_delete=models.CASCADE, related_name='status_set')
    master = models.ForeignKey(HemsBox, on_delete=models.CASCADE, related_name='slave_set', blank=True, null=True)
    lastCheckIn = models.DateTimeField()

# this is used for the 5-minute interval record
class RegisterValueInfo(models.Model):
    register_name = models.CharField(max_length=255)
    value = models.CharField(max_length=10)
    recordTime = models.DateTimeField()
    box_id = models.CharField(max_length=40, default="NoIdEstablished")
