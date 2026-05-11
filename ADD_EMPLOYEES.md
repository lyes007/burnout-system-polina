# Adding Employees to the Dashboard

## ✅ Dashboard is Working!

Your dashboard is running correctly, but it's empty because there are no employees in the database yet.

## How to Add Employees

### Option 1: Through the UI (Recommended)

1. **Navigate to Employees Page**:
   - Click on "Employees" in the sidebar
   - Or go to: `http://localhost:3000/employees`

2. **Add a New Employee**:
   - Click the "Add Employee" button
   - Fill in the form:
     - Employee ID (e.g., "EMP001")
     - Name (e.g., "John Doe")
     - Email (e.g., "john.doe@company.com")
     - Gender: Male or Female
     - Company Type: Service or Product
     - WFH Setup Available: Yes or No
     - Designation: 1.0, 2.0, 3.0, etc.
     - Resource Allocation: 1.0 to 10.0
     - Mental Fatigue Score: 0.0 to 10.0
     - Date of Joining: Select a date

3. **Get Prediction**:
   - The system will automatically predict the burnout risk
   - You'll see the burn rate and risk level

4. **Save**:
   - Click "Save Employee"
   - The employee will appear in the list

### Option 2: Initialize Database First

If you haven't initialized the database tables yet:

1. Visit: `http://localhost:3000/api/init-db`
2. This will create the necessary tables
3. Then add employees through the UI

## Sample Employee Data

Here are some example employees you can add:

**Employee 1 - High Risk:**
- Employee ID: EMP001
- Name: John Smith
- Email: john.smith@company.com
- Gender: Male
- Company Type: Service
- WFH Setup: No
- Designation: 3.0
- Resource Allocation: 8.0
- Mental Fatigue Score: 8.5
- Date of Joining: 2020-01-15

**Employee 2 - Low Risk:**
- Employee ID: EMP002
- Name: Jane Doe
- Email: jane.doe@company.com
- Gender: Female
- Company Type: Product
- WFH Setup: Yes
- Designation: 2.0
- Resource Allocation: 4.0
- Mental Fatigue Score: 3.0
- Date of Joining: 2021-06-01

**Employee 3 - Medium Risk:**
- Employee ID: EMP003
- Name: Bob Johnson
- Email: bob.johnson@company.com
- Gender: Male
- Company Type: Service
- WFH Setup: Yes
- Designation: 2.5
- Resource Allocation: 6.0
- Mental Fatigue Score: 5.5
- Date of Joining: 2019-03-20

## After Adding Employees

Once you add employees:
- The dashboard will show statistics
- You can view analytics
- Alerts will show high-risk employees
- You can edit employee details
- Predictions update automatically

## Troubleshooting

### "Cannot add employee" error
- Make sure the API server is running (`http://localhost:8000`)
- Check that the database is initialized
- Verify `.env.local` has correct `POSTGRES_URL`

### Predictions not working
- Ensure Python API is running
- Check `MODEL_API_URL=http://localhost:8000` in `.env.local`
- Verify model files exist (`lightgbm_model.pkl`, `preprocessor.pkl`)

### Database errors
- Visit `/api/init-db` to create tables
- Check database connection in `.env.local`




