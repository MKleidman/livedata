from django.conf.urls import include, url
from airphoton import views

urlpatterns = [
	url(r'^ping/$', views.ping),
    url(r'^loaddata/$', views.loaddata),
    url(r'^upload_data/$', views.upload_data),
    url(r'^upload_config/$', views.upload_config),
    url(r'^list_files/$', views.list_files),
    url(r'^$', views.home, name="home"),
]
