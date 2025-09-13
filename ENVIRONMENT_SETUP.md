# Environment Setup Guide

The report generator system requires several environment variables to function properly. Here's how to set them up:

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Commerce7 API Configuration
C7_APP_ID=your_commerce7_app_id
C7_API_KEY=your_commerce7_api_key
C7_TENANT_ID=your_commerce7_tenant_id

# Supabase Configuration
SUPABASE_SERVICE_KEY=your_supabase_service_key
NEXT_PUBLIC_SUPABASE_URL=https://ggfpkczvvnubjiuiqllv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Configuration (Gmail SMTP)
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password

# AI Configuration (Anthropic Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Setting Up Gmail App Password

1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Use this password as `EMAIL_APP_PASSWORD`

## Setting Up Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in to your account
3. Navigate to API Keys
4. Create a new API key
5. Copy the key to `ANTHROPIC_API_KEY`

## Testing the Setup

Once you've created the `.env.local` file:

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Test the email configuration:
   ```bash
   node test-send-endpoint.js
   ```

3. Test the report generator:
   ```bash
   node test-report-generator.js
   ```

## Common Issues

### "Email configuration missing" Error
- Make sure `EMAIL_USER` and `EMAIL_APP_PASSWORD` are set
- Verify your Gmail app password is correct
- Check that 2-factor authentication is enabled on your Gmail account

### "Anthropic API key is missing" Error
- Make sure `ANTHROPIC_API_KEY` is set
- Verify the API key is valid and has credits
- Check your Anthropic account billing

### "Commerce7 configuration" Error
- Make sure all Commerce7 variables are set
- Verify your API keys are valid
- Check your Commerce7 account status

### API Returns HTML Instead of JSON
- Make sure the development server is running on the correct port
- Check that the `.env.local` file exists and is properly formatted
- Restart the development server after adding environment variables

## Security Notes

- Never commit `.env.local` to version control
- Use app passwords instead of your main Gmail password
- Rotate API keys regularly
- Keep your environment variables secure

## Optional Configuration

Some features are optional and the system will work without them:

- **AI Insights**: If `ANTHROPIC_API_KEY` is missing, reports will be sent without AI analysis
- **Email Service**: If email variables are missing, you can still generate reports but not send them
- **Commerce7**: Required for data fetching, system won't work without these

## Troubleshooting

If you're still having issues:

1. Check the server logs for specific error messages
2. Verify all environment variables are set correctly
3. Test individual services (email, AI, Commerce7) separately
4. Make sure your API keys have the necessary permissions
