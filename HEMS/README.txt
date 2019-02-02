CREATION

Creating a User from shell:
user = HemsUser.objects.create_user(email='lucy@aol.com', first_name='Lucy', last_name='Brown', password='ASUi3dea')

Creating a HemsBox from shell:
box = HemsBox(owner=user, hemsID='3849405')

Creating an Asset from shell:
spv = SolarPV(hemsBox=box)

Creating an InOut Object from shell:
spvin = SolarPVIn(solarPV=spv)

Creating a HemsData object:
IncidentRadiation(content_object=spvin, value=7)


NAVIGATING HIERARCHY - DOWN

Getting box from user
user.hemsbox_set  #NOTE: returns only 1 value (don't use 'first()')

Getting asset from box
spv = box.solarPV_set.first() #NOTE: Returns set (more than one)

Getting In/Out from Asset
spvin = spv.in_set #NOTE: Returns 1 value

Getting Data From Asset:
rad = spvin.incidentRadiations.first() #NOTE: Returns set
#NOTE: The rest of these will all be either an 'in' or 'out' object dot the
name of the piece of data in camel case plural format


NAVIGATING HIERARCHY - UP

Getting user from box:
box.owner

Getting box from asset:
spv.hemsBox

Getting Asset from In/Out:
spvin.solarPV

Getting In/Out from data instance:
rad.content_object


#POSTING HEMS DATA
post to /hems_data/
Parameters:
  content_object = "SolarPVIn1"  #The unique_id of the asset the data is for
  data_type = "IncidentRadiation" #The type of data being posted
  value = 345

#negative grid power net is a flat $0.03 per hour not matter what time of day
