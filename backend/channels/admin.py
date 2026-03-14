from django.contrib import admin
from .models import Channel, ChannelAnalytics, CronJob, AIModel, PostLog


@admin.register(AIModel)
class AIModelAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)


@admin.register(Channel)
class ChannelAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'channelUsername', 'user', 'status', 'isAdminVerified')
    list_filter = ('status', 'isAdminVerified')
    search_fields = ('name', 'channelUsername', 'user__email')


@admin.register(ChannelAnalytics)
class ChannelAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('id', 'channel', 'postsToday', 'totalPosts', 'aiTokensUsed', 'lastPostAt')


@admin.register(CronJob)
class CronJobAdmin(admin.ModelAdmin):
    list_display = ('id', 'channel', 'topic', 'schedule', 'status', 'nextRun')


@admin.register(PostLog)
class PostLogAdmin(admin.ModelAdmin):
    list_display = ("id", "channel", "cron_job", "status", "telegram_message_id", "posted_at", "created_at")
    list_filter = ("status",)
    search_fields = ("channel__name", "channel__channelUsername", "topic")
