from django.conf.urls import include, url
from airphoton import views

urlpatterns = [
	url(r'^ping/$', views.ping),
    url(r'^loaddata/$', views.loaddata),
    url(r'^$', views.home, name="home"),
]
