from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import CartItem, Category, Order, OrderItem, Product

User = get_user_model()


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category", queryset=Category.objects.all(), write_only=True
    )

    class Meta:
        model = Product
        fields = [
            "id", "category", "category_id", "name", "slug", "description",
            "price", "image_url", "rating", "stock", "featured",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        source="product", queryset=Product.objects.all(), write_only=True
    )
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ["id", "product", "product_id", "quantity", "line_total"]

    def get_line_total(self, item):
        return item.product.price * item.quantity


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["product_name", "unit_price", "quantity"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "status", "full_name", "email", "address", "city",
            "postal_code", "country", "subtotal", "shipping", "total",
            "created_at", "items",
        ]


class CheckoutSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    address = serializers.CharField(max_length=240)
    city = serializers.CharField(max_length=100)
    postal_code = serializers.CharField(max_length=24)
    country = serializers.CharField(max_length=80)


class ProductFilterSerializer(serializers.Serializer):
    search = serializers.CharField(required=False, allow_blank=True, max_length=120)
    category = serializers.SlugField(required=False, allow_blank=True, max_length=90)
    min_price = serializers.DecimalField(required=False, max_digits=10, decimal_places=2, min_value=0)
    max_price = serializers.DecimalField(required=False, max_digits=10, decimal_places=2, min_value=0)
