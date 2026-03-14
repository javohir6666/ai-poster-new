from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Post
from .serializers import PostSerializer


class PostViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        channel_id = self.kwargs.get("channel_pk")
        qs = Post.objects.filter(channel__user=self.request.user)
        if channel_id:
            qs = qs.filter(channel_id=channel_id)
        return qs.prefetch_related("images").order_by("-id")
