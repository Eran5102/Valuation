# Testing Documentation

## Overview

The 409A Valuation Platform has comprehensive test coverage across unit, integration, and end-to-end tests.

## Test Structure

```
tests/
├── unit/              # Unit tests for utilities and business logic
├── integration/       # API route integration tests
├── e2e/              # End-to-end test scenarios
└── fixtures/         # Test data and mocks

src/
├── lib/__tests__/    # Unit tests for lib functions
├── components/
│   └── ui/__tests__/ # Component unit tests
└── app/
    └── api/
        └── */__tests__/ # API route tests
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Debug mode
npm run test:debug
```

### Integration Tests

```bash
# Run API integration tests
npm run test:integration

# Test specific API routes
npm run test:api
```

### End-to-End Tests

```bash
# Install Playwright browsers (first time)
npx playwright install

# Run E2E tests
npm run test:e2e

# Interactive mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Test Coverage

### Current Coverage Targets

- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 60%
- **Statements**: 60%

### View Coverage Report

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html
```

### Coverage Areas

#### High Priority (80%+ coverage)

- Business logic (`lib/capTableCalculations.ts`)
- API route handlers
- Critical UI components
- Validation utilities

#### Medium Priority (60%+ coverage)

- Form components
- Data transformations
- Error handling

#### Low Priority (40%+ coverage)

- UI utilities
- Style helpers
- Dev tools

## Writing Tests

### Unit Test Example

```typescript
import { calculateAmountInvested } from '@/lib/capTableCalculations'

describe('calculateAmountInvested', () => {
  it('should calculate correctly', () => {
    const shareClass = {
      sharesOutstanding: 1000,
      pricePerShare: 10,
    }

    expect(calculateAmountInvested(shareClass)).toBe(10000)
  })
})
```

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

describe('LoadingSpinner', () => {
  it('should render with label', () => {
    render(<LoadingSpinner label="Loading..." />)

    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Loading...'
    )
  })
})
```

### API Test Example

```typescript
import { GET } from '@/app/api/valuations/route'

describe('GET /api/valuations', () => {
  it('should return valuations', async () => {
    const response = await GET(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('should create valuation', async ({ page }) => {
  await page.goto('/valuations/new')
  await page.fill('input[name="company"]', 'Test Corp')
  await page.click('button:has-text("Save")')

  await expect(page).toHaveURL(/\/valuations\/[\w-]+/)
})
```

## Test Data Management

### Fixtures

Test data is stored in `tests/fixtures/`:

- `companies.json` - Sample company data
- `valuations.json` - Sample valuation data
- `users.json` - Test user accounts

### Database Seeding

For integration tests:

```bash
# Seed test database
npm run db:seed:test

# Reset test database
npm run db:reset:test
```

## Mocking

### Supabase Client

```typescript
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    // ... other methods
  }),
}))
```

### External APIs

```typescript
jest.mock('@/lib/external-api', () => ({
  fetchTreasuryRates: jest.fn().mockResolvedValue({
    rates: [2.5, 3.0, 3.5],
  }),
}))
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run validate"
    }
  }
}
```

## Performance Testing

### Load Testing

```bash
# Run load tests
npm run test:load

# Stress test API
npm run test:stress
```

### Performance Metrics

- Page load time: < 3s
- API response time: < 500ms
- Virtual scroll FPS: > 30

## Debugging Tests

### VS Code Configuration

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

### Chrome DevTools

```bash
# Debug with Chrome DevTools
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Use clear, descriptive test names
3. **AAA Pattern**: Arrange, Act, Assert
4. **Mock External Dependencies**: Don't hit real APIs in tests
5. **Test Edge Cases**: Include boundary and error conditions
6. **Keep Tests Simple**: One assertion per test when possible
7. **Use Test IDs**: Add data-testid for E2E tests
8. **Cleanup**: Always cleanup after tests

## Troubleshooting

### Common Issues

#### Tests Timing Out

- Increase timeout: `jest.setTimeout(10000)`
- Check async operations are properly awaited

#### Module Resolution Errors

- Check `moduleNameMapper` in jest.config.js
- Ensure paths match tsconfig.json

#### Coverage Not Updating

- Clear cache: `npm run test:debug`
- Check `collectCoverageFrom` patterns

#### E2E Tests Failing

- Ensure dev server is running
- Check Playwright browsers are installed
- Verify selectors are correct

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
