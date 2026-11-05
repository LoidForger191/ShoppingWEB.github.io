from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import CartItem, Category, Order, Product


class StoreApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="shopper", email="shopper@example.com", password="GoodPassword123!"
        )
        self.category = Category.objects.create(name="Home", slug="home")
        self.product = Product.objects.create(
            category=self.category,
            name="Sunday Mug",
            slug="sunday-mug",
            description="A handmade mug.",
            price=Decimal("28.00"),
            image_url="https://example.com/mug.jpg",
            stock=3,
        )

    def test_product_search_and_category_filter(self):
        response = self.client.get(reverse("products"), {"search": "mug", "category": "home"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual([product["slug"] for product in response.data], ["sunday-mug"])

    def test_product_filters_reject_invalid_prices_and_writes_require_staff(self):
        response = self.client.get(reverse("products"), {"min_price": "not-a-price"})
        self.assertEqual(response.status_code, 400)
        response = self.client.post(reverse("products"), {}, format="json")
        self.assertEqual(response.status_code, 401)

    def test_staff_can_create_products_through_the_api(self):
        staff = get_user_model().objects.create_user(
            username="staff", password="GoodPassword123!", is_staff=True
        )
        self.client.force_authenticate(staff)
        response = self.client.post(
            reverse("products"),
            {
                "category_id": self.category.id,
                "name": "Market Tote",
                "slug": "market-tote",
                "description": "A useful tote.",
                "price": "36.00",
                "image_url": "https://example.com/tote.jpg",
                "stock": 5,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Product.objects.get(slug="market-tote").category, self.category)

    def test_registration_hashes_password_and_allows_login(self):
        response = self.client.post(
            reverse("register"),
            {
                "username": "new-shopper",
                "email": "new@example.com",
                "password": "Distinctive!Passphrase846",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        user = get_user_model().objects.get(username="new-shopper")
        self.assertTrue(user.check_password("Distinctive!Passphrase846"))
        self.assertNotEqual(user.password, "Distinctive!Passphrase846")
        token = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "new-shopper", "password": "Distinctive!Passphrase846"},
            format="json",
        )
        self.assertEqual(token.status_code, 200)
        self.assertIn("access", token.data)

    def test_cart_is_private_and_quantity_is_editable(self):
        self.assertEqual(self.client.get(reverse("cart")).status_code, 401)
        self.client.force_authenticate(self.user)
        response = self.client.post(reverse("cart"), {"product_id": self.product.id, "quantity": 1})
        self.assertEqual(response.status_code, 201)
        item_id = response.data["id"]
        updated = self.client.patch(
            reverse("cart-item-detail", args=[item_id]), {"quantity": 2}, format="json"
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data["quantity"], 2)

    def test_checkout_creates_order_snapshots_and_clears_cart(self):
        self.client.force_authenticate(self.user)
        CartItem.objects.create(user=self.user, product=self.product, quantity=2)
        response = self.client.post(
            reverse("checkout"),
            {
                "full_name": "Shopper Name",
                "email": "shopper@example.com",
                "address": "1 Market Street",
                "city": "Portland",
                "postal_code": "97201",
                "country": "United States",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["total"], "62.00")
        self.assertEqual(response.data["items"][0]["product_name"], "Sunday Mug")
        self.assertFalse(CartItem.objects.filter(user=self.user).exists())
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 1)

    def test_checkout_rejects_insufficient_stock_without_mutating_cart(self):
        self.client.force_authenticate(self.user)
        CartItem.objects.create(user=self.user, product=self.product, quantity=4)
        response = self.client.post(
            reverse("checkout"),
            {
                "full_name": "Shopper Name",
                "email": "shopper@example.com",
                "address": "1 Market Street",
                "city": "Portland",
                "postal_code": "97201",
                "country": "United States",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(CartItem.objects.get(user=self.user).quantity, 4)
        self.assertFalse(Order.objects.exists())

    def test_customers_only_see_their_own_orders(self):
        other_user = get_user_model().objects.create_user(
            username="another", email="another@example.com", password="GoodPassword123!"
        )
        Order.objects.create(
            user=other_user,
            full_name="Another Shopper",
            email="another@example.com",
            address="9 Other Street",
            city="Salem",
            postal_code="97301",
            country="United States",
            subtotal=Decimal("28.00"),
            shipping=Decimal("6.00"),
            total=Decimal("34.00"),
        )
        self.client.force_authenticate(self.user)
        response = self.client.get(reverse("orders"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_checkout_rejects_empty_cart(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            reverse("checkout"),
            {
                "full_name": "Shopper Name",
                "email": "shopper@example.com",
                "address": "1 Market Street",
                "city": "Portland",
                "postal_code": "97201",
                "country": "United States",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("cart", response.data)
        self.assertFalse(Order.objects.exists())
