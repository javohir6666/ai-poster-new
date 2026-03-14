from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny

User = get_user_model()

class RegisterView(generics.CreateAPIView):
	serializer_class = RegisterSerializer
	permission_classes = [AllowAny]
	authentication_classes = []

	def create(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user = serializer.save()
		refresh = RefreshToken.for_user(user)
		return Response({
			'access': str(refresh.access_token),
			'refresh': str(refresh),
			'user': {
				'id': user.id,
				'email': user.email,
				'name': user.username
			}
		}, status=status.HTTP_201_CREATED)

class LoginView(generics.GenericAPIView):
	permission_classes = [AllowAny]
	authentication_classes = []

	def post(self, request, *args, **kwargs):
		email = request.data.get('email')
		password = request.data.get('password')
		user = authenticate(request, username=email, password=password)
		if not user:
			return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
		refresh = RefreshToken.for_user(user)
		return Response({
			'access': str(refresh.access_token),
			'refresh': str(refresh),
			'user': {
				'id': user.id,
				'email': user.email,
				'name': user.username
			}
		}, status=status.HTTP_200_OK)
