from __future__ import unicode_literals
import os.path
from jsonfield import JSONField
from django.db import models

# Create your models here.

class Team(models.Model):
    name = models.CharField(max_length=256, db_index=True)
    created_date = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_date = models.DateTimeField(auto_now=True, db_index=True)

def upload_to(instance, filename):
    return os.path.join('data', instance.team.name, filename)

class DataSet(models.Model):
    team = models.ForeignKey(Team)
    name = models.CharField(max_length=256, db_index=True, unique=True)
    datafile = models.FileField(upload_to=upload_to)
    created_date = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_date = models.DateTimeField(auto_now=True, db_index=True)


class Configuration(models.Model):
    team = models.ManyToManyField(Team, null=True, blank=True)
    name = models.CharField(max_length=256, db_index=True)
    configuration = JSONField()
    created_date = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_date = models.DateTimeField(auto_now=True, db_index=True)

