from rest_framework import serializers
from django.contrib.auth import get_user_model
from itertools import chain

from HEMSapp.models import *

#################### HEMS USER SERIALIZER ########################
class HemsUserSerializer(serializers.ModelSerializer):
    hemsbox_set = serializers.PrimaryKeyRelatedField(many=False, required=False, queryset=HemsBox.objects.all())

    class Meta:
        model = HemsUser
        fields = ('id', 'email', 'is_active', 'is_admin', 'first_name',
                'last_name', 'hemsbox_set', 'password')

        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        user = get_user_model().objects.create_user(
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
        )

        return user


###################### HEMS BOX SERIALIZER ###################
class HemsBoxSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    solarPV_set = serializers.PrimaryKeyRelatedField(many=True, queryset=SolarPV.objects.all())
    inverter_set = serializers.PrimaryKeyRelatedField(many=True, queryset=Inverter.objects.all())
    grid_set = serializers.PrimaryKeyRelatedField(many=True, queryset=Grid.objects.all())
    load_set = serializers.PrimaryKeyRelatedField(many=True, queryset=Load.objects.all())
    battery_set = serializers.PrimaryKeyRelatedField(many=True, queryset=Battery.objects.all())

    class Meta:
        model = HemsBox
        fields = ('id', 'hemsID', 'owner', 'solarPV_set', 'inverter_set', 'grid_set', 'load_set', 'battery_set')


#################### Asset Serializers ####################
#TODO: GENERALIZE THESE
class SolarPVSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = SolarPV
        fields = ('id', 'name', 'owner', 'hems_box', 'status', 'manufacturer')

class InverterSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = SolarPV
        fields = ('id', 'name', 'owner', 'hems_box', 'status', 'manufacturer')

class GridSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = SolarPV
        fields = ('id', 'name', 'owner', 'hems_box', 'status', 'manufacturer')

class LoadSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = SolarPV
        fields = ('id', 'name', 'owner', 'hems_box', 'status', 'manufacturer')

class BatterySerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = SolarPV
        fields = ('id', 'name', 'owner', 'hems_box', 'status', 'manufacturer')


################# ASSET DIRECTION SERIALIZERS ################
#TODO: GENERALIZE THESE
class SolarPVInSerializer(serializers.ModelSerializer):
    #incidentRadiations = serializers.PrimaryKeyRelatedField(many=True, queryset=IncidentRadiation.objects.all())
    unique_id = serializers.ReadOnlyField()

    class Meta:
        model = SolarPVIn
        fields = ('unique_id', 'solarPV')

class SolarPVOutSerializer(serializers.ModelSerializer):
    unique_id = serializers.ReadOnlyField()

    class Meta:
        model = SolarPVOut
        fields = ('unique_id', 'solarPV')

class InverterInSerializer(serializers.ModelSerializer):
    unique_id = serializers.ReadOnlyField()

    class Meta:
        model = InverterIn
        fields = ('unique_id', 'inverter')

class InverterOutSerializer(serializers.ModelSerializer):
    unique_id = serializers.ReadOnlyField()

    class Meta:
        model = InverterOut
        fields = ('unique_id', 'inverter')

class GridInSerializer(serializers.ModelSerializer):
    unique_id = serializers.ReadOnlyField()

    class Meta:
        model = GridIn
        fields = ('unique_id', 'grid')

class GridOutSerializer(serializers.ModelSerializer):
    unique_id = serializers.ReadOnlyField()

    class meta:
        model = GridOut
        fields = ('unique_id', 'grid')

class LoadInSerializer(serializers.ModelSerializer):
    unique_id = serializers.ReadOnlyField()

    class Meta:
        model = LoadIn
        fields = ('unique_id', 'load')

class BatteryInSerializer(serializers.ModelSerializer):
    unique_id = serializers.ReadOnlyField()

    class Meta:
        model = BatteryIn
        fields = ('unique_id', 'battery')

class BatteryOutSerializer(serializers.ModelSerializer):
    unique_id = serializers.ReadOnlyField()

    class meta:
        model = BatteryOut
        fields = ('unique_id', 'Battery')
