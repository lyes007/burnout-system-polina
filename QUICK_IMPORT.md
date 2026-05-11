# Quick Import - Populate Database

## Import Data from Training Dataset

To populate your database with employees from the training dataset:

### Option 1: Browser (Easiest)

Open this URL in your browser:
```
http://localhost:3000/api/import-data?limit=100
```

Change `limit=100` to import more or fewer records:
- `?limit=50` - Import 50 employees
- `?limit=200` - Import 200 employees
- `?limit=500` - Import 500 employees (max: 1000)

### Option 2: PowerShell

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/import-data?limit=100" -Method POST
```

### Option 3: Browser Developer Console

Open browser console (F12) and run:
```javascript
fetch('/api/import-data?limit=100', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

## What Happens

1. Reads `DATASET 1/train.csv`
2. Creates employee records
3. Makes predictions using your trained model
4. Saves everything to the database

## After Import

Refresh your dashboard and you'll see:
- ✅ Employees in the list
- ✅ Statistics and charts
- ✅ Risk levels and predictions
- ✅ Analytics data

## Recommended

Start with 100 employees:
```
http://localhost:3000/api/import-data?limit=100
```

Then you can import more if needed!




