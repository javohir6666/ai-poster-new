from rest_framework import serializers
from .models import Channel, ChannelAnalytics, ChannelDailyMetric, CronJob, CronJobRun, AIModel, PostLog

class ChannelSerializer(serializers.ModelSerializer):
    userId = serializers.IntegerField(source='user.id', read_only=True)
    telegramChatId = serializers.IntegerField(source="telegram_chat_id", read_only=True)
    telegramType = serializers.CharField(source="telegram_type", read_only=True)
    # Accepts/returns the AIModel primary key while keeping the model field as FK.
    ai_model = serializers.PrimaryKeyRelatedField(
        queryset=AIModel.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Channel
        fields = (
            'id',
            'userId',
            'channelUsername',
            'name',
            'aiModel',
            'ai_model',
            'customPrompt',
            'status',
            'isAdminVerified',
            'telegramChatId',
            'telegramType',
        )

    def validate_channelUsername(self, value: str) -> str:
        value = (value or "").strip()
        # Allow numeric IDs (including -100... supergroup/channel IDs).
        if value and not value.startswith("@") and not value.lstrip("-").isdigit():
            value = "@" + value
        return value

class ChannelDetailSerializer(serializers.ModelSerializer):
    userId = serializers.SerializerMethodField()
    ai_model = serializers.SerializerMethodField()
    telegramChatId = serializers.IntegerField(source="telegram_chat_id", read_only=True)
    telegramType = serializers.CharField(source="telegram_type", read_only=True)

    class Meta:
        model = Channel
        fields = (
            'id',
            'userId',
            'channelUsername',
            'name',
            'aiModel',
            'ai_model',
            'customPrompt',
            'status',
            'isAdminVerified',
            'telegramChatId',
            'telegramType',
        )

    def get_userId(self, obj):
        return obj.user.id

    def get_ai_model(self, obj):
        return obj.ai_model.id if obj.ai_model else None

class ChannelAnalyticsSerializer(serializers.ModelSerializer):
    channelId = serializers.SerializerMethodField()

    class Meta:
        model = ChannelAnalytics
        fields = ('channelId', 'postsToday', 'totalPosts', 'subscribersGained', 'aiTokensUsed', 'lastPostAt')

    def get_channelId(self, obj):
        return obj.channel.id

class CronJobSerializer(serializers.ModelSerializer):
    channelId = serializers.SerializerMethodField()

    class Meta:
        model = CronJob
        fields = ('id', 'channelId', 'schedule', 'topic', 'with_images', 'status', 'nextRun', 'lastRunAt')

    def get_channelId(self, obj):
        return obj.channel.id


class AIModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIModel
        # Don't expose api_key via API; configure global provider keys via backend/.env.
        fields = ('id', 'name', 'provider', 'model', 'base_url', 'is_active')


class PostLogSerializer(serializers.ModelSerializer):
    channelId = serializers.SerializerMethodField()
    cronJobId = serializers.SerializerMethodField()

    class Meta:
        model = PostLog
        fields = (
            "id",
            "channelId",
            "cronJobId",
            "topic",
            "content",
            "media",
            "status",
            "error",
            "telegram_message_id",
            "created_at",
            "posted_at",
        )

    def get_channelId(self, obj):
        return obj.channel_id

    def get_cronJobId(self, obj):
        return obj.cron_job_id


class ChannelDailyMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChannelDailyMetric
        fields = (
            "date",
            "runs_total",
            "runs_success",
            "runs_failed",
            "posts_published",
            "tokens_total",
            "duration_total_ms",
        )


class CronJobRunSerializer(serializers.ModelSerializer):
    channelId = serializers.IntegerField(source="channel_id", read_only=True)
    cronJobId = serializers.IntegerField(source="cron_job_id", read_only=True)
    postId = serializers.IntegerField(source="post_id", read_only=True)

    class Meta:
        model = CronJobRun
        fields = (
            "id",
            "channelId",
            "cronJobId",
            "postId",
            "ai_provider",
            "ai_model",
            "prompt_tokens",
            "output_tokens",
            "total_tokens",
            "status",
            "error",
            "started_at",
            "finished_at",
            "duration_ms",
            "telegram_message_id",
        )
