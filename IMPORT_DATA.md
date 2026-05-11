# Import Dataset to Database

## Quick Import

To populate your database with data from the training dataset, visit this URL in your browser:

```
http://localhost:3000/api/import-data?limit=100
```

Or use curl:
```bash
curl -X POST "http://localhost:3000/api/import-data?limit=100"
```

## What It Does

1. Reads `DATASET 1/train.csv`
2. Creates employee records in the database
3. Makes predictions using the Python API
4. Saves predictions to the database

## Parameters

- `limit`: Number of records to import (default: 100, max: 1000)
  - Example: `?limit=50` imports 50 employees
  - Example: `?limit=500` imports 500 employees

## Example

Import 100 employees:
```
http://localhost:3000/api/import-data?limit=100
```

Import 500 employees:
```
http://localhost:3000/api/import-data?limit=500
```

## After Import

Once imported, you'll see:
- Employees in the Employees page
- Statistics on the Dashboard
- Analytics data
- Alerts for high-risk employees

## Notes

- The import skips employees that already exist (by Employee ID)
- Missing values are handled automatically
- Each employee gets a prediction from the model
- The import may take a minute for large batches




