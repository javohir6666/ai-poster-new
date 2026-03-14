from django.db import models
from django.conf import settings

class Channel(models.Model):
	STATUS_CHOICES = [
		('active', 'Active'),
		('inactive', 'Inactive'),
	]

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='channels')
	channelUsername = models.CharField(max_length=100, unique=True)
	name = models.CharField(max_length=255)
	# Legacy string-based model name (optional). Prefer `ai_model` FK.
	aiModel = models.CharField(max_length=50, blank=True, default="")
	ai_model = models.ForeignKey('AIModel', null=True, blank=True, on_delete=models.SET_NULL, related_name='channels')
	customPrompt = models.TextField(blank=True)
	status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
	isAdminVerified = models.BooleanField(default=False)
	telegram_chat_id = models.BigIntegerField(null=True, blank=True)
	telegram_type = models.CharField(max_length=32, blank=True, default="")
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"{self.name} ({self.channelUsername})"


class ChannelAnalytics(models.Model):
	channel = models.OneToOneField(Channel, on_delete=models.CASCADE, related_name='analytics')
	postsToday = models.IntegerField(default=0)
	totalPosts = models.IntegerField(default=0)
	subscribersGained = models.IntegerField(default=0)
	aiTokensUsed = models.IntegerField(default=0)
	lastPostAt = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"Analytics for {self.channel.name}"


class CronJob(models.Model):
	STATUS_CHOICES = [
		('active', 'Active'),
		('inactive', 'Inactive'),
	]

	channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='cron_jobs')
	schedule = models.CharField(max_length=100)  # Cron format: "0 * * * *"
	# Topic is optional: if blank, the scheduler will ask AI to generate a fresh topic per run.
	topic = models.CharField(max_length=255, blank=True, default="")
	with_images = models.BooleanField(default=False)
	status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
	nextRun = models.DateTimeField(null=True, blank=True)
	lastRunAt = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		label = self.topic or "AUTO"
		return f"CronJob: {label} ({self.channel.name})"


class PostLog(models.Model):
	STATUS_CHOICES = [
		("success", "Success"),
		("failed", "Failed"),
	]

	channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name="post_logs")
	cron_job = models.ForeignKey(CronJob, null=True, blank=True, on_delete=models.SET_NULL, related_name="post_logs")
	topic = models.CharField(max_length=255, blank=True, default="")
	content = models.TextField(blank=True, default="")
	media = models.TextField(blank=True, default="")  # JSON string (list of media dicts)
	status = models.CharField(max_length=10, choices=STATUS_CHOICES)
	error = models.TextField(blank=True, default="")
	telegram_message_id = models.IntegerField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	posted_at = models.DateTimeField(null=True, blank=True)

	def __str__(self):
		return f"PostLog: {self.channel.name} [{self.status}]"


class AIModel(models.Model):
	name = models.CharField(max_length=100)
	PROVIDER_CHOICES = [
		("gemini", "Gemini"),
		("openai", "OpenAI"),
		("custom", "Custom"),
	]
	provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default="custom")
	# Provider-specific model id, e.g. `gemini-1.5-flash`, `gpt-4o-mini`.
	model = models.CharField(max_length=100, blank=True, default="")
	# For `custom` provider, `base_url`/`api_key` can be used.
	api_key = models.TextField(blank=True)
	base_url = models.CharField(max_length=255, blank=True)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.name


class CronJobRun(models.Model):
    STATUS_CHOICES = [
        ("success", "Success"),
        ("failed", "Failed"),
    ]

    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name="cron_runs")
    cron_job = models.ForeignKey(CronJob, null=True, blank=True, on_delete=models.SET_NULL, related_name="runs")
    post = models.ForeignKey('posts.Post', null=True, blank=True, on_delete=models.SET_NULL, related_name="runs")

    ai_provider = models.CharField(max_length=20, blank=True, default="")
    ai_model = models.CharField(max_length=120, blank=True, default="")

    prompt_tokens = models.IntegerField(default=0)
    output_tokens = models.IntegerField(default=0)
    total_tokens = models.IntegerField(default=0)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    error = models.TextField(blank=True, default="")

    started_at = models.DateTimeField()
    finished_at = models.DateTimeField(null=True, blank=True)
    duration_ms = models.IntegerField(default=0)

    telegram_message_id = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["channel", "-started_at"]),
            models.Index(fields=["cron_job", "-started_at"]),
            models.Index(fields=["status", "-started_at"]),
        ]

    def __str__(self):
        return f"CronJobRun: {self.channel_id} {self.status}"


class ChannelDailyMetric(models.Model):
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name="daily_metrics")
    date = models.DateField()

    runs_total = models.IntegerField(default=0)
    runs_success = models.IntegerField(default=0)
    runs_failed = models.IntegerField(default=0)

    posts_published = models.IntegerField(default=0)

    tokens_total = models.IntegerField(default=0)
    duration_total_ms = models.BigIntegerField(default=0)

    class Meta:
        unique_together = ("channel", "date")
        indexes = [
            models.Index(fields=["channel", "date"]),
            models.Index(fields=["date"]),
        ]

    def __str__(self):
        return f"Metric: {self.channel_id} {self.date}"
