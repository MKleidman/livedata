from __future__ import unicode_literals

from django.db import models

# Create your models here.

class Team(models.Model):
    name = models.CharField(max_length=256, db_index=True)


class DataSet(models.Model):
    team = models.ForeignKey(Team)
    name = models.CharField(max_length=256, db_index=True)


class Configuration(models.Model):
    team = models.ManyToManyField(Team, null=True, blank=True)
    name = models.CharField(max_length=256, db_index=True)
