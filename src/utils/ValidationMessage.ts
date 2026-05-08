// ValidationMessage.ts - Centralized validation message handling and locators

import { VALIDATION_MESSAGES } from '../../data/testData/testData';

export const VALIDATION_SELECTORS = {
  // Error messages
  errorMessage: '.error-message, .alert-danger, [role="alert"], .notification-error',
  fieldError: '.field-error, .error-text, .validation-error',
  inputError: '.input-error, .has-error, .is-invalid',
  
  // Success messages  
  successMessage: '.success-message, .alert-success, .notification-success',
  toastSuccess: '.toast.success, .notification.success',
  
  // Warning messages
  warningMessage: '.warning-message, .alert-warning, .notification-warning',
  toastWarning: '.toast.warning, .notification.warning',
  
  // Info messages
  infoMessage: '.info-message, .alert-info, .notification-info',
  toastInfo: '.toast.info, .notification.info',
  
  // Validation states
  requiredField: '[required], .required, .is-required',
  invalidField: '.invalid, .is-invalid, [aria-invalid="true"]',
  validField: '.valid, .is-valid, [aria-invalid="false"]',
  
  // Form validation
  formGroup: '.form-group, .field-group',
  fieldLabel: 'label, .field-label',
  fieldHint: '.field-hint, .help-text, .form-text',
  
  // Common validation containers
  validationSummary: '.validation-summary, .error-summary',
  validationList: '.validation-list, .error-list',
};

export class ValidationHelper {
  constructor(private page: any) {}

  // Error message methods
  async getErrorMessage(): Promise<string | null> {
    return await this.page.textContent(VALIDATION_SELECTORS.errorMessage);
  }

  async getFieldError(): Promise<string | null> {
    return await this.page.textContent(VALIDATION_SELECTORS.fieldError);
  }

  async isErrorMessageVisible(): Promise<boolean> {
    return await this.page.isVisible(VALIDATION_SELECTORS.errorMessage);
  }

  async waitForErrorMessage(timeout: number = 5000): Promise<void> {
    await this.page.waitForSelector(VALIDATION_SELECTORS.errorMessage, { timeout });
  }

  // Success message methods
  async getSuccessMessage(): Promise<string | null> {
    return await this.page.textContent(VALIDATION_SELECTORS.successMessage);
  }

  async isSuccessMessageVisible(): Promise<boolean> {
    return await this.page.isVisible(VALIDATION_SELECTORS.successMessage);
  }

  async waitForSuccessMessage(timeout: number = 5000): Promise<void> {
    await this.page.waitForSelector(VALIDATION_SELECTORS.successMessage, { timeout });
  }

  // Warning message methods
  async getWarningMessage(): Promise<string | null> {
    return await this.page.textContent(VALIDATION_SELECTORS.warningMessage);
  }

  async isWarningMessageVisible(): Promise<boolean> {
    return await this.page.isVisible(VALIDATION_SELECTORS.warningMessage);
  }

  // Field validation methods
  async isFieldInvalid(fieldName: string): Promise<boolean> {
    const selector = `[name="${fieldName}"]${VALIDATION_SELECTORS.invalidField}`;
    return await this.page.isVisible(selector);
  }

  async isFieldValid(fieldName: string): Promise<boolean> {
    const selector = `[name="${fieldName}"]${VALIDATION_SELECTORS.validField}`;
    return await this.page.isVisible(selector);
  }

  async isFieldRequired(fieldName: string): Promise<boolean> {
    const selector = `[name="${fieldName}"]${VALIDATION_SELECTORS.requiredField}`;
    return await this.page.isVisible(selector);
  }

  // Form validation methods
  async getValidationSummary(): Promise<string[]> {
    const elements = await this.page.locator(VALIDATION_SELECTORS.validationList).all();
    const messages: string[] = [];
    
    for (const element of elements) {
      const text = await element.textContent();
      if (text) messages.push(text.trim());
    }
    
    return messages;
  }

  // Message validation with predefined messages
  async validateLoginError(): Promise<boolean> {
    const errorText = await this.getErrorMessage();
    return errorText?.includes(VALIDATION_MESSAGES.LOGIN_FAILED) || false;
  }

  async validateRequiredFieldError(): Promise<boolean> {
    const errorText = await this.getFieldError();
    return errorText?.includes(VALIDATION_MESSAGES.REQUIRED_FIELD) || false;
  }

  async validateSaveSuccess(): Promise<boolean> {
    const successText = await this.getSuccessMessage();
    return successText?.includes(VALIDATION_MESSAGES.SAVE_SUCCESS) || false;
  }

  async validatePatientRequiredError(): Promise<boolean> {
    const errorText = await this.getErrorMessage();
    return errorText?.includes(VALIDATION_MESSAGES.PATIENT_REQUIRED) || false;
  }

  async validateEmployeeRequiredError(): Promise<boolean> {
    const errorText = await this.getErrorMessage();
    return errorText?.includes(VALIDATION_MESSAGES.EMPLOYEE_REQUIRED) || false;
  }

  async validateShiftNameRequiredError(): Promise<boolean> {
    const errorText = await this.getErrorMessage();
    return errorText?.includes(VALIDATION_MESSAGES.SHIFT_NAME_REQUIRED) || false;
  }

  async validateInvalidDateRangeError(): Promise<boolean> {
    const errorText = await this.getErrorMessage();
    return errorText?.includes(VALIDATION_MESSAGES.INVALID_DATE_RANGE) || false;
  }

  // Generic message validation
  async validateMessageContains(selector: string, expectedMessage: string): Promise<boolean> {
    const messageText = await this.page.textContent(selector);
    return messageText?.includes(expectedMessage) || false;
  }

  async waitForMessageToDisappear(selector: string, timeout: number = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'hidden', timeout });
  }

  // Toast notification methods
  async waitForToast(timeout: number = 5000): Promise<void> {
    await this.page.waitForSelector(VALIDATION_SELECTORS.toastSuccess, { timeout });
  }

  async isToastVisible(): Promise<boolean> {
    return await this.page.isVisible(VALIDATION_SELECTORS.toastSuccess) ||
           await this.page.isVisible(VALIDATION_SELECTORS.toastWarning) ||
           await this.page.isVisible(VALIDATION_SELECTORS.toastInfo);
  }
}

// Export all validation-related constants
export const VALIDATION_CONSTANTS = {
  SELECTORS: VALIDATION_SELECTORS,
  MESSAGES: VALIDATION_MESSAGES,
  TIMEOUTS: {
    SHORT: 3000,
    MEDIUM: 5000,
    LONG: 10000,
  },
};

// Export as default for easy importing
export default ValidationHelper;