# Update UTR Ratings via API (No Shell Access Required)

Since Render's free plan doesn't include shell access, you can update UTR ratings by calling an HTTP endpoint instead.

## Step 1: Get Your Authentication Token

1. **Log in to your app** in the browser
2. **Open browser DevTools** (F12 or right-click → Inspect)
3. **Go to Application/Storage tab** → Local Storage
4. **Find the `token` key** and copy its value

OR

Use your login credentials to get a token via the API:

```bash
curl -X POST https://your-backend-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'
```

Copy the `token` from the response.

## Step 2: Call the Historical Rating Calculation Endpoint

### Option A: Using cURL (Command Line)

```bash
curl -X POST https://your-backend-url.onrender.com/api/ratings/calculate-historical \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

Replace:
- `your-backend-url.onrender.com` with your actual backend URL
- `YOUR_TOKEN_HERE` with the token you copied in Step 1

### Option B: Using Postman or Insomnia

1. **Method**: POST
2. **URL**: `https://your-backend-url.onrender.com/api/ratings/calculate-historical`
3. **Headers**:
   - `Authorization`: `Bearer YOUR_TOKEN_HERE`
   - `Content-Type`: `application/json`
4. **Body**: (empty, or `{}`)

### Option C: Using Browser Console

Open your browser console on your app and run:

```javascript
fetch('https://your-backend-url.onrender.com/api/ratings/calculate-historical', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error('Error:', err));
```

## Step 3: Wait for Response

The endpoint will process all historical sets and return a summary:

```json
{
  "success": true,
  "message": "Historical rating calculation completed",
  "summary": {
    "totalSets": 26,
    "processedSets": 26,
    "usersWithRatings": 7,
    "averageRating": "1.30",
    "topPlayers": [
      {
        "name": "Remco B",
        "rating": "1.82"
      },
      {
        "name": "Olle Dommerholt",
        "rating": "1.71"
      },
      ...
    ]
  }
}
```

## Important Notes

- **This may take a few minutes** depending on how many sets you have
- **Don't close the browser/tab** while it's running (if using browser console)
- **Safe to re-run** - it recalculates everything from scratch
- **After this**, new sets will automatically update ratings

## Troubleshooting

### "Unauthorized" Error
- Make sure you're using a valid authentication token
- Token might have expired - log in again to get a new token

### Request Times Out
- For large datasets, the request might take longer than typical timeout limits
- Consider running during off-peak hours
- The calculation continues on the server even if the request times out

### "Failed to calculate historical ratings"
- Check your server logs in Render dashboard
- Make sure your database connection is working
- Verify that sets exist in your database

## Alternative: One-Time Script on Deployment

If you prefer, you can also modify your deployment to run this automatically once. However, this is not recommended as it would recalculate on every deployment.

