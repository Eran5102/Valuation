# 409A Valuation Platform 📊

A professional-grade web application for managing 409A valuations, cap tables, and financial assessments. Built with Next.js 15, TypeScript, and Supabase for enterprise-level performance and reliability.

## 🚀 Features

### Core Functionality
- **409A Valuations**: Complete valuation workflow with 100+ configurable assumption fields
- **Cap Table Management**: Dynamic cap table with multiple share classes and option pools
- **Waterfall Analysis**: Advanced liquidation preference calculations with participation rights
- **Breakpoint Analysis**: Comprehensive ownership dilution and exit scenarios
- **DLOM Models**: Multiple models including Black-Scholes, Finnerty, Longstaff, and Ghaidarov
- **Report Generation**: Automated PDF reports with customizable templates and field mapping
- **Field Mapping System**: Flexible configuration for different valuation methodologies

### Technical Features
- **Real-time Data Sync**: Powered by Supabase PostgreSQL with JSONB for flexible data
- **Type-Safe Development**: Full TypeScript implementation with strict mode
- **Performance Optimized**:
  - Virtual scrolling for large datasets
  - Code splitting and lazy loading
  - LRU caching and memoization
  - Web Vitals monitoring
  - 25+ database indexes for query optimization
- **Component Library**: Reusable UI components following DRY principles
- **Error Handling**: Comprehensive error boundaries and consistent error states
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Enterprise Security**: Row-level security, encrypted transmission, input validation

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5.3, React 19.1.0, TypeScript 5
- **Database**: Supabase (PostgreSQL with JSONB support)
- **Styling**: Tailwind CSS 3.4, Radix UI components
- **Testing**: Jest, React Testing Library
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

## 📋 Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- Supabase account (free tier works)
- Git for version control

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/409a-valuation-app.git
cd 409a-valuation-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Set Up Database
Run the migrations in your Supabase SQL editor:
```bash
# Navigate to supabase/migrations directory
# Run each .sql file in order through Supabase dashboard
```

### 5. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:4000](http://localhost:4000) to see the application.

## 📁 Project Structure

```
409a-valuation-app/
├── src/
│   ├── app/              # Next.js 15 app router pages
│   ├── components/       # Reusable React components
│   │   ├── ui/          # Base UI components
│   │   ├── valuation/   # Valuation-specific components
│   │   └── reports/     # Report generation components
│   ├── lib/             # Utility functions and services
│   │   ├── supabase/    # Database client configuration
│   │   ├── validation/  # Zod schemas and validation
│   │   └── utils/       # Helper functions
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   └── services/        # Business logic services
├── supabase/            # Database migrations and config
├── public/              # Static assets
├── docs/                # Documentation
└── scripts/             # Utility scripts
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run with Coverage
```bash
npm run test:coverage
```

### Run Specific Test Suite
```bash
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Run Production Build Locally
```bash
npm start
```

### Deploy to Vercel
```bash
vercel deploy
```

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript compiler check
- `npm run validate` - Run all checks (types, lint, format, tests)

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit `.env.local` file
2. **Database Security**: Enable RLS policies in Supabase
3. **API Keys**: Use server-side API routes for sensitive operations
4. **Input Validation**: All forms use Zod schema validation
5. **Authentication**: Implement Supabase Auth (if needed)

## 📊 Performance Optimization

- **Code Splitting**: Dynamic imports for heavy components
- **Image Optimization**: Next.js Image component
- **Caching**: Response caching middleware
- **Bundle Analysis**: Run `npm run analyze` to check bundle size
- **Database Indexes**: Optimized queries with proper indexing

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style Guidelines
- Follow the existing code patterns
- Use TypeScript strict mode
- Write tests for new features
- Document complex functions
- Keep components small and focused

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 4000
npx kill-port 4000
```

#### Database Connection Issues
- Verify Supabase URL and keys in `.env.local`
- Check if RLS policies are properly configured
- Ensure migrations have been run

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## 📜 License

This project is proprietary software. All rights reserved.

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: support@yourcompany.com

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for the backend infrastructure
- Radix UI for accessible components
- The open-source community

---

Built with ❤️ for financial professionals