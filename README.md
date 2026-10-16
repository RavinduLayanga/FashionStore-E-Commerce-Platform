# Clothing & Fashion E-Commerce Platform

A full-stack clothing-store portfolio project built with **Next.js, React, Express, Prisma, and PostgreSQL**. It demonstrates product discovery, variant-based inventory, guest checkout, order management, inventory reservations, and an authenticated admin interface.

## Live Demo

**[Open the Fashion Store](https://fashion-store-lime-one.vercel.app/)**
**[Open the Admin login](https://fashion-store-lime-one.vercel.app/admin/login)**

The live site is a portfolio demonstration. Products, prices, and inventory are simulated; product imagery is illustrative. PayHere is configured for sandbox testing, not real customer payments. Do not enter real payment details or sensitive personal information.

## Features

### Storefront

- Browse the clothing catalogue and product details.
- Search and filter products using supported catalogue options.
- View product images, sizes, colours, prices, and stock-related availability.
- Add items to the cart and update quantities.
- Place orders as a guest without creating a customer account.

### Orders and checkout

- WhatsApp order workflow with pending admin review.
- PayHere sandbox payment workflow and backend payment-notification handling.
- Order-item snapshots preserve the product and price details recorded when an order is placed.
- Order status history supports administrative order handling.
- Inventory reservations help prevent concurrent orders from claiming the same available stock.

### Admin interface

- Admin authentication.
- Review orders and approve eligible WhatsApp orders or cancel eligible pending orders.
- Create and update products, categories, variants, prices, stock, and product status through the supported admin functionality.
- View order-related dashboard summaries.

### Backend and data integrity

- REST API organised into routes, controllers, services, validation, and middleware.
- Server-side request validation with Zod.
- Password hashing and JWT-based authentication using an HTTP-only cookie.
- Security headers, CORS configuration, and rate limiting.
- Prisma transactions and row-level locking for critical inventory/order operations.

## Technology Stack

| Area                | Technology                                      |
| ------------------- | ----------------------------------------------- |
| Frontend            | Next.js 14, React 18, JavaScript                |
| Styling and icons   | Tailwind CSS, Lucide React                      |
| Backend             | Node.js, Express 4                              |
| Database and ORM    | PostgreSQL 16, Prisma 5                         |
| Validation          | Zod                                             |
| Authentication      | JWT, HTTP-only cookies, bcryptjs                |
| Security middleware | Helmet, CORS, express-rate-limit, cookie-parser |
| Payment integration | PayHere sandbox                                 |
| Local database      | Docker Compose                                  |

## Architecture

```text
Browser
  |
  v
Next.js storefront and admin interface
  |  HTTP requests
  v
Express REST API
  +-- Routes and validation
  +-- Controllers
  +-- Services and business rules
  +-- Authentication and authorization middleware
  |
  v
Prisma ORM
  |
  v
PostgreSQL
```

The backend is the authoritative layer for order totals, inventory reservations, and order-state changes. Client-submitted prices and stock values are not treated as the final source of truth.

### Main data models

- `User` — user credentials and role information. The schema defines a `STAFF` role, but a complete staff-management interface and staff-specific permissions are not implemented in Version 1.
- `Category`, `Product`, `ProductImage`, `ProductVariant` — catalogue, product images, SKU, size, colour, price, and physical stock.
- `Order`, `OrderItem` — order information and item snapshots captured at order time.
- `InventoryReservation` — quantities temporarily reserved against product variants.
- `Payment` — payment method, amount, status, transaction identifier, and related payment data.
- `OrderStatusHistory` — records order status transitions.

## Running Locally

### Requirements

- Node.js (Node.js 20 LTS is a reasonable starting point for this project)
- npm
- Docker with Docker Compose, or a PostgreSQL database
- Git

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Configure the backend

```bash
cd backend
npm ci
cp .env.example .env
```

Set the backend environment variables for your local database, JWT secret, initial admin account, and any integrations you want to test. The variable names are documented in `backend/.env.example`.

### 3. Start PostgreSQL

From the repository root, start the included PostgreSQL service:

```bash
docker compose up -d postgres
```

The supplied Compose configuration maps PostgreSQL to host port `5435`. For the default local Compose database, the connection strings in `backend/.env` should use:

```dotenv
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5435/ecommerce_db?schema=public"
DIRECT_URL="postgresql://postgres:postgrespassword@localhost:5435/ecommerce_db?schema=public"
```

These are local development credentials only. Do not reuse them for a hosted or shared environment.

### 4. Prepare the database

The repository currently uses the Prisma schema without checked-in migration files. For a fresh, disposable development database, run from `backend/`:

```bash
npx prisma db push
npx prisma generate
npm run db:seed
```

The seed script clears existing application records before recreating the initial admin and sample catalogue. **Only run it against a disposable database.** For a long-lived deployment, add and review Prisma migrations and establish a repeatable migration process.

### 5. Configure and run the frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm ci
cp .env.local.example .env.local
```

For local development, configure the frontend API URL and the optional integration values in `frontend/.env.local`. Then start the applications in separate terminals.

Backend, from `backend/`:

```bash
npm run dev
```

Frontend, from `frontend/`:

```bash
npm run dev
```

The storefront is available at `http://localhost:3000`; the API health endpoint is `http://localhost:5001/api/health`.

## API Overview

All endpoints are prefixed with `/api`.

| Method  | Endpoint                        | Access               | Purpose                                                              |
| ------- | ------------------------------- | -------------------- | -------------------------------------------------------------------- |
| `GET`   | `/health`                       | Public               | API health information (`/api/health`).                              |
| `GET`   | `/categories`                   | Public               | List categories.                                                     |
| `POST`  | `/categories`                   | Admin                | Create a category.                                                   |
| `GET`   | `/products`                     | Public               | List and filter products.                                            |
| `GET`   | `/products/:identifier`         | Public               | Retrieve a product by a supported identifier.                        |
| `POST`  | `/products`                     | Admin                | Create a product.                                                    |
| `GET`   | `/products/admin/:id`           | Admin                | Retrieve admin product details.                                      |
| `PATCH` | `/products/:id`                 | Admin                | Update product details or status.                                    |
| `PATCH` | `/products/variants/:variantId` | Admin                | Update variant price, stock, or status.                              |
| `POST`  | `/auth/login`                   | Public, rate-limited | Sign in to the admin interface.                                      |
| `GET`   | `/auth/me`                      | Authenticated        | Return the current authenticated user.                               |
| `POST`  | `/auth/logout`                  | Public endpoint      | Clear the authentication cookie.                                     |
| `POST`  | `/orders`                       | Public, rate-limited | Create an order and related reservation/payment records.             |
| `GET`   | `/orders`                       | Admin                | List orders.                                                         |
| `POST`  | `/orders/:orderId/approve`      | Admin                | Approve an eligible WhatsApp order.                                  |
| `POST`  | `/orders/:orderId/cancel`       | Admin                | Cancel an eligible pending order and release its active reservation. |
| `POST`  | `/orders/webhook/payhere`       | Payment callback     | Receive PayHere payment notifications for server-side verification.  |

Customer registration, customer login, and customer account pages are not part of Version 1. The current admin interface supports admin-level store operations; staff management and role-specific staff permissions remain possible future enhancements.

## Order and Inventory Design

The data model separates physical stock from active reservations. A reservation temporarily holds inventory for an order, helping prevent concurrent orders from claiming the same final unit.

Critical order and inventory operations use database transactions and row-level locking. Order items store snapshots of relevant product, variant, SKU, and price details so that later catalogue edits do not rewrite historical order items.

- **WhatsApp orders:** an order is created pending review with an active inventory reservation. An admin can approve or cancel an eligible order.
- **PayHere:** the customer is directed through the sandbox payment flow. The backend verifies payment notifications before applying the corresponding payment/order transition.

## Configuration and Security

The backend reads configuration from `backend/.env`; the frontend reads public configuration from `frontend/.env.local`. The example files document the variables required by each application.

Keep real environment files and credentials out of version control. Values prefixed with `NEXT_PUBLIC_` are exposed to the browser and must never contain database credentials, JWT secrets, or the PayHere secret. Hosted deployments also need correctly configured CORS and cookie settings for the deployed frontend and API domains.

The project is a portfolio demo, not a claim of production readiness. Before handling real customer data or payments, it would need further testing and review of authentication, authorization, CSRF protections, payment callbacks, logging, monitoring, and deployment configuration.

## Limitations and Roadmap

Potential future improvements include:

- Automated unit and integration tests in the development workflow.
- Checked-in Prisma migrations and a repeatable deployment migration process.
- CI checks for linting, tests, and production builds.
- Better operational logging, monitoring, and error reporting.
- A security review covering authentication, CSRF protections, payment callbacks, and production cookie configuration.
- A deployed staging environment for checkout and inventory testing before any real-payment use.
- Customer registration, login, and a customer dashboard for order history and tracking.
- Staff account management and role-based permissions for order and inventory tasks.
- Additional admin reporting and category-management UI where useful.

## License

No license has been specified. Until a license is added to the repository, reuse and redistribution permissions are not explicitly granted.
