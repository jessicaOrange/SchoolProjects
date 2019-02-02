from celery import Celery
from kombu import Queue

app = Celery('interface_worker', backend='amqp', broker='amqp://Kevin:ASUi3dea@127.0.0.1/pi_env')

@app.task(name='add')
def add(x, y):
    return x + y
