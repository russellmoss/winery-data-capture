# 🍷 Winery Data Capture Analytics System

A comprehensive data capture analytics platform designed specifically for wineries using Commerce7. This system solves a critical gap in the wine industry by providing detailed insights into how well your tasting room team is capturing guest data - something no existing KPI dashboard currently offers.

## 🎯 **The Problem This Solves**

Most wineries struggle to understand their actual data capture performance because:

- **No existing KPI dashboards** that integrate with Commerce7 provide data capture rate analysis
- **Generic analytics tools** don't understand the unique needs of tasting room operations
- **Manual tracking** is time-consuming and often inaccurate
- **Team coaching** lacks specific, actionable metrics

## ✨ **What Makes This Different**

This system provides **actionable insights** that help you:

- **Track individual associate performance** in data capture
- **Identify coaching opportunities** with specific metrics
- **Measure the impact of training** with before/after comparisons
- **Optimize guest experience** by understanding capture patterns
- **Scale your team** with data-driven hiring decisions

## 🚀 **Key Features**

### 📊 **Comprehensive Analytics**
- **Associate Data Capture Rates** - Individual performance tracking
- **Company-wide Metrics** - Overall team performance
- **Wedding Lead Analysis** - Specialized metrics for event venues
- **Email Subscription Rates** - Marketing opt-in tracking
- **Year-over-Year Comparisons** - Growth and trend analysis

### 🎛️ **Flexible Configuration**
- **Wedding Feature Toggles** - Hide wedding metrics for wineries without event services
- **Customizable SKU Tracking** - Configure which products represent guest visits
- **Associate Name Matching** - Smart matching of orders to team members

### 📧 **Automated Reporting**
- **Email Reports** - Automated daily, weekly, and monthly summaries
- **CSV Exports** - Data export for further analysis
- **AI-Powered Insights** - Claude AI provides actionable recommendations
- **Visual Dashboards** - Charts and graphs for easy understanding

### 🔧 **Easy Integration**
- **Commerce7 API Integration** - Direct connection to your existing system
- **Supabase Backend** - Reliable, scalable database
- **Modern Tech Stack** - Next.js, TypeScript, Tailwind CSS

## 🛠️ **Tech Stack**

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **APIs**: Commerce7 REST API, Anthropic Claude AI
- **Email**: Nodemailer with Gmail integration
- **Charts**: Recharts for data visualization
- **Deployment**: Vercel-ready configuration

## 📋 **Prerequisites**

Before setting up the system, you'll need:

- **Commerce7 Account** with API access
- **Supabase Account** (free tier available)
- **Gmail Account** for email reports (or SMTP server)
- **Anthropic API Key** for AI insights (optional)
- **Node.js 18+** installed locally

## 🚀 **Quick Start**

### 1. Clone the Repository

```bash
git clone https://github.com/russellmoss/winery-data-capture.git
cd winery-data-capture
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Commerce7 Configuration
C7_APP_ID=your_commerce7_app_id_here
C7_API_KEY=your_commerce7_api_key_here
C7_TENANT_ID=your_commerce7_tenant_id_here

# Email Configuration
EMAIL_USER=your_email_user_here
EMAIL_APP_PASSWORD=your_email_app_password_here

# AI Configuration (Optional)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set Up Supabase Database

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create wedding feature settings table
CREATE TABLE IF NOT EXISTS wedding_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default wedding settings
INSERT INTO wedding_settings (setting_key, setting_value, description) VALUES
  ('show_wedding_metrics', true, 'Show wedding-related metrics in reports'),
  ('show_wedding_capture_rate', true, 'Show "Company Data Capture Rate Less Weddings" metric'),
  ('show_wedding_lead_profiles', true, 'Show "Wedding Lead Profiles" count'),
  ('show_wedding_subscription_rate', true, 'Show "Company Subscription Rate (No Weddings)" metric')
ON CONFLICT (setting_key) DO NOTHING;

-- Create guest count SKUs table
CREATE TABLE IF NOT EXISTS guest_count_skus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ **Project Structure**

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard pages
│   └── login/             # Authentication pages
├── components/            # Reusable React components
├── lib/                   # Utility libraries
│   ├── analytics/         # Data capture analytics
│   ├── commerce7/         # Commerce7 API integration
│   ├── email/             # Email service and templates
│   ├── supabase/          # Database client
│   └── settings/          # Configuration management
└── types/                 # TypeScript type definitions
```

## 📊 **Understanding the Metrics**

### **Data Capture Rate**
The percentage of guests who become profiles with contact information (email or phone).

### **Subscription Rate**
The percentage of captured guests who opt-in to email marketing.

### **Wedding Lead Analysis**
Specialized tracking for wineries offering event services, with options to exclude from main metrics.

### **Associate Performance**
Individual team member tracking to identify coaching opportunities and top performers.

## 🎛️ **Configuration Options**

### **Wedding Features**
Toggle wedding-related metrics on/off in Settings → Wedding Feature Settings:
- Company Data Capture Rate Less Weddings
- Wedding Lead Profiles count
- Company Subscription Rate (No Weddings)

### **Guest Count SKUs**
Configure which Commerce7 SKUs represent guest visits in Settings → Guest Count SKUs.

## 🚀 **Deployment**

### **Vercel Deployment**

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The project includes Vercel-optimized configuration files.

### **Environment Variables for Production**

Ensure all environment variables are set in your deployment platform, especially:
- Supabase credentials
- Commerce7 API keys
- Email configuration
- AI API keys (if using AI features)

## 🤝 **Contributing**

This project is designed to be easily customizable for different wineries. Common customizations include:

- **Custom metrics** - Add new analytics based on your specific needs
- **Branding** - Update colors, logos, and styling
- **Integration** - Connect to additional systems beyond Commerce7
- **Reporting** - Customize email templates and report formats

## 📞 **Support**

For questions about setup, customization, or integration:

1. Check the code comments for implementation details
2. Review the API documentation in `/src/app/api/`
3. Examine the analytics logic in `/src/lib/analytics/`

## 📄 **License**

This project is open source and available under the MIT License.

## 🙏 **Acknowledgments**

Built specifically for the wine industry to solve real operational challenges. Special thanks to the wineries that provided feedback during development.

---

**Ready to transform your tasting room data capture?** Clone this repository and start measuring what matters! 🍷✨