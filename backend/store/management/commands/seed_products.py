from django.core.management.base import BaseCommand
from django.utils.text import slugify

from store.models import Category, Product


PRODUCTS = [
    ("Home", "home", "The Everyday Ceramic Vase", "A sculptural stoneware vase with a soft matte glaze, made for fresh stems or a quiet shelf.", "42.00", "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=85", 4.9, True),
    ("Accessories", "accessories", "Canvas Weekend Tote", "A sturdy, roomy carryall in heavyweight cotton canvas. Built for market mornings and long weekends.", "36.00", "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=85", 4.8, True),
    ("Home", "home", "Soft Knit Throw", "A generous, brushed-cotton throw in a calming natural weave. Your new favorite layer for the sofa.", "68.00", "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85", 4.9, True),
    ("Beauty", "beauty", "Botanical Hand Wash", "A gentle, plant-derived cleanser with a bright citrus and cedarwood scent. Refillable glass bottle.", "24.00", "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=85", 4.7, False),
    ("Accessories", "accessories", "Everyday Leather Wallet", "Minimal, responsibly sourced leather with space for the essentials and a little room to grow.", "54.00", "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=85", 4.8, False),
    ("Home", "home", "Sunday Morning Mug", "A hand-finished ceramic mug that feels good to hold. Each one has its own subtle character.", "28.00", "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85", 5.0, False),
    ("Beauty", "beauty", "Daily Ritual Face Oil", "A lightweight blend of nourishing botanicals for a simple, replenishing evening routine.", "32.00", "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=900&q=85", 4.7, False),
    ("Accessories", "accessories", "Sculpted Brass Earrings", "Lightweight, sculptural hoops with a warm brushed finish. Designed to wear from day to night.", "48.00", "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85", 4.9, False),
]


class Command(BaseCommand):
    help = "Create a small sample catalog; safe to run more than once."

    def handle(self, *args, **options):
        created = 0
        for name, category_slug, product_name, description, price, image, rating, featured in PRODUCTS:
            category, _ = Category.objects.get_or_create(
                slug=category_slug,
                defaults={"name": name, "description": f"Thoughtful {name.lower()} for everyday living."},
            )
            product, was_created = Product.objects.update_or_create(
                slug=slugify(product_name),
                defaults={
                    "category": category,
                    "name": product_name,
                    "description": description,
                    "price": price,
                    "image_url": image,
                    "rating": rating,
                    "stock": 25,
                    "featured": featured,
                },
            )
            created += int(was_created)
        self.stdout.write(self.style.SUCCESS(f"Catalog ready; added {created} new products."))
