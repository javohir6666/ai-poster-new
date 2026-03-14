from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    username = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("id", "email", "password", "username")

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            username=(validated_data.get("username") or validated_data["email"]),
            password=validated_data["password"],
        )
        return user


class MeSerializer(serializers.ModelSerializer):
    # Frontend expects `name`, but we use Django's default `username`.
    name = serializers.CharField(source="username", required=False, allow_blank=True)
    email = serializers.EmailField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "name")


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
