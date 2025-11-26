<p align="center">
  <img src="frontend/public/favicon.png" alt="Manage My Truck Logo" width="100"/>
</p>

<h1 align="center">Manage My Truck</h1>

<p align="center">
  Fleet management platform built with React, Node.js, Express & MongoDB.
  <br/>
  <i>Empowering transport businesses with analytics, automation & control.</i>
</p>

<p align="center">
  <a href="#-project-overview">
    📖 <b>About</b>
  </a> •
  <a href="#-features">
    ✨ <b>Features</b>
  </a> •
  <a href="#-getting-started">
    ⚙️ <b>Setup</b>
  </a> •
  <a href="#-tech-stack">
    🛠️ <b>Tech Stack</b>
  </a> •
  <a href="#-api-documentation">
    📚 <b>API Docs</b>
  </a> •
  <a href="#-team">
    👥 <b>Team</b>
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square" alt="Status"/>
  <img src="https://img.shields.io/badge/Internal_Project-No_Public_Access-orange?style=flat-square" alt="Internal Project"/>
  <img src="https://img.shields.io/badge/Made%20with-❤️-red?style=flat-square" alt="Made with love"/>
</p>

---

# 📖 Project Overview

**Manage My Truck** is a comprehensive fleet management platform that enables transport businesses to efficiently manage trucks, track expenses, monitor profits, and generate insightful reports. It delivers automation, analytics, and operational control through a clean, intuitive interface.

---

# ✨ Features

### 🚛 Fleet Management
- **Truck Management** – Add, view, update, and delete trucks with detailed information
- **Driver Profiles** – Comprehensive driver management with profile tracking
- **Vehicle Catalog** – Browse and manage vehicle inventory
- **Real-time Status** – Track truck availability and operational status

### 💰 Financial Management
- **Expense Tracking**
  - Fuel expenses with detailed records
  - DEF (Diesel Exhaust Fluid) expenses
  - Maintenance and other operational expenses
  - Categorized expense management
- **Income Tracking** – Monitor revenue and income streams
- **Profit Analysis** – Automated profit calculations and driver salary computation
- **Loan Calculator** – Built-in financial calculator for loan management
- **Total Expense Aggregation** – Consolidated view of all expenses

### 📊 Analytics & Reporting
- **Interactive Dashboard** – Real-time insights with customizable widgets
  - Monthly charts and visualizations
  - Statistics cards with key metrics
  - Alert widgets for important notifications
  - Driver profile widgets
  - Scheduler widgets for maintenance and tasks
- **Expense Summary** – Comprehensive expense reports and analysis
- **Visual Analytics** – Charts and graphs powered by Ant Design Charts
- **Metadata Insights** – System-wide analytics and trends
- **Custom Dashboard Layouts** – Personalized dashboard configurations

### 🔐 Security & Authentication
- **Google OAuth 2.0** – Secure social login integration
- **JWT Authentication** – Token-based secure sessions
- **Role-Based Access Control (RBAC)**
  - Admin portal with privileged access
  - Fleet Manager role
  - User-level permissions
- **Secure Password Management** – BCrypt encryption
- **Cookie-based Session Management**

### 🔔 Alerts & Notifications
- **Alert System** – Real-time notifications for important events
- **Email Integration** – Automated email alerts and summaries
- **Dashboard Alerts Widget** – In-app notification center

### 📱 User Interface
- **Responsive Design** – Mobile-first approach with Bootstrap and Ant Design
- **Modern UI Components**
  - Navigation bar and sidebar
  - Modal dialogs (Vehicle, Catalog, Expense, Calculations, Get Help)
  - Profile drawer
  - Menu drawer for mobile
  - Toast notifications
- **Progressive Web App (PWA)** – Installable mobile experience
- **Dark/Light Mode Ready** – Theme support

### 🛠️ Developer Tools
- **Swagger API Documentation** – Interactive API explorer at `/api-docs`
- **GraphQL Support** – Alternative API interface for complex queries
- **Comprehensive Logging**
  - Winston-based logging system
  - Papertrail integration for cloud logging
  - Request/Response logging middleware
  - Structured log format
- **Performance Testing**
  - Artillery load testing configurations
  - Smoke, Load, Spike, and Soak test suites
- **Health Check Endpoint** – Application monitoring at `/api/v1/app/health`

### 🔧 Additional Features
- **File Upload Support** – Multer integration for document uploads
- **Excel Export** – Data export to Excel format (ExcelJS)
- **Date Management** – Moment.js integration for date operations
- **CORS Configuration** – Secure cross-origin resource sharing
- **Error Handling** – Centralized error management system
- **Test Data Seeding** – Quick database population for testing

---

# 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18.3, Bootstrap 5.3, Ant Design 5.20 |
| **Backend** | Node.js 18+, Express.js 4.16 |
| **Database** | MongoDB 7.3+ (Mongoose ODM) |
| **Authentication** | Google OAuth 2.0, JWT, BCrypt |
| **API Documentation** | Swagger UI, OpenAPI 3.0 |
| **GraphQL** | Apollo Server 5.1 |
| **Logging** | Winston 3.18, Papertrail, Morgan |
| **Charts & Analytics** | Ant Design Charts 2.6 |
| **Testing** | Artillery (Load Testing) |
| **File Processing** | Multer, ExcelJS, XLSX |
| **Cloud Storage** | AWS S3 |
| **Deployment** | AWS EC2, Render, Vercel |
| **Language** | JavaScript (ES6+) |

---

# 🔌 API Architecture

## REST APIs

The application primarily uses RESTful APIs for all standard CRUD operations:

### **Authentication & Authorization**
- `/api/v1/app/auth` - Google OAuth and JWT-based authentication
- `/api/v1/app/users` - User management (authenticated)
- `/api/v1/app/admin` - Admin-only operations

### **Fleet Management**
- `/api/v1/app/truck` - Truck CRUD operations
- `/api/v1/app/driverProfiles` - Driver profile management

### **Financial Operations**
- `/api/v1/app/income` - Income tracking
- `/api/v1/app/fuelExpenses` - Fuel expense management
- `/api/v1/app/defExpenses` - DEF expense tracking
- `/api/v1/app/otherExpenses` - Other operational expenses
- `/api/v1/app/totalExpenses` - Expense aggregation
- `/api/v1/app/calculateLoan` - Loan calculations

### **Alerts & Metadata**
- `/api/v1/app/alerts` - Alert system management
- `/api/v1/app/metadata` - System metadata and analytics

### **Health & Monitoring**
- `/api/v1/app/health` - Application health check

## GraphQL API

GraphQL interface available for complex queries and data aggregation:
- Truck operations with advanced filtering
- Expense aggregation and analytics
- Multi-resource queries in single request

### GraphQL Endpoint
- **Query**: `POST /graphql`
- **Schema**: Available in `backend/graphql/`

## API Documentation

| **Format** | **Endpoint** | **Description** |
|------------|--------------|-----------------|
| **Swagger UI** | `/api-docs` | Interactive API documentation |
| **OpenAPI JSON** | `/api-docs.json` | OpenAPI 3.0 specification |
| **GraphQL Schema** | `/graphql` | GraphQL playground |

---

# ⚙️ Getting Started

## Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** 7.3+ (local or MongoDB Atlas)
- **Git**

## Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/BITSSAP2025AugAPIBP3Sections/APIBP-20242YB-Team-09.git
cd APIBP-20242YB-Team-09
```

### 2️⃣ Setup Backend
```bash
cd backend
npm install

# Create .env file with required variables
cp .env.example .env
# Edit .env with your configuration

# Start the backend server
npm start
```

**Backend Environment Variables:**
```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CORS_URLS=http://localhost:3000
```

### 3️⃣ Setup Frontend
```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Edit .env with backend URL

# Start the frontend server
npm start
```

**Frontend Environment Variables:**
```env
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4️⃣ Access the Application

```
Frontend → http://localhost:3000
Backend → http://localhost:8000
API Docs → http://localhost:8000/api-docs
GraphQL → http://localhost:8000/graphql
```

---

# 🧪 Testing

### Performance Testing with Artillery

```bash
cd backend

# Run smoke test
npm run artillery:smoke

# Run load test
npm run artillery:load

# Run spike test
npm run artillery:spike

# Run soak test
npm run artillery:soak

# Seed test users before testing
npm run seed:test-users
```

---

# 📚 Documentation

- **Swagger Guide**: `backend/docs/SWAGGER_USAGE_GUIDE.md`
- **GraphQL Guide**: `backend/graphql/README.md`
- **Logging Guide**: `backend/LOGGING_GUIDE.md`
- **Logging Quick Reference**: `backend/LOGGING_QUICK_REFERENCE.md`
- **Logging Implementation**: `backend/LOGGING_IMPLEMENTATION_SUMMARY.md`
- **Papertrail Setup**: `backend/PAPERTRAIL_GUIDE.md`
- **Artillery Testing**: `backend/ARTILLERY_README.md`
- **Frontend README**: `frontend/README.md`

---

# 🚀 Deployment

The application is deployed on:
- **Frontend**: Vercel
- **Backend**: Render / AWS EC2
- **Database**: MongoDB Atlas
- **Storage**: AWS S3

---

# 📁 Project Structure

```
APIBP-20242YB-Team-09/
├── backend/
│   ├── bin/                    # Server startup scripts
│   ├── controllers/            # Business logic
│   ├── database/               # Database connection
│   ├── docs/                   # API documentation
│   ├── graphql/                # GraphQL schemas and resolvers
│   ├── middleware/             # Express middleware
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # API routes
│   ├── utils/                  # Utility functions
│   ├── app.js                  # Express app configuration
│   └── package.json            # Backend dependencies
├── frontend/
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── Components/         # React components
│   │   ├── Pages/              # Page components
│   │   ├── Routes/             # Routing configuration
│   │   ├── Styles/             # CSS styles
│   │   ├── Utils/              # Utility functions
│   │   ├── Config/             # Configuration files
│   │   ├── App.js              # Root component
│   │   └── index.js            # Entry point
│   └── package.json            # Frontend dependencies
├── README.md                   # This file
└── LICENSE                     # MIT License
```

---

# 👥 Contributors

| [<img src="https://avatars.githubusercontent.com/u/85933206?v=4" width="100" height="100" style="border-radius:50%"/>](https://github.com/brindas) | [<img src="https://avatars.githubusercontent.com/u/73706705?s=400&u=150831dea33fa9328172f02f5b05c4e9bc1e1b18&v=4" width="100" height="100" style="border-radius:50%"/>](https://github.com/ebytom) | [<img src="https://avatars.githubusercontent.com/u/79135241?v=4" width="100" height="100" style="border-radius:50%"/>](https://github.com/govindmj) | [<img src="https://avatars.githubusercontent.com/u/85976132?v=4" width="100" height="100" style="border-radius:50%"/>](https://github.com/joyaldevassy) | [<img src="https://avatars.githubusercontent.com/u/79042847?v=4" width="100" height="100" style="border-radius:50%"/>](https://github.com/nehabimal) |
|:--:|:--:|:--:|:--:|:--:|
| **Brinda S** | **Eby Tom** | **Govind M J** | **Joyal Devassy** | **Neha Bimal** |

---

# 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">Made with ❤️ by <b>Team AWengerS</b></p>
