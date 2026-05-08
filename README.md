# Playwright Testing Framework

A modern, comprehensive testing framework built with Playwright and TypeScript.

## 📁 Project Structure

```
playwright-testing-framework/
├── 📂 src/                     # Source code
│   ├── 📂 pageObjects/         # Page Object Model classes
│   │   ├── BasePage.ts         # Base page with common methods
│   │   └── LoginPage.ts        # Login page implementation
│   └── 📂 helpers/             # Utility functions
│       └── TestHelpers.ts      # Test utility functions
├── 📂 tests/                   # Test files
│   ├── 📂 e2e/                 # End-to-end tests
│   │   └── login.spec.ts      # Login E2E tests
│   ├── 📂 integration/         # Integration tests
│   │   └── api.spec.ts         # API integration tests
│   └── 📂 unit/                # Unit tests
│       └── helpers.spec.ts     # Helper function tests
├── 📂 data/                    # Test data
│   └── 📂 testData/            # Test data files
│       └── testData.ts         # Test users and configurations
├── 📂 config/                  # Configuration files
├── 📂 reports/                 # Test reports
│   ├── 📂 screenshots/          # Test screenshots
│   └── 📂 videos/              # Test videos
├── playwright.config.ts        # Playwright configuration
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
├── .eslintrc.js               # ESLint configuration
└── .prettierrc                # Prettier configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npm run test:install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## 🧪 Running Tests

### Basic Commands
- **Run all tests:** `npm test`
- **Run tests in headed mode:** `npm run test:headed`
- **Run tests in debug mode:** `npm run test:debug`
- **View test report:** `npm run test:report`

### Test Categories
- **E2E tests:** `npm run test:e2e`
- **Integration tests:** `npm run test:integration`
- **Unit tests:** `npm run test:unit`

### CI/CD
- **CI mode:** `npm run test:ci` (with JUnit reporter)

## 🛠️ Development Tools

### Code Quality
- **Lint code:** `npm run lint`
- **Fix linting issues:** `npm run lint:fix`
- **Format code:** `npm run format`
- **Type checking:** `npm run type-check`

## 📋 Architecture

### Page Object Model (POM)
The framework uses the Page Object Model pattern to separate test logic from page interactions:
- `BasePage` - Contains common page methods
- `LoginPage` - Specific login page implementation

### Test Organization
- **E2E Tests:** Complete user workflows
- **Integration Tests:** API and component interactions
- **Unit Tests:** Helper function validation

### Configuration Management
- Environment-specific configurations in `config/environments/`
- Test data centralized in `data/testData/`
- Flexible reporting with multiple formats

## 📊 Reporting

Tests generate comprehensive reports including:
- HTML reports with visual artifacts
- Screenshots on failure
- Video recordings
- JSON and JUnit reports for CI/CD

## 🔧 Configuration

### Environment Variables
Key environment variables:
- `BASE_URL` - Application base URL
- `API_BASE_URL` - API base URL
- `HEADED` - Run tests in headed mode
- `TIMEOUT` - Test timeout in milliseconds

### Playwright Config
Main configuration supports:
- Multiple browsers (Chrome, Firefox, Safari)
- Parallel test execution
- Custom reporters
- Retry on failure

## 🤝 Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Run linting and type checking before commits

## 📚 Documentation

- [Playwright Documentation](https://playwright.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Page Object Pattern](https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/)
"# CareBoarding-e2e-playwright" 
