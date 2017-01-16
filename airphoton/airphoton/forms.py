from django.contrib.auth.forms import AuthenticationForm 
from django import forms
from airphoton import models

# If you don't do this you cannot use Bootstrap CSS
class LoginForm(AuthenticationForm):
	username = forms.CharField(label="Username", max_length=30, 
							   widget=forms.TextInput(attrs={'class': 'form-control', 'name': 'username'}))
	password = forms.CharField(label="Password", max_length=30, 
							   widget=forms.PasswordInput(attrs={'class': 'form-control', 'name': 'password'}))


class DataSetForm(forms.ModelForm):
    class Meta:
        model = models.DataSet
        exclude = ['created_date', 'updated_date']


class ConfigurationForm(forms.ModelForm):
    class Meta:
        model = models.Configuration
        exclude = ['created_date', 'updated_date']
