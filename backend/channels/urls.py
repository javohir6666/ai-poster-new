from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AIModelViewSet,
    AnalyticsViewSet,
    ChannelViewSet,
    CronJobViewSet,
    PostLogViewSet,
)
from posts.views import PostViewSet

# API is included under `/api/channels/` in `config/urls.py`.
# We keep the ChannelViewSet on the empty prefix so channel routes are:
#   /api/channels/            (list/create)
#   /api/channels/<id>/       (retrieve/update/delete)
# And define nested resources explicitly to avoid router edge-cases/warnings.
router = DefaultRouter()
router.register(r"ai-models", AIModelViewSet, basename="ai-model")
# NOTE: Register specific prefixes before the empty prefix.
router.register(r"", ChannelViewSet, basename="channel")

# Explicit nested endpoints (avoid `rest_framework_nested` leading-slash warnings)
cron_job_list = CronJobViewSet.as_view({"get": "list", "post": "create"})
cron_job_detail = CronJobViewSet.as_view(
    {"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}
)
cron_job_run_now = CronJobViewSet.as_view({"post": "run_now"})

post_log_list = PostLogViewSet.as_view({"get": "list"})
post_log_detail = PostLogViewSet.as_view({"get": "retrieve"})

post_list = PostViewSet.as_view({"get": "list"})
post_detail = PostViewSet.as_view({"get": "retrieve"})

urlpatterns = [
    path("", include(router.urls)),
    path("<int:channel_pk>/cron_jobs/", cron_job_list, name="cron-job-list"),
    path("<int:channel_pk>/cron_jobs/<int:pk>/", cron_job_detail, name="cron-job-detail"),
    path("<int:channel_pk>/cron_jobs/<int:pk>/run_now/", cron_job_run_now, name="cron-job-run-now"),
    path("<int:channel_pk>/post_logs/", post_log_list, name="post-log-list"),
    path("<int:channel_pk>/post_logs/<int:pk>/", post_log_detail, name="post-log-detail"),
    path("<int:channel_pk>/posts/", post_list, name="post-list"),
    path("<int:channel_pk>/posts/<int:pk>/", post_detail, name="post-detail"),
    path(
        "analytics/overview/",
        AnalyticsViewSet.as_view({"get": "overview"}),
        name="analytics-overview",
    ),
    path(
        "analytics/channels/<int:pk>/",
        AnalyticsViewSet.as_view({"get": "channel_analytics"}),
        name="analytics-channel",
    ),
    path(
        "analytics/timeseries/",
        AnalyticsViewSet.as_view({"get": "timeseries"}),
        name="analytics-timeseries",
    ),
    path(
        "analytics/recent_errors/",
        AnalyticsViewSet.as_view({"get": "recent_errors"}),
        name="analytics-recent-errors",
    ),
    path(
        "analytics/channels/<int:pk>/timeseries/",
        AnalyticsViewSet.as_view({"get": "channel_timeseries"}),
        name="analytics-channel-timeseries",
    ),
    path(
        "analytics/channels/<int:pk>/categories/",
        AnalyticsViewSet.as_view({"get": "categories"}),
        name="analytics-channel-categories",
    ),
]
