from rest_framework import serializers

from .models import Post, PostImage


class PostImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = PostImage
        fields = (
            "id",
            "prompt",
            "provider",
            "sha256",
            "url",
            "created_at",
        )

    def get_url(self, obj: PostImage) -> str | None:
        try:
            if not obj.image:
                return None
            request = self.context.get("request")
            url = obj.image.url
            return request.build_absolute_uri(url) if request else url
        except Exception:
            return None


class PostSerializer(serializers.ModelSerializer):
    channelId = serializers.IntegerField(source="channel_id", read_only=True)
    cronJobId = serializers.IntegerField(source="cron_job_id", read_only=True)
    images = PostImageSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = (
            "id",
            "channelId",
            "cronJobId",
            "title",
            "category",
            "text_plain",
            "text_html",
            "media",
            "images",
            "telegram_message_id",
            "status",
            "error",
            "created_at",
            "posted_at",
        )
