from decimal import Decimal

from django.db import transaction
from django.db.models import F, Q
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CartItem, Category, Order, OrderItem, Product
from .permissions import ReadOnlyOrAdmin
from .serializers import (
    CartItemSerializer,
    CategorySerializer,
    CheckoutSerializer,
    OrderSerializer,
    ProductFilterSerializer,
    ProductSerializer,
    RegisterSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductListView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [ReadOnlyOrAdmin]

    def get_queryset(self):
        filters = ProductFilterSerializer(data=self.request.query_params)
        filters.is_valid(raise_exception=True)
        params = filters.validated_data
        queryset = Product.objects.select_related("category").filter(stock__gte=0)
        query = params.get("search", "").strip()
        category = params.get("category", "").strip()
        if query:
            queryset = queryset.filter(Q(name__icontains=query) | Q(description__icontains=query))
        if category and category != "all":
            queryset = queryset.filter(category__slug=category)
        if "min_price" in params:
            queryset = queryset.filter(price__gte=params["min_price"])
        if "max_price" in params:
            queryset = queryset.filter(price__lte=params["max_price"])
        return queryset


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.select_related("category")
    serializer_class = ProductSerializer
    permission_classes = [ReadOnlyOrAdmin]
    lookup_field = "slug"


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        items = CartItem.objects.filter(user=request.user).select_related("product", "product__category")
        return Response(CartItemSerializer(items, many=True).data)

    def post(self, request):
        serializer = CartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data["product"]
        quantity = serializer.validated_data["quantity"]
        item, created = CartItem.objects.get_or_create(
            user=request.user, product=product, defaults={"quantity": quantity}
        )
        if not created:
            item.quantity += quantity
            item.save(update_fields=["quantity", "updated_at"])
        return Response(CartItemSerializer(item).data, status=status.HTTP_201_CREATED)


class CartItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user).select_related("product", "product__category")

    def perform_update(self, serializer):
        quantity = serializer.validated_data.get("quantity")
        if quantity is None:
            raise ValidationError({"quantity": "This field is required."})
        serializer.save()


class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        shipping_data = CheckoutSerializer(data=request.data)
        shipping_data.is_valid(raise_exception=True)

        with transaction.atomic():
            cart_items = list(
                CartItem.objects.select_for_update()
                .filter(user=request.user)
            )
            if not cart_items:
                raise ValidationError({"cart": "Your cart is empty."})

            products = {
                product.pk: product
                for product in Product.objects.select_for_update().filter(
                    pk__in=[item.product_id for item in cart_items]
                )
            }
            for item in cart_items:
                product = products[item.product_id]
                if item.quantity > product.stock:
                    raise ValidationError(
                        {"stock": f"Only {product.stock} of {product.name} are available."}
                    )

            subtotal = sum(
                (products[item.product_id].price * item.quantity for item in cart_items),
                Decimal("0.00"),
            )
            shipping = Decimal("0.00") if subtotal >= Decimal("75.00") else Decimal("6.00")
            order = Order.objects.create(
                user=request.user,
                subtotal=subtotal,
                shipping=shipping,
                total=subtotal + shipping,
                **shipping_data.validated_data,
            )
            for item in cart_items:
                product = products[item.product_id]
                Product.objects.filter(pk=product.pk).update(stock=F("stock") - item.quantity)
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    unit_price=product.price,
                    quantity=item.quantity,
                )
            CartItem.objects.filter(user=request.user).delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")
