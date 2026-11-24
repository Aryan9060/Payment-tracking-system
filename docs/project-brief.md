# MASTER PROMPT: Build an Invoice & Payment Tracking System Using MERN Stack

Act as a Senior Full-Stack MERN Developer, Software Architect, and Technical Documentation Engineer.

I want you to design and develop a complete, functional, professional web-based **Invoice & Payment Tracking System** using the MERN stack.

This is a college mini-project, but I want the implementation quality to follow professional software development practices.

Do not just give me code snippets or a theoretical explanation. Help me build the actual working application, including frontend, backend, database integration, and documentation.

# 1. Project Overview

**Project Name:** Invoice & Payment Tracking System

**Project Type:** Web-Based Application

**Technology Stack:** MERN (MongoDB, Express.js, React.js, Node.js)

The application will allow a single business owner to manage customers, generate invoices, record payments, track outstanding balances, and monitor financial performance through an interactive dashboard.

# 2. Technology Requirements

### Frontend
- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- React Router DOM
- Axios
- Recharts or Chart.js for analytics
- Lucide React for icons

### Backend
- Node.js
- Express.js
- REST API architecture
- Mongoose ODM
- JWT authentication if authentication is implemented
- bcrypt for password hashing if authentication is implemented

### Database
- MongoDB
- Mongoose schemas and relationships

# 3. Core Features

## A. Dashboard
Create an attractive dashboard displaying:

- Total number of invoices.
- Total invoice value.
- Total payments received.
- Total outstanding balance.
- Paid invoices.
- Unpaid invoices.
- Partially paid invoices.
- Recent invoices.
- Monthly payment statistics.

Include interactive charts:

1. Revenue overview chart.
2. Paid vs unpaid invoice chart.
3. Monthly income chart.
4. Outstanding payment chart.
5. Invoice category or status distribution chart, where applicable.

All dashboard values and charts must use actual database data, not hardcoded dummy values.

## B. Customer Management

Implement complete CRUD functionality:

- Add customer.
- View customer list.
- Edit customer information.
- Delete customer.
- View individual customer details.
- View invoices associated with a customer.

Customer fields:

- Customer name.
- Email.
- Phone number.
- Billing address.
- Created date.

## C. Invoice Management

Implement:

- Create invoice.
- View all invoices.
- View invoice details.
- Edit invoice.
- Delete invoice.
- Search invoices.
- Filter by payment status.
- Filter by date.
- Generate unique invoice numbers.

Invoice fields:

- Invoice number.
- Customer reference.
- Issue date.
- Due date.
- Product or service description.
- Quantity.
- Unit price.
- Tax, if applicable.
- Discount, if applicable.
- Subtotal.
- Grand total.
- Paid amount.
- Remaining amount.
- Payment status.

## D. Payment Tracking

Implement:

- Record a payment.
- View payment history.
- Support partial payments.
- Support full payments.
- Display payment dates.
- Display payment methods.
- Calculate remaining balance automatically.

Payment methods:

- Cash.
- UPI.
- Bank Transfer.
- Card.
- Other.

IMPORTANT BUSINESS LOGIC:

Never allow the user to manually manipulate the remaining balance.

Use this calculation:

Remaining Amount = Invoice Total - Total Payments Received

Payment status must be calculated automatically:

- Paid: Remaining amount equals zero.
- Partially Paid: Paid amount is greater than zero but less than invoice total.
- Unpaid: No payment has been received.

Prevent payments greater than the remaining invoice balance.

Maintain an individual payment history for every invoice.

# 4. UI/UX Requirements

Design a modern, clean, responsive dashboard.

The interface should have:

- Professional sidebar navigation.
- Top navigation bar.
- Dashboard summary cards.
- Clean data tables.
- Search and filter functionality.
- Modal forms or dedicated forms.
- Responsive layouts for desktop, tablet, and mobile.
- Consistent typography, spacing, colors, and icons.
- Loading indicators.
- Empty states.
- Error messages.
- Success notifications.
- Confirmation before destructive operations.

Use a consistent design system throughout the application.

Avoid unnecessarily complicated animations and excessive visual effects.

# 5. Backend Architecture

Follow a clean MVC-based architecture.

Suggested structure:

server/
- config/
- controllers/
- models/
- routes/
- middleware/
- utils/
- server.js

Implement RESTful APIs for:

### Customers
- GET /api/customers
- GET /api/customers/:id
- POST /api/customers
- PUT /api/customers/:id
- DELETE /api/customers/:id

### Invoices
- GET /api/invoices
- GET /api/invoices/:id
- POST /api/invoices
- PUT /api/invoices/:id
- DELETE /api/invoices/:id

### Payments
- GET /api/payments
- GET /api/payments/:id
- POST /api/payments

### Dashboard
- GET /api/dashboard/summary
- GET /api/dashboard/analytics

Add proper:
- Input validation.
- Error handling middleware.
- HTTP status codes.
- Database connection handling.
- Environment variable configuration.
- Data consistency checks.

Use MongoDB transactions for operations involving multiple related database updates when supported by the deployment configuration. Otherwise, design safe operations that prevent inconsistent records.

# 6. Frontend Architecture

Suggested structure:

client/
- public/
- src/
  - assets/
  - components/
  - layouts/
  - pages/
  - services/
  - hooks/
  - context/
  - utils/
  - App.jsx
  - main.jsx

Create reusable components wherever appropriate.

Separate API calls from UI components.

Use React Router for navigation.

Keep the code modular, readable, and maintainable.

# 7. Security Requirements

Follow basic web application security practices:

- Validate all incoming data.
- Sanitize user input where appropriate.
- Use environment variables for secrets.
- Configure CORS correctly.
- Use Helmet for HTTP security headers.
- Implement rate limiting on sensitive endpoints.
- Prevent unauthorized data modification.
- Avoid exposing database credentials.
- Never store passwords in plain text if authentication is implemented.

Do not claim that the application is production-secure without appropriate security testing.

# 8. README Documentation

Create and maintain a professional README.md file in the project root.

The README must include:

1. Project title.
2. Project overview.
3. Problem statement.
4. Project objectives.
5. Key features.
6. Technology stack.
7. System architecture.
8. Project folder structure.
9. Database design.
10. API documentation.
11. Installation instructions.
12. Environment variable configuration.
13. How to run the application.
14. Screenshots section.
15. Future enhancements.
16. Conclusion.

IMPORTANT:

The README must accurately reflect the implemented application.

Do not document features as completed until they actually work.

Use Markdown formatting, tables, code blocks, and clear section headings.

# 9. Development Instructions

Follow these instructions carefully:

1. First analyze the complete project requirements.
2. Define the architecture and database schemas.
3. Set up the project folder structure.
4. Implement the backend.
5. Connect MongoDB.
6. Test backend APIs.
7. Implement the React frontend.
8. Integrate frontend with backend.
9. Implement charts using actual database data.
10. Test all CRUD operations.
11. Test payment calculations and edge cases.
12. Fix errors and verify the complete application.
13. Create and update README.md.
14. Provide setup and execution instructions.

Do not skip steps.

Do not create placeholder functionality and claim it is complete.

Do not leave important features as TODO comments.

If something cannot be implemented in the current environment, explain the limitation and provide the exact files or commands needed.

# 10. Expected Final Deliverables

At completion, provide:

- Complete working MERN application.
- Organized frontend and backend source code.
- MongoDB database integration.
- Functional REST APIs.
- Interactive dashboard with charts.
- Customer management module.
- Invoice management module.
- Payment tracking module.
- Professional README.md.
- .env.example file.
- .gitignore file.
- Installation and execution instructions.
- Testing summary.

# 11. Important Working Rules

- Do not generate the entire project as disconnected code snippets.
- Work directly with the project files if you have coding-agent or workspace access.
- Do not overwrite existing project files without inspecting them first.
- If a project already exists, analyze its current structure before making changes.
- Keep the implementation consistent with the defined architecture.
- Verify imports, routes, API endpoints, and database models.
- Do not invent test results.
- Ask questions only when essential information is missing.
- Make reasonable technical decisions independently.
- Prioritize functionality, maintainability, security, and documentation.

**Final Goal:**

Deliver a complete, functional, well-documented Invoice & Payment Tracking System using the MERN stack that can be demonstrated as a college mini-project and explained confidently during a project viva.