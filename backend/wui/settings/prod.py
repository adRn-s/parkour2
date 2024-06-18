from .base import *

DEBUG = False

LOGGING["loggers"] = {
    "django.request": {
        "handlers": ["mail_admins"],
        "level": "ERROR",
        "propagate": True,
    },
    "django": {
        "handlers": ["console", "logfile"],
        "level": "WARNING",
        "propagate": False,
    },
    "django.db.backends": {
        "handlers": ["console"],
        "level": "DEBUG",
        "propagate": False,
    },
    "db": {
        "handlers": ["console", "dblogfile"],
        "level": "DEBUG",
    },
}

REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = [
    "rest_framework.renderers.JSONRenderer",
]

NOTEBOOK_ARGUMENTS += [
    "--ip",
    "0.0.0.0",
    "--allow-root",
]

if SECRET_KEY == "94e9206c6a0ac99409aa":
    raise RuntimeError("Can't run production with hard-coded SECRET_KEY")
