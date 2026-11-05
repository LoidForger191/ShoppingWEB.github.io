from django.urls import path

from .views import (
    CartItemDetailView,
    CartView,
    CategoryListView,
    CheckoutView,
    OrderListView,
    ProductDetailView,
    ProductListView,
    RegisterView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("categories/", CategoryListView.as_view(), name="categories"),
    path("products/", ProductListView.as_view(), name="products"),
    path("products/<slug:slug>/", ProductDetailView.as_view(), name="product-detail"),
    path("cart/", CartView.as_view(), name="cart"),
    path("cart/<int:pk>/", CartItemDetailView.as_view(), name="cart-item-detail"),
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("orders/", OrderListView.as_view(), name="orders"),
]
