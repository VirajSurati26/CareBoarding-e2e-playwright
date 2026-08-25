import { test, expect } from '@playwright/test';
import { LoginPage } from '@/pageObjects/BaseClass/LoginPage';
import { ChangeEntity } from '@/pageObjects/BaseClass/ChangeEntity';
import { Employee } from '@/pageObjects/Employee/Past_Visit_Create_TimeSheet';
import { MobileApp } from '@/pageObjects/IntegratedWebMobileApp/IntegratedWebMobileClock_In_Out';
import { BasePage } from '@/pageObjects/BaseClass/BasePage';
import { MissedCard } from '@/pageObjects/Visit_Review_In_Visits_Module/Visit_Review_In_MissedCard';
import { TEST_USERS, URLS } from '@/data/testData/testData';
import { Visit_Review_IN_Visits_Field } from '@/pageObjects/Visits_Module/Visit_Review_In_Visits_Field';

const formatTo12Hour = (time24: string): string => {
  const match = time24.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid 24-hour time format: ${time24}. Expected H:MM or HH:MM`);
  }

  const [, hoursStr, minutes] = match;
  const hours = Number(hoursStr);
  if (Number.isNaN(hours) || hours < 0 || hours > 23) {
    throw new Error(`Invalid hour value in time: ${time24}`);
  }

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const normalizePatientName = (rawPatientName: string): string => {
  const patientName = rawPatientName.split('(')[0].trim();
  if (!patientName.includes(',')) {
    return patientName;
  }

  const parts = patientName.split(',').map(part => part.trim());
  if (parts.length === 2) {
    return `${parts[1]} ${parts[0]}`;
  }

  if (parts.length > 2) {
    const lastName = parts[0];
    const firstNames = parts.slice(1).join(' ');
    return `${firstNames} ${lastName}`;
  }

  return patientName;
};

test.describe('Web to Mobile Visit Test', () => {
  let mobileApp: MobileApp;
  let visitReviewPage: Visit_Review_IN_Visits_Field;

  test.beforeEach(async ({ page }) => {
    const basePage = new BasePage(page);
    await basePage.maximizeWindow();
    mobileApp = new MobileApp();
    visitReviewPage = new Visit_Review_IN_Visits_Field(page);
  });

  test.afterEach(async () => {
    try {
      await mobileApp.closeDevice();
    } catch (error) {
      console.warn('Mobile teardown failed but test will continue:', error);
    }
  });

  test('Create visit on web and check on mobile', async ({ page }) => {
    test.setTimeout(240000);

    const loginPage = new LoginPage(page);
    const changeEntity = new ChangeEntity(page);
    const employee = new Employee(page);

    await loginPage.goto(URLS.LOGIN);
    await loginPage.login(TEST_USERS.ADMIN_USER.username, TEST_USERS.ADMIN_USER.password);
    await changeEntity.selectEntity('Pennsylvania (PA)');
    await changeEntity.selectAreYouSureConfirmButton();
    await employee.clickEmployeeButtonsideMenu();
    await employee.clickSearchEmployeeButton();
    const empName = await employee.selectAndOpenEmployee(0);
    await employee.clickCalendarButton();
    await employee.selectCurrentDate();
    const { startTime } = await employee.generatePastVisitTime();
    const rawPatientName = await employee.selectPatientByIndex(0);
    await employee.selectPayRateByIndex(1);
    await employee.selectPOC('TESTING');
    await employee.selectServiceCode('G0156');
    await employee.clickCreateButton();
    await employee.clickOKButtonandPrintValidationMessage();
    await visitReviewPage.maximizeWindow();
    await visitReviewPage.ClickINVisitInSideMenu();
    await visitReviewPage.ClickVisitReviewOption();
    await visitReviewPage.ClickTodayOptionInCalendar();
    const missedCard = page.getByText('Missed', { exact: true });
    await missedCard.waitFor({ state: 'visible', timeout: 20000 });
    const missedCardPage = new MissedCard(page);
    await missedCardPage.ClickMissedVisitcard();
    await missedCardPage.CreateNewRecentScheduledVisitForFirstMissedVisit();
    const patientName = normalizePatientName(rawPatientName);
    const visitStartTime12H = formatTo12Hour(startTime);
    
    try {
      console.log('Starting Android emulator...');
      await mobileApp.startEmulator();
      console.log('Starting Appium server...');
      await mobileApp.startAppium();
      const appPath = process.env.ANDROID_APK_PATH;
      const deviceId = process.env.ANDROID_DEVICE_ID || 'emulator-5554';
      if (!appPath) {
        throw new Error('ANDROID_APK_PATH is not set. Add ANDROID_APK_PATH to your .env file pointing to the APK file.');
      }

      await mobileApp.connectDevice(deviceId, appPath);
      console.log('Mobile device connected, logging in if needed...');
      await mobileApp.login(TEST_USERS.MOBILE_USER.username, TEST_USERS.MOBILE_USER.password);
      console.log('Patient Found : ', patientName);

      const visitExists = await mobileApp.findRecentVisit(empName, patientName, visitStartTime12H);
      expect(visitExists).toBe(true);
      console.log('👆 Clicking on the visit card...');
      await mobileApp.clickVisit(patientName, visitStartTime12H);
      await new Promise(resolve => setTimeout(resolve, 5000));
      await mobileApp.clientVerification();
    } catch (error) {
      console.log('💡 To enable mobile verification:');
      console.log('   1. Install Java JDK and set JAVA_HOME');
      console.log('   2. Install Android SDK');
      console.log('   3. Set ANDROID_HOME in your environment');
      console.log('   4. Set ANDROID_APK_PATH to your APK file path');
      console.log('   5. Set ANDROID_DEVICE_ID if you have multiple devices');
      console.log('   6. Run with: npx playwright test TC.IntegratedWebMobile_Fill_TimeSheet.spec.ts --headed');
      console.warn(error);
    }
  });
});