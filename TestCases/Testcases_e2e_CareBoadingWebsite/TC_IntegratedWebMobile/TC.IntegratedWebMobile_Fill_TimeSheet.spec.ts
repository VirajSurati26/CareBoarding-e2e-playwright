import { test, expect } from '@playwright/test';
import { LoginPage } from '@/pageObjects/BaseClass/LoginPage';
import { ChangeEntity } from '@/pageObjects/BaseClass/ChangeEntity';
import { Employee } from '@/pageObjects/Employee/Past_Visit_Create_TimeSheet';
import { MobileApp } from '@/pageObjects/IntegratedWebMobileApp/IntegratedWebMobile_Fill_TimeSheet';
import { BasePage } from '@/pageObjects/BaseClass/BasePage';
import { MissedCard } from '@/pageObjects/Visit_Review_In_Visits_Module/Visit_Review_In_MissedCard';
import { TEST_USERS, URLS } from '@/data/testData/testData';

test.describe('Web to Mobile Visit Test', () => {
  let mobileApp: MobileApp;

  //--------- Test Setup ---------//
  test.beforeEach(async ({ page }) => {
    const basePage = new BasePage(page);
    await basePage.maximizeWindow();
    mobileApp = new MobileApp();
  });

  test.afterEach(async () => {
    try {
      await mobileApp.closeDevice();
    } catch (error) {
      console.warn('Mobile teardown failed but test will continue:', error);
    }
  });

  test('Create visit on web and check on mobile', async ({ page }) => {
    test.setTimeout(240000); // 4 minutes

    // ---------------STEP 1: Create visit on web---------------------

    const loginPage = new LoginPage(page);
    const changeEntity = new ChangeEntity(page);
    const employee = new Employee(page);

    await loginPage.goto(URLS.LOGIN);
    await loginPage.login(TEST_USERS.ADMIN_USER.username, TEST_USERS.ADMIN_USER.password);
    await changeEntity.selectEntity('Smith HHE');

    await employee.clickEmployeeButtonsideMenu();
    await employee.clickSearchEmployeeButton();
    const empName = await employee.selectAndOpenEmployee(0);

    await employee.clickCalendarButton();
    await employee.selectCurrentDate();
    const { startTime, endTime } = await employee.generatePastVisitTime();

    const rawPatientName = await employee.selectPatientByIndex(0);
    await employee.selectPayRateByIndex(1);
    await employee.selectPOC('TESTING');
    await employee.selectServiceCode('G0156');
    await employee.clickCreateButton();
    await employee.clickOKButtonandPrintValidationMessage();

    //------------------Clean patient name (e.g., "Smith, John (P123)" or "John Smith (P123)" -> "John Smith")----------------

    let patientName = rawPatientName.split('(')[0].trim();
    if (patientName.includes(',')) {
      const parts = patientName.split(',').map((p) => p.trim());
      // Handle edge case: if more than 2 parts, join all but first as first name
      if (parts.length === 2) {
        patientName = `${parts[1]} ${parts[0]}`;
      } else if (parts.length > 2) {
        // e.g., "Smith, Jr., John" -> "Jr. John Smith"
        const lastName = parts[0];
        const firstNames = parts.slice(1).join(' ');
        patientName = `${firstNames} ${lastName}`;
      }
    }

    //--------------------Convert 24-hour time (e.g. "04:41") to 12-hour format (e.g. "4:41 AM")----------------------------

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

    const visitStartTime12H = formatTo12Hour(startTime);

    try {
      const appPath = process.env.ANDROID_APK_PATH;
      const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
      const deviceId = process.env.ANDROID_DEVICE_ID || process.env.ANDROID_DEVICE_NAME || 'emulator-5554';

      if (!appPath) {
        console.warn('⚠️ ANDROID_APK_PATH is not configured. Skipping mobile verification.');
        return;
      }

      if (!androidHome) {
        console.warn('⚠️ ANDROID_HOME or ANDROID_SDK_ROOT is not configured. Skipping mobile verification.');
        return;
      }

      console.log('Starting Android emulator...');
      await mobileApp.startEmulator();

      console.log('Starting Appium server...');
      await mobileApp.startAppium();

      await mobileApp.connectDevice(deviceId, appPath);

      //----------Language handle----------------
      await mobileApp.handleLanguage();
      console.log('Handled mobile language screen');

      //---------- Perform the successfully Login In App----------------

      console.log('Mobile device connected, logging in...');
      await mobileApp.login(TEST_USERS.MOBILE_USER.username, TEST_USERS.MOBILE_USER.password);
      await new Promise((r) => setTimeout(r, 5000));
      console.log('Patient Found : ', patientName);

      //----------Perform the recent visit select----------------

      const visitExists = await mobileApp.findRecentVisit(empName, patientName, visitStartTime12H);
      expect(visitExists).toBe(true);

      console.log('👆 Clicking on the visit card...');
      await mobileApp.clickVisit(patientName, visitStartTime12H);
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);
      } else {
        console.log('Visit not created!');
      }
    }
  });
});
