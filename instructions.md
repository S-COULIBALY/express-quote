**Application Context:**

You must develop a web application for creating and managing quotes for two main services: **moving** and **cleaning**. This application will allow clients to create a quote by following a complete flow and allow the administrator to manage all quotes and payments via a feature-rich Dashboard. The application must be designed for production deployment on **Vercel** and use the following technologies:

- **Next.js 14.1.0** with the new App Router in a `src/` directory
- **TypeScript** for strict and modern typing
- **ESLint** to ensure code quality
- **Tailwind CSS** for design
- **API Routes** to expose complete REST endpoints (GET, POST, PUT, DELETE) as well as specific endpoints (payment, PDF generation, email sending)

---

**Complete Flow for Each Service:**

1. **Home**: The client arrives on the home page and chooses between "Moving" and "Cleaning".
2. **Form**: Depending on the chosen service, the client is redirected to a specific form where the required information is provided.
3. **Summary**: A summary page displays the entered information for validation.
4. **Payment**: If the summary is validated, the client accesses a payment page where they enter their personal and banking information to pay a 30% deposit.
5. **Confirmation**: After a successful payment, a PDF is generated containing all the information (service details, personal data, deposit paid) and the quote is sent by email to the client.

---

**Administrator Dashboard:**

The Dashboard must provide several tabs to allow the administrator to manage the application. The recommended tabs include:

- **Home**: An overview of statistics (number of quotes, payments made, etc.)
- **Quotes**: A complete list of quotes for each service, with the ability to view, edit, or delete a quote.
- **Payments**: A list of received payments and transaction statuses.
- **Users/Clients** (optional): Management of client information.
- **Reports**: Generation of reports and statistics (e.g., quotes generated over a period, total deposit collected, etc.)
- **Settings**: Application configuration (e.g., email settings, PDF settings, etc.)

---

**Detailed Instructions for the AI Agent:**

1. **Pages and Navigation:**
   - The home page must display two buttons ("Moving" and "Cleaning") that redirect respectively to `/moving/new` and `/cleaning/new`.
   - For each service, implement:
     - A **list page** showing the history of quotes.
     - A **creation page** (form) to generate a new quote.
     - A **summary page** that presents the entered information and allows confirmation of the quote.
     - A **payment page** to collect banking and personal information and process a 30% deposit payment.
     - A **success page** that confirms the payment, triggers the PDF generation, and sends an email.
     - **Dynamic pages** to view and edit an existing quote (`/moving/[id]/page.tsx`, `/moving/[id]/edit.tsx`, and the equivalent for cleaning).
   - The **Administrator Dashboard** must include several tabs:
     - **Home** for a general overview.
     - **Quotes** for complete management of quotes.
     - **Payments** for managing and tracking transactions.
     - **Users/Clients** for optionally managing client data.
     - **Reports** for generating and visualizing statistics.
     - **Settings** for application configuration.

2. **API Routes:**
   - Each service module (moving and cleaning) must have REST routes for:
     - Creating and retrieving quotes (GET/POST).
     - Managing an individual quote via a dynamic parameter (GET/PUT/DELETE).
     - A specific endpoint for payment which, once triggered, will generate a PDF (using the `generatePDF.ts` function) and send the quote by email (via `sendEmail.ts`).
   - Optionally, centralize PDF generation and email sending in dedicated endpoints (`/api/pdf` and `/api/email`).

3. **Utility Features:**
   - The **generatePDF.ts** function must create a PDF document containing all the quote information (service details, client information, deposit paid).
   - The **sendEmail.ts** function must send the PDF by email to the client with a personalized message.
   - The **lib/api.ts** library must centralize calls to internal APIs to facilitate front-end/back-end integration.

4. **Technical and Production Guidelines:**
   - The application must be designed for production deployment on **Vercel**: ensure that the configuration (e.g., `next.config.js`) is optimized for Vercel.
   - Use `"use client"` only on pages that require client-side interactions (forms, redirects, etc.).
   - Maintain a clear separation between server logic (API Routes, PDF generation, email sending) and client logic (interfaces, forms).
   - Briefly document in french critical components and functions to facilitate maintenance.

---

**Expected Project Structure:**

my-app/ │── public/
│── src/ │ ├── app/
│ │ ├── layout.tsx // Global Layout │ │ ├── page.tsx // Home page with service selection │ │ ├── moving/ // Moving Module │ │ │ ├── page.tsx // List of moving quotes │ │ │ ├── new.tsx // Quote creation form for moving │ │ │ ├── summary.tsx // Summary page for moving │ │ │ ├── payment.tsx // Payment page (30% deposit) for moving │ │ │ ├── success.tsx // Confirmation page after successful payment │ │ │ ├── [id]/ // Quote details and editing │ │ │ │ ├── page.tsx // Quote view │ │ │ │ ├── edit.tsx // Quote editing │ │ ├── cleaning/ // Cleaning Module (structure identical to "moving") │ │ │ ├── page.tsx
│ │ │ ├── new.tsx
│ │ │ ├── summary.tsx
│ │ │ ├── payment.tsx
│ │ │ ├── success.tsx
│ │ │ ├── [id]/
│ │ │ │ ├── page.tsx
│ │ │ │ ├── edit.tsx
│ │ ├── dashboard/ // Administrator Dashboard │ │ │ ├── page.tsx // Dashboard Home │ │ │ ├── quotes.tsx // Quotes tab (complete list of quotes) │ │ │ ├── payments.tsx // Payments tab (transaction management) │ │ │ ├── users.tsx // Users/Clients tab (optional) │ │ │ ├── reports.tsx // Reports and statistics tab │ │ │ ├── settings.tsx // Application Settings tab │ │ ├── api/ // API Routes │ │ │ ├── moving/ │ │ │ │ ├── route.ts // GET/POST endpoints for moving quotes │ │ │ │ ├── [id]/route.ts // GET/PUT/DELETE endpoints for an individual moving quote │ │ │ │ ├── payment/route.ts // POST endpoint to handle payment, PDF generation, and email sending for moving │ │ │ ├── cleaning/ │ │ │ │ ├── route.ts // GET/POST endpoints for cleaning quotes │ │ │ │ ├── [id]/route.ts // GET/PUT/DELETE endpoints for an individual cleaning quote │ │ │ │ ├── payment/route.ts // POST endpoint to handle payment for cleaning │ │ │ ├── pdf/route.ts // (Optional) Endpoint for centralized PDF generation │ │ │ ├── email/route.ts // (Optional) Endpoint for centralized email sending │ ├── components/
│ │ ├── Button.tsx // Reusable Button Component │ │ ├── Form.tsx // Reusable Form Component │ │ ├── QuoteSummary.tsx // Component displaying a quote summary │ │ ├── PaymentForm.tsx // Payment form component │ │ ├── DashboardTable.tsx // Table component for displaying Dashboard data │ ├── lib/
│ │ ├── api.ts // Utility functions for calling internal APIs │ │ ├── generatePDF.ts // Function to generate a PDF of the quote │ │ ├── sendEmail.ts // Function to send an email with the quote attached as a PDF │ ├── styles/
│ │ ├── globals.css // Global CSS file including Tailwind │── .eslintrc.json
│── next.config.js
│── package.json
│── tailwind.config.ts
│── tsconfig.json
│── README.md
