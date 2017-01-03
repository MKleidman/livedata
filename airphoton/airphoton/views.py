import csv
import os.path
from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.conf import settings

def ping(request):
    "Health check for determining if the server is available"
    response_content = '<html><body>OK</body></html>'
    return HttpResponse(response_content, content_type='text/html')

@login_required()
def home(request):
	return render(request, 'home.html')

@login_required()
def loaddata(request):
    f = open(os.path.join(settings.STATIC_ROOT, 'static/data/', request.POST['filename']))
    response =  "\n".join([",".join(line) for line in csv.reader(f)])
    return HttpResponse(response, content_type='text/csv')