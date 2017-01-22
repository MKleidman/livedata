import csv
import os.path
import json
from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.conf import settings
from django.views.decorators.http import require_http_methods
from airphoton import forms, models


def ping(request):
    "Health check for determining if the server is available"
    response_content = '<html><body>OK</body></html>'
    return HttpResponse(response_content, content_type='text/html')

@require_http_methods(['GET'])
@login_required()
def home(request):
	return render(request, 'home.html')

@require_http_methods(['GET'])
@login_required()
def loaddata(request):
    filename = request.GET.get('name')
    if not filename:
        return HttpResponse(status=400, content="Must specify a name")
    team_id = request.GET.get('team')
    if not team_id:
        return HttpResponse(status=400, content="Must specify a team")
    f = models.DataSet.objects.get(name=filename, team=team_id).datafile
    response =  "\n".join([",".join(line) for line in csv.reader(f)])
    return HttpResponse(response, content_type='text/csv')

@require_http_methods(['GET'])
@login_required()
def list_files(request):
    team_id = request.GET.get('team')
    if not team_id:
        return HttpResponse(status=400, content="Must specify a team")
    datasets = models.DataSet.objects.filter(team=team_id).values_list('name', flat=True)
    return HttpResponse(status=200, content=json.dumps(list(datasets)), content_type="application/json")

@require_http_methods(['GET'])
@login_required()
def configuration(request):
    team_id = request.GET.get('team')
    if not team_id:
        return HttpResponse(status=400, content="Must specify a team")
    configs = models.Configuration.objects.filter(team__id=team_id).values('id', 'name', 'configuration')
    return HttpResponse(status=200, content=json.dumps(list(configs)), content_type="application/json")

@require_http_methods(['POST'])
@login_required()
def upload_data(request):
    form = forms.DataSetForm(request.POST, request.FILES)
    if form.is_valid():
        new_dataset = form.save()
        return HttpResponse(status=201)
    else:
        return HttpResponse(status=400, content=str(form.errors))


@require_http_methods(['POST'])
@login_required()
def upload_config(request):
    data = {}
    config = {}
    for k, v in request.POST.iteritems():
        if k == 'name':
            data[k] = v
        elif k == 'team':
            pass
        else:
            config[k] = v
    data['configuration'] = config
    form = forms.ConfigurationForm(data)
    if form.is_valid():
        new_config = form.save()
        new_config.team.add(request.POST['team'])
        return HttpResponse(status=201)
    else:
        return HttpResponse(status=400, content=str(form.errors))