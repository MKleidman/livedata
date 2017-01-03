from django.contrib import admin
from airphoton import models

class TeamAdmin(admin.ModelAdmin):
    pass


class DataSetAdmin(admin.ModelAdmin):
    pass


class ConfigurationAdmin(admin.ModelAdmin):
    pass


admin.site.register(models.Team, TeamAdmin)
admin.site.register(models.DataSet, DataSetAdmin)
admin.site.register(models.Configuration, ConfigurationAdmin)

# Register your models here.
