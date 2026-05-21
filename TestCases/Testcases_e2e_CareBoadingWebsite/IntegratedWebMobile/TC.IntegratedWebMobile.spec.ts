import { test, expect } from '@playwright/test';
import { BaseTest } from "@/base/BaseTest";
import { TEST_USERS, URLS } from "@/data/testData/testData";
import { ChangeEntity } from "@/pageObjects/ChangeEntity/ChangeEntity";
import { Employee } from "@/pageObjects/Employee/Employee";
import { LoginPage } from "@/pageObjects/BaseClass/LoginPage";
import { MobileApp } from "@/pageObjects/IntegratedWebMobileApp/MobileApp(Appium)";

test.describe('Web to Mobile Visit Test', () => {
  let mobileApp: MobileApp;

  //--------- Test Setup ---------//
  test.beforeEach(async ({ page }) => {
    const baseTest = new BaseTest(page);
    await baseTest.maximizeWindow();
    mobileApp = new MobileApp();
  });

  test.afterEach(async () => {
    await mobileApp.closeDevice();
  });

  test(
    'Create visit on web and check on mobile', async ({ page }) => {
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
      const { startTime, endTime } = await employee.generateVisitAtRandomTime();

      const rawPatientName = await employee.selectPatientByIndex(0);
      await employee.selectPayRateByIndex(1);
      await employee.selectPOCByIndex(0);
      await employee.selectServiceCodeByIndex(0);
      await employee.clickCreateButton();
      await employee.clickOKButtonandPrintValidationMessage();

      //------------------Clean patient name (e.g., "Smith, John (P123)" or "John Smith (P123)" -> "John Smith")----------------
      let patientName = rawPatientName.split('(')[0].trim();
      if (patientName.includes(',')) {
        const parts = patientName.split(',').map(p => p.trim());
        patientName = `${parts[1]} ${parts[0]}`;
      }

      //--------------------Convert 24-hour time (e.g. "04:41") to 12-hour format (e.g. "04:41 AM")----------------------------
      const formatTo12Hour = (time24: string): string => {
        const [hoursStr, minutes] = time24.split(':');
        let hours = parseInt(hoursStr, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      };
      const visitStartTime12H = formatTo12Hour(startTime);
      console.log(`Visit created for: ${patientName} starting at: ${visitStartTime12H}`);

      //========================STEP 2: Check on mobile (with error handling)=======================

      console.log('Starting Android emulator...');
      await mobileApp.startEmulator();

      console.log('Starting Appium server...');
      await mobileApp.startAppium();

      console.log('Attempting to connect to mobile device...');
      const appPath = 'C:\\Users\\Admin\\eclipse-workspace\\Prod_Careboarding_Parallel_Tests_WebApp\\src\\test\\java\\CareBoarding_Resource\\CareBoarding-EVV-Prod-1_1_8_130 (1).apk';
      await mobileApp.connectDevice('emulator-5554', appPath);

      //----------Language handle----------------
      await mobileApp.handleLanguage();
      console.log

      //---------- Perform the successfully Login In App----------------
      console.log('Mobile device connected, logging in...');
      await mobileApp.login(TEST_USERS.MOBILE_USER.username, TEST_USERS.MOBILE_USER.password);
      await new Promise(r => setTimeout(r, 5000));
      console.log("Patient Found : ", patientName);

      //----------Perform the recent visit select----------------
      const visitExists = await mobileApp.findRecentVisit(empName, patientName, visitStartTime12H);
      expect(visitExists).toBe(true);

      console.log('👆 Clicking on the visit card...');
      await mobileApp.clickVisit(patientName, visitStartTime12H);

      //----------Perform the successfully clock-in------------
      await mobileApp.clickClockIn();
      await new Promise(r => setTimeout(r, 5000));

      //-----------Click the out and Fill-up all details--------
      await mobileApp.clickClockOut();
      await new Promise(r => setTimeout(r, 5000));
      await mobileApp.clientVerification();
      await mobileApp.patientsSignature();
      await mobileApp.saveButton();
      await mobileApp.okButton();

      // Just log the issue but don't fail or skip the test
      // The web part is the main functionality we're testing
      console.log('💡 To enable mobile verification:');
      console.log('   1. Install Java JDK and set JAVA_HOME');
      console.log('   2. Start Android Studio');
      console.log('   3. Open AVD Manager');
      console.log('   4. Launch your Android emulator');
      console.log('   5. Run: adb devices to verify connection');
      console.log('   6. Start Appium: npx appium --port 4724');
    });
});
