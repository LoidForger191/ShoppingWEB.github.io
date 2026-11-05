# Good Things — thoughtful essentials

A small, full-stack storefront built with React, Django REST Framework, and a relational database. It includes a real product catalog, accounts, a server-backed shopping cart, order placement with shipping details, order history, and a staff-only Django admin.

## What works

- Browse categories and products; search names/descriptions, cap the price, sort by price/rating, and open product details.
- Register with a username, email, and validated password; sign in using a password hashed by Django. JWT tokens protect account-specific endpoints.
- Add items to a signed-in cart, change quantities, and remove items.
- Submit shipping information to place an order. The API checks stock in a database transaction, stores an immutable name/price snapshot for each line, updates inventory, and clears the cart. Orders below $75 have a $6 shipping charge; orders of $75 or more ship free.
- See your own previous orders and their current status.
- Staff manage categories/products and review/update order status in Django admin.
- No payment-card fields, card storage, or pretend payment processor are included.

## Requirements

- Node.js 20 or newer and npm.
- Python 3.10 or newer and pip.
- SQLite is used by default for local development. MySQL 8+ is supported when configured below.

## Run locally (SQLite)

In the repository root, install the frontend and start Vite:

```powershell
npm install
npm run dev
```

In a second terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py seed_products
python manage.py createsuperuser
python manage.py runserver
```

Open the Vite URL (normally `http://localhost:5173`). The API is at `http://127.0.0.1:8000/api/`; the admin is at `http://127.0.0.1:8000/admin/`.

The storefront connects to `http://127.0.0.1:8000/api` by default. To use another API origin, define `VITE_API_URL` in a root `.env` file before starting Vite, for example `VITE_API_URL=http://localhost:8000/api`.

## Deploying the storefront to GitHub Pages

The Pages site must publish the Vite build output, not the repository source folder. The workflow in `.github/workflows/deploy-pages.yml` builds the frontend and deploys `dist/` when changes reach `main`. For the first workflow deployment, open **Settings → Pages** and set the publishing source to **GitHub Actions**. The Vite build automatically uses the repository subpath on Actions, so the script and asset URLs work at `https://loidforger191.github.io/ShoppingWEB.github.io/`.

GitHub Pages hosts only the static React frontend; it does not run Django or MySQL. Without a configured API, the site displays a browsable sample-catalog preview and clearly indicates that account, cart, and checkout features require the Django API. To enable those features, deploy the Django backend separately over HTTPS, set the repository Actions variable `VITE_API_URL` to its `/api` URL, and allow the Pages origin in Django's `FRONTEND_ORIGIN`. Re-run the Pages workflow after changing the variable.

## MySQL configuration

Create a database using UTF-8 and a dedicated database user, then set the backend environment variables before running Django. Copy `backend/.env.example` to `backend/.env` as a reference; Django settings intentionally read environment variables directly and do not load `.env` files automatically. In PowerShell, set the values in the current terminal before starting Django:

```powershell
$env:DJANGO_SECRET_KEY = "use-a-long-random-secret"
$env:DJANGO_DEBUG = "True"
$env:MYSQL_DATABASE = "shopping_store"
$env:MYSQL_USER = "shopping_app"
$env:MYSQL_PASSWORD = "your-local-database-password"
$env:MYSQL_HOST = "127.0.0.1"
$env:MYSQL_PORT = "3306"
```

Install the requirements (including `mysqlclient`), then run `python manage.py migrate` and the remaining commands above. On Windows, `mysqlclient` may require a compatible prebuilt wheel or the MySQL/MariaDB client development libraries. If setup is difficult, omit `MYSQL_DATABASE` to use SQLite.

For deployment, set a unique `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, and explicit `DJANGO_ALLOWED_HOSTS`; serve over HTTPS and configure the production frontend origin. Development generates a temporary random key when none is set; production refuses to start without an explicit key. SQLite is not a production database recommendation. Do not commit credentials. The example contact address in the storefront should be replaced with your real customer-support address before publishing.

## API outline

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/categories/` | List product categories |
| `GET` | `/api/products/?search=&category=&min_price=&max_price=` | Search/filter products |
| `GET` | `/api/products/<slug>/` | Product detail |
| `POST` | `/api/auth/register/` | Create an account |
| `POST` | `/api/auth/token/` | Get access and refresh tokens (`username`, `password`) |
| `POST` | `/api/auth/token/refresh/` | Refresh access token |
| `GET`, `POST` | `/api/cart/` | Read a private cart or add a product |
| `PATCH`, `DELETE` | `/api/cart/<id>/` | Change quantity or remove an item |
| `POST` | `/api/checkout/` | Place an order with shipping details |
| `GET` | `/api/orders/` | List the signed-in customer's orders |

Include your access token when calling cart and order endpoints. Product writes are restricted to staff; use Django admin at `/admin/` for the management interface. Product image URLs in the sample catalog use Unsplash-hosted images.

## Tests and production build

```powershell
cd backend
python manage.py test store
```

```powershell
npm run build
```

The nine backend tests cover registration/password hashing and login, product search/filtering and staff-only writes, private cart access and quantity updates, successful checkout/inventory/cart behavior, stock and empty-cart rejection, and order privacy. React's production build is checked by Vite; this repository does not include a separate frontend test runner.