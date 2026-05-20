export const TEST_USERS = {
  VALID_USER: {
    username: process.env.VALID_USER_USERNAME || 'johnallen@yopmail.com',
    password: process.env.VALID_USER_PASSWORD || '123456789123',
    firstName: 'John',
    lastName: 'Doe',
  },

  MOBILE_USER: {
    username: process.env.MOBILE_USER_USERNAME || 'emily.johnson@yopmail.com',
    password: process.env.MOBILE_USER_PASSWORD || '12345678',
    firstName: 'Emily',
    lastName: 'Johnson',
  },

  // TODO: Add invalid user data here
  // INVALID_USER: {
  //   username: process.env.INVALID_USER_USERNAME || 'invalid@example.com',
  //   password: process.env.INVALID_USER_PASSWORD || 'WrongPassword123!',
  // },

  // TODO: Add admin user data here
  ADMIN_USER: {
    username: process.env.ADMIN_USER_USERNAME || 'johnallen@yopmail.com',
    password: process.env.ADMIN_USER_PASSWORD || '123456789123',
    role: 'admin',
  },
};

export const URLS = {
  LOGIN: '/login',
  DASHBOARD: '/home',
  HOME: '/home',
  PROFILE: '/profile',
  SETTINGS: '/settings',
};

export const MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGIN_ERROR: 'Invalid credentials',
  REQUIRED_FIELD: 'This field is required',
};

export const VALIDATION_MESSAGES = {
  // Login/Authentication
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PASSWORD: 'Password must be at least 8 characters',
  LOGIN_FAILED: 'Invalid username or password',

  // Form Validation
  REQUIRED_FIELD: 'This field is required',
  INVALID_FORMAT: 'Invalid format',
  INVALID_DATE: 'Please enter a valid date',
  INVALID_TIME: 'Please enter a valid time',

  // Success Messages
  SAVE_SUCCESS: 'Saved successfully',
  UPDATE_SUCCESS: 'Updated successfully',
  DELETE_SUCCESS: 'Deleted successfully',

  // Error Messages
  NETWORK_ERROR: 'Network error occurred',
  SERVER_ERROR: 'Server error occurred',
  UNAUTHORIZED: 'Unauthorized access',

  // Master Schedule Specific
  PATIENT_REQUIRED: 'Please select a patient',
  SHIFT_NAME_REQUIRED: 'Shift name is required',
  EMPLOYEE_REQUIRED: 'Please select an employee',
  INVALID_DATE_RANGE: 'End date must be after start date',

  // Recurring Schedule Failures
  SCHEDULE_CREATION_FAILED: 'Failed to create recurring schedule',
  SCHEDULE_UPDATE_FAILED: 'Failed to update recurring schedule',
  SCHEDULE_DELETE_FAILED: 'Failed to delete recurring schedule',
  SCHEDULE_CONFLICT: 'Schedule conflicts with existing shifts',
  EMPLOYEE_UNAVAILABLE: 'Employee is not available during selected time',
  PATIENT_INACTIVE: 'Patient is inactive or not eligible',
  INVALID_RECURRING_PATTERN: 'Invalid recurring pattern selected',
  SCHEDULE_NOT_FOUND: 'Recurring schedule not found',
  DUPLICATE_SCHEDULE: 'A schedule with these details already exists',
  VALIDATION_ERRORS: 'Please correct validation errors before proceeding',

  // Time Validation (from ReusableMethod.ts)
  INVALID_TIME_FORMAT: 'Invalid time format',
  INVALID_24HOUR_FORMAT: 'Invalid 24-hour time format',

  // General Validation
  SELECT_REQUIRED: 'Please select an option',
  FIELD_TOO_SHORT: 'Field is too short',
  FIELD_TOO_LONG: 'Field is too long',
  INVALID_NUMBER: 'Please enter a valid number',
  DUPLICATE_ENTRY: 'This entry already exists',
};

export const TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 30000,
};
