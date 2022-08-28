from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path

from .api import router

urlpatterns = [
    re_path("admin/", admin.site.urls),
    #   url("accounts/", include("authtools.urls")),
    re_path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
    re_path("api/", include(router.urls)),
    re_path("api/usage/", include("usage.urls")),
    re_path("", include("common.urls")),
    re_path("", include("report.urls")),
]

if settings.DEBUG:

    urlpatterns += [
        path("__debug__/", include("debug_toolbar.urls")),
    ]
