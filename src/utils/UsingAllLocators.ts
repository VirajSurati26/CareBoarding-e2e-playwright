// UsingAllLocators.ts - Consolidated locators from all page objects

export const LOGIN_SELECTORS = {
  usernameInput: 'input[type="email"], input[name="username"], input[id="email"], input[name="email"]',
  passwordInput: 'input[type="password"], input[name="password"]',
  loginButton: 'button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), input[type="submit"]',
  errorMessage: '.error-message, .alert-danger, [role="alert"], .notification-error',
  loginForm: 'form, .login-form, #login-form',
};

export const EMPLOYEE_SELECTORS = {
  loadingOverlay: '.loading-overlay.is-active',
  navLinkEmployees: 'a.nav-link',
  searchEmployeeBtn: 'text=Search Employee',
  employeeTableRow: 'table tbody tr',
  calendarBtn: 'text=Calendar',
  inTimeInput: 'input[name="in_time"]',
  outTimeInput: 'input[name="out_time"]',
  patientDropdown: '#select2-patientIdVal-container',
  payRateDropdown: 'span[id*="select2-pay_rate"]',
  pocDropdown: 'span[id*="select2-poc"]',
  serviceCodeDropdown: 'span[id*="select2-service_code"]',
  createButton: '#changeStatusFormSubBtn',
  swalConfirm: '.swal2-confirm',
  swalContainer: '.swal2-html-container',
  select2ResultsOption: '.select2-results__option',
  calendarDay: (day: number | string) => `.fc-daygrid-day-number:text-is("${day}"), .fc-day-number:text-is("${day}")`,
  calendarTimeCell: '.fc-event, .fc-daygrid-event, .fc-event-title',
};

export const CHANGE_ENTITY_SELECTORS = {
  entityDropdown: '#select2-entity-container',
  entityOptions: '.select2-results__option',
  confirmationButton: 'button:has-text("Yes, Change Entity")',
  searchField: 'input.select2-search__field',
};

export const MASTER_SCHEDULE_SELECTORS = {
  // Patient selection
  patientName: (patientName: string) => `text=${patientName}`,
  recurringScheduleMenu: 'text=Recurring Schedule',
  selectPatientSpan: 'span.select2-selection__rendered:has-text("Select Patient")',
  patientSearchInput: 'input.select2-search__field',
  patientSearchResult: '.select2-results__option',
  searchButton: 'button:has-text("Search")',
  
  // Add Recurring Schedule
  addRecurringScheduleButton: 'text=Add Recurring Schedule',
  
  // Recurring Period
  weeklyOption: 'text=Weekly',
  monthlyOption: 'text=Monthly',
  
  // Shift Details
  shiftNameInput: 'input[name="shift_name"]',
  startDateInput: 'input[name="from_date"]',
  timeInputs: 'input[type="time"]',
  
  // Master Week Schedule Dropdowns
  employeeDropdown: 'select[name="is_whole_week_caregiver"] + .select2-container .select2-selection__rendered',
  payRateDropdown: 'select[name="is_whole_week_pay_rate"] + .select2-container .select2-selection__rendered',
  pocDropdown: 'select[name="is_whole_week_poc"] + .select2-container .select2-selection__rendered',
  serviceCodeDropdown: 'select[name="is_whole_week_service_code"] + .select2-container .select2-selection__rendered',
  
  // Copy Schedule
  everyDayCheckbox: 'label[for="sametime"]',
  
  // Save
  saveButton: '#savefrm',
};

export const SELECT2_SELECTORS = {
  container: '.select2-container',
  rendered: '.select2-selection__rendered',
  searchField: 'input.select2-search__field',
  resultsOption: '.select2-results__option',
  dropdownOpen: '.select2-dropdown--open',
};

export const COMMON_SELECTORS = {
  // General form elements
  input: 'input',
  button: 'button',
  select: 'select',
  textarea: 'textarea',
  
  // Common interactions
  clickable: '[role="button"], button, a[href]',
  visible: ':visible',
  enabled: ':enabled',
  disabled: ':disabled',
  
  // Timeouts and waits
  defaultTimeout: 5000,
  shortTimeout: 1000,
  mediumTimeout: 2000,
  longTimeout: 10000,
};

export const LOCATOR_STRATEGIES = {
  // By text
  text: (text: string) => `text=${text}`,
  hasText: (text: string) => `:has-text("${text}")`,
  
  // By attributes
  byId: (id: string) => `#${id}`,
  byClass: (className: string) => `.${className}`,
  byName: (name: string) => `[name="${name}"]`,
  byType: (type: string) => `[type="${type}"]`,
  
  // By position
  first: () => ':first-child',
  last: () => ':last-child',
  nth: (index: number) => `:nth-child(${index})`,
  
  // Combined selectors
  inputByName: (name: string) => `input[name="${name}"]`,
  buttonByText: (text: string) => `button:has-text("${text}")`,
  linkByText: (text: string) => `a:has-text("${text}")`,
};

// Export all locators as a single object for easy access
export const ALL_LOCATORS = {
  LOGIN: LOGIN_SELECTORS,
  EMPLOYEE: EMPLOYEE_SELECTORS,
  CHANGE_ENTITY: CHANGE_ENTITY_SELECTORS,
  MASTER_SCHEDULE: MASTER_SCHEDULE_SELECTORS,
  SELECT2: SELECT2_SELECTORS,
  COMMON: COMMON_SELECTORS,
  STRATEGIES: LOCATOR_STRATEGIES,
};