from setuptools import setup, find_packages
setup(name='airphoton',
      version='0.1',
      description='Application for Airphoton Data',
      author='Matis Kleidman',
      author_email='matis.kleidman@gmail.com',
      packages=find_packages('src/'),
      include_package_data=True
      )
