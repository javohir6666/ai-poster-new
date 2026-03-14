from django.contrib import admin

from .models import Post, PostImage


class PostImageInline(admin.TabularInline):
    model = PostImage
    extra = 0
    readonly_fields = ("image", "prompt", "provider", "sha256", "created_at")


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "channel", "title", "category", "status", "telegram_message_id", "posted_at")
    list_filter = ("status", "category")
    search_fields = ("title", "text_plain", "channel__channelUsername")
    inlines = [PostImageInline]


@admin.register(PostImage)
class PostImageAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "provider", "sha256", "created_at")
    search_fields = ("prompt", "sha256")
