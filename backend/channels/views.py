from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from .models import Channel, ChannelAnalytics, ChannelDailyMetric, CronJob, CronJobRun, AIModel, PostLog
from .serializers import (
    ChannelSerializer,
    ChannelDetailSerializer,
    ChannelAnalyticsSerializer,
    CronJobSerializer,
    AIModelSerializer,
    PostLogSerializer,
    ChannelDailyMetricSerializer,
    CronJobRunSerializer,
)
import requests
from django.conf import settings
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from .cron import compute_next_run
from .services.ai import generate_text
from .services.runner import run_cron_job
from posts.models import Post

class ChannelViewSet(viewsets.ModelViewSet):
    serializer_class = ChannelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Channel.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """Send a prompt using the channel's selected AI model."""
        try:
            channel = Channel.objects.get(id=pk, user=request.user)
        except Channel.DoesNotExist:
            return Response({'detail': 'Channel not found'}, status=status.HTTP_404_NOT_FOUND)

        prompt = request.data.get('prompt')
        if not prompt:
            return Response({'detail': 'prompt required'}, status=status.HTTP_400_BAD_REQUEST)

        ai_model = channel.ai_model
        if not ai_model:
            # fallback: try find by aiModel name
            try:
                ai_model = AIModel.objects.get(name=channel.aiModel)
            except AIModel.DoesNotExist:
                return Response({'detail': 'AI model not configured for this channel'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            text = generate_text(ai_model, prompt)
            return Response({'text': text}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def verify_admin(self, request):
        """Kanalga botni admin qilganini tekshirish"""
        channel_username = (request.data.get('channelUsername') or "").strip()
        
        if not channel_username:
            return Response({'detail': 'channelUsername required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Normalize: allow numeric IDs or @username
            if channel_username and not channel_username.startswith("@") and not channel_username.lstrip("-").isdigit():
                channel_username = "@" + channel_username

            # Telegram API orqali botni admin qilganini tekshirish
            bot_token = settings.TELEGRAM_BOT_TOKEN
            if not bot_token:
                return Response({'verified': False, 'message': 'Bot token not configured'}, status=status.HTTP_400_BAD_REQUEST)

            # Telegram API endpoint
            url = f"https://api.telegram.org/bot{bot_token}/getChatMember"
            params = {
                'chat_id': channel_username,
                'user_id': bot_token.split(':')[0]  # Bot ID
            }

            response = requests.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('ok'):
                    member = data.get('result', {})
                    status_value = member.get('status')
                    
                    if status_value in ['administrator', 'creator']:
                        # Try to fetch channel title for a nicer UI name.
                        channel_name = channel_username
                        chat_id = None
                        chat_type = ""
                        resolved_username = channel_username
                        try:
                            chat_resp = requests.get(
                                f"https://api.telegram.org/bot{bot_token}/getChat",
                                params={"chat_id": channel_username},
                                timeout=10,
                            )
                            if chat_resp.status_code == 200:
                                chat_data = chat_resp.json()
                                if chat_data.get("ok") and isinstance(chat_data.get("result"), dict):
                                    chat = chat_data["result"]
                                    channel_name = chat.get("title") or channel_name
                                    chat_id = chat.get("id")
                                    chat_type = chat.get("type") or ""
                                    if chat.get("username"):
                                        resolved_username = "@" + str(chat.get("username"))
                        except Exception:
                            pass

                        # Persist/update channel immediately (so frontend can just update config fields).
                        existing = Channel.objects.filter(channelUsername=resolved_username).first()
                        if existing and existing.user_id != request.user.id:
                            return Response(
                                {"verified": False, "message": "Channel is already linked to another user"},
                                status=status.HTTP_403_FORBIDDEN,
                            )

                        if existing:
                            existing.name = channel_name
                            existing.isAdminVerified = True
                            existing.status = "active"
                            existing.telegram_chat_id = chat_id
                            existing.telegram_type = chat_type
                            existing.save(
                                update_fields=["name", "isAdminVerified", "status", "telegram_chat_id", "telegram_type", "updated_at"]
                            )
                            channel_obj = existing
                        else:
                            channel_obj = Channel.objects.create(
                                user=request.user,
                                channelUsername=resolved_username,
                                name=channel_name or resolved_username,
                                aiModel="",
                                customPrompt="",
                                status="active",
                                isAdminVerified=True,
                                telegram_chat_id=chat_id,
                                telegram_type=chat_type,
                            )

                        return Response({
                            'verified': True,
                            'channelName': channel_name,
                            'channel': {
                                'id': channel_obj.id,
                                'channelUsername': channel_obj.channelUsername,
                                'name': channel_obj.name,
                                'telegramChatId': channel_obj.telegram_chat_id,
                                'telegramType': channel_obj.telegram_type,
                            },
                            'message': 'Bot is admin'
                        }, status=status.HTTP_200_OK)
            
            return Response({
                'verified': False,
                'message': 'Bot is not admin in this channel'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'verified': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Umumiy statistika - Overview"""
        user_channels = Channel.objects.filter(user=request.user)
        active_channels = user_channels.filter(status='active').count()
        
        total_posts = ChannelAnalytics.objects.filter(
            channel__user=request.user
        ).aggregate(Sum('totalPosts'))['totalPosts__sum'] or 0
        
        ai_interactions = ChannelAnalytics.objects.filter(
            channel__user=request.user
        ).aggregate(Sum('aiTokensUsed'))['aiTokensUsed__sum'] or 0
        
        return Response({
            'totalChannels': user_channels.count(),
            'activeBots': active_channels,
            'totalPosts': total_posts,
            'aiInteractions': ai_interactions
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def channel_analytics(self, request, pk=None):
        """Kanal bo'yicha statistika"""
        try:
            channel = Channel.objects.get(id=pk, user=request.user)
            analytics = ChannelAnalytics.objects.get(channel=channel)
            serializer = ChannelAnalyticsSerializer(analytics)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Channel.DoesNotExist:
            return Response({'detail': 'Channel not found'}, status=status.HTTP_404_NOT_FOUND)
        except ChannelAnalytics.DoesNotExist:
            return Response({'detail': 'Analytics not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def timeseries(self, request):
        """Aggregated daily metrics across all channels for the current user."""
        days = int(request.query_params.get('days') or 30)
        days = max(1, min(days, 365))
        since = timezone.now().date() - timedelta(days=days - 1)

        rows = (
            ChannelDailyMetric.objects.filter(channel__user=request.user, date__gte=since)
            .values('date')
            .annotate(
                runs_total=Sum('runs_total'),
                runs_success=Sum('runs_success'),
                runs_failed=Sum('runs_failed'),
                posts_published=Sum('posts_published'),
                tokens_total=Sum('tokens_total'),
                duration_total_ms=Sum('duration_total_ms'),
            )
            .order_by('date')
        )

        # Normalize missing days to zeros (stable charting)
        by_date = {r['date']: r for r in rows}
        out = []
        cur = since
        for _ in range(days):
            r = by_date.get(cur) or {
                'date': cur,
                'runs_total': 0,
                'runs_success': 0,
                'runs_failed': 0,
                'posts_published': 0,
                'tokens_total': 0,
                'duration_total_ms': 0,
            }
            out.append(r)
            cur = cur + timedelta(days=1)

        return Response(out, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def channel_timeseries(self, request, pk=None):
        """Daily metrics for one channel."""
        days = int(request.query_params.get('days') or 30)
        days = max(1, min(days, 365))
        since = timezone.now().date() - timedelta(days=days - 1)

        channel = Channel.objects.filter(id=pk, user=request.user).first()
        if not channel:
            return Response({'detail': 'Channel not found'}, status=status.HTTP_404_NOT_FOUND)

        qs = ChannelDailyMetric.objects.filter(channel=channel, date__gte=since).order_by('date')
        rows = ChannelDailyMetricSerializer(qs, many=True).data

        # Normalize missing days
        by_date = {r['date']: r for r in rows}
        out = []
        cur = since
        for _ in range(days):
            key = cur.isoformat()
            out.append(by_date.get(key) or {
                'date': key,
                'runs_total': 0,
                'runs_success': 0,
                'runs_failed': 0,
                'posts_published': 0,
                'tokens_total': 0,
                'duration_total_ms': 0,
            })
            cur = cur + timedelta(days=1)

        return Response(out, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def recent_errors(self, request):
        """Recent failed runs across all channels (for debugging/ops)."""
        qs = (
            CronJobRun.objects.filter(channel__user=request.user, status='failed')
            .select_related('channel', 'cron_job')
            .order_by('-started_at')
        )[:50]
        return Response(CronJobRunSerializer(qs, many=True).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def categories(self, request, pk=None):
        """Top categories for one channel."""
        channel = Channel.objects.filter(id=pk, user=request.user).first()
        if not channel:
            return Response({'detail': 'Channel not found'}, status=status.HTTP_404_NOT_FOUND)

        rows = (
            Post.objects.filter(channel=channel, status='published')
            .exclude(category='')
            .values('category')
            .annotate(count=Count('id'))
            .order_by('-count')
        )[:20]
        return Response(list(rows), status=status.HTTP_200_OK)


class CronJobViewSet(viewsets.ModelViewSet):
    serializer_class = CronJobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # rest_framework_nested uses `<lookup>_pk` (lookup='channel' => channel_pk)
        channel_id = self.kwargs.get('channel_pk') or self.kwargs.get('channel_id')
        if channel_id:
            return CronJob.objects.filter(channel_id=channel_id, channel__user=self.request.user)
        return CronJob.objects.filter(channel__user=self.request.user)

    def perform_create(self, serializer):
        channel_id = self.kwargs.get('channel_pk') or self.kwargs.get('channel_id')
        try:
            channel = Channel.objects.get(id=channel_id, user=self.request.user)
            job = serializer.save(channel=channel)
            if job.status == "active":
                try:
                    job.nextRun = compute_next_run(job.schedule, timezone.now())
                except Exception as e:
                    raise ValidationError({"schedule": f"Invalid cron schedule: {e}"})
            else:
                job.nextRun = None
            job.save(update_fields=["nextRun"])
        except Channel.DoesNotExist:
            raise ValidationError("Channel not found")

    def perform_update(self, serializer):
        job = serializer.save()
        # Keep nextRun aligned with schedule/status.
        if job.status == "active":
            try:
                job.nextRun = compute_next_run(job.schedule, timezone.now())
            except Exception as e:
                raise ValidationError({"schedule": f"Invalid cron schedule: {e}"})
        else:
            job.nextRun = None
        job.save(update_fields=["nextRun"])

    @action(detail=True, methods=["post"])
    def run_now(self, request, channel_pk=None, pk=None):
        job = self.get_object()
        result = run_cron_job(job, now=timezone.now())
        return Response({"ok": result.ok, "detail": result.detail}, status=status.HTTP_200_OK)


class PostLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PostLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        channel_id = self.kwargs.get("channel_pk")
        if not channel_id:
            return PostLog.objects.none()
        return PostLog.objects.filter(channel_id=channel_id, channel__user=self.request.user).order_by("-id")


class AIModelViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AIModelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # return all active models (global)
        return AIModel.objects.filter(is_active=True)
