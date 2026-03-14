# Django Backend Reference (For local use only)
# This code is provided as a reference for your Django implementation.
# It cannot run in the current browser environment.

from django.db import models
from django.contrib.auth.models import User
from rest_framework import serializers, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

# Models
class Channel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    telegram_bot_token = models.CharField(max_length=255)
    ai_model = models.CharField(max_length=50, default='gemini-pro')
    ai_api_key = models.CharField(max_length=255, blank=True)
    custom_prompt = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

# Serializers
class ChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Channel
        fields = '__all__'
        read_only_fields = ('user',)

# Views
class ChannelViewSet(viewsets.ModelViewSet):
    serializer_class = ChannelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Channel.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# API Endpoints (urls.py)
# urlpatterns = [
#     path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
#     path('api/channels/', ChannelViewSet.as_view({'get': 'list', 'post': 'create'})),
#     path('api/channels/<int:pk>/', ChannelViewSet.as_view({'delete': 'destroy'})),
# ]
