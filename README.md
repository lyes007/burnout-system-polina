# HR Dashboard - Employee Burnout Management

A Next.js application for HR teams to manage and predict employee burnout risk using machine learning.

## Features

- 📊 **Dashboard Overview**: View key metrics, risk distribution, and alerts
- 👥 **Employee Management**: Add, view, edit, and delete employees
- 🤖 **AI Predictions**: Real-time burnout risk predictions using LightGBM model
- 📈 **Analytics**: Interactive charts and insights
- 🚨 **Alerts**: High-risk employee notifications
- 💾 **Database**: PostgreSQL (Neon) for data persistence

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Neon)
- **ML Model**: LightGBM (ONNX format)
- **Charts**: Recharts
- **UI Components**: Custom components with Tailwind

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Neon PostgreSQL database (or any PostgreSQL database)
- Trained LightGBM model in ONNX format

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file:
   ```env
   DATABASE_URL="your-neon-database-url"
   ```

3. **Initialize database**:
   - Start the dev server: `npm run dev`
   - Visit: `http://localhost:3000/api/init-db`
   - This creates the necessary tables

4. **Set up the ML model**:
   - See `MODEL_SETUP.md` for detailed instructions
   - Convert your LightGBM model to ONNX format
   - Place the ONNX model at: `public/models/burnout_model.onnx`

5. **Run the application**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
hr-dashboard/
├── app/
│   ├── (dashboard)/          # Dashboard pages
│   │   ├── page.tsx          # Home dashboard
│   │   ├── employees/        # Employee management
│   │   ├── analytics/        # Analytics page
│   │   └── alerts/           # Alerts page
│   ├── api/                   # API routes
│   │   ├── employees/        # Employee CRUD
│   │   ├── predict/          # Prediction endpoint
│   │   ├── analytics/        # Analytics data
│   │   └── alerts/           # Alerts data
│   └── layout.tsx            # Root layout
├── components/                # React components
│   ├── ui/                   # UI components
│   ├── EmployeeCard.tsx
│   ├── EmployeeForm.tsx
│   └── RiskBadge.tsx
├── lib/
│   ├── db.ts                 # Database connection
│   └── model/                # ML model integration
│       ├── onnx-predictor.ts
│       └── preprocessor.ts
├── scripts/                   # Utility scripts
│   ├── convert-model.py     # Model conversion
│   └── notebook-helper.py   # Notebook utilities
└── types/                     # TypeScript types
```

## API Endpoints

- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `GET /api/employees/[id]` - Get employee by ID
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee
- `POST /api/predict` - Predict burnout risk
- `GET /api/analytics` - Get analytics data
- `GET /api/alerts` - Get high-risk employees
- `GET /api/init-db` - Initialize database tables

## Model Setup

The application requires a trained LightGBM model in ONNX format. See `MODEL_SETUP.md` for detailed instructions on:

- Saving the model from your Jupyter notebook
- Converting to ONNX format
- Setting up preprocessing
- Verifying predictions

## Database Schema

The application uses two main tables:

- `employees`: Stores employee information
- `burnout_predictions`: Stores prediction history

See `scripts/seed-db.sql` for the schema.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Notes

- The preprocessing is simplified for development. For production accuracy, implement the exact preprocessing from your trained model.
- The app currently has no authentication. Add authentication as needed for production use.
- Model predictions require the ONNX model file. The app will show errors if the model is missing.

## Troubleshooting

See `SETUP.md` for common issues and solutions.

## License

MIT
