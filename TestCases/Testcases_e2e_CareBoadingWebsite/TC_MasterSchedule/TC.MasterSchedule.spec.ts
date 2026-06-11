import { test, expect } from '@playwright/test';
import { LoginPage } from '@/pageObjects/BaseClass/LoginPage';
import { ChangeEntity } from '@/pageObjects/BaseClass/ChangeEntity';
import { MasterSchedule } from '@/pageObjects/MasterSchedule/MasterSchedule';
import { TEST_USERS, URLS } from '@/data/testData/testData';
import { BaseTest } from '@/base/BaseTest';

test.describe('Select patients module', () => {
  test.beforeEach(async ({ page }) => {
    const baseTest = new BaseTest(page);
    await baseTest.maximizeWindow();

  });

  test('should select a patient', async ({ page }) => {
    test.setTimeout(120000); // 120 seconds timeout for this test
    const loginPage = new LoginPage(page);
    const changeEntity = new ChangeEntity(page);
    const masterSchedule = new MasterSchedule(page);
        
    await loginPage.goto(URLS.LOGIN);
    await loginPage.login(TEST_USERS.ADMIN_USER.username, TEST_USERS.ADMIN_USER.password);
    await changeEntity.selectEntity('Smith HHE');
    await masterSchedule.selectPatientFieldsideMenu('Patients');

    // TODO: Performed the Created the 
   
    // Select a patient using the Select2 dropdown
    await masterSchedule.selectFirstPatientAndSearch();

    // TODO: Performed the Add Recurring Schedule Button
    await masterSchedule.AddRecurringScheduleButton();
    console.log("Add recurring schedule button clicked");

    // TODO: Handle recurring period radio buttons with condition
    await masterSchedule.RecurringPeriodbutton();
    console.log("Recurring period button selected");

    // TODO: Enter shift name
    await masterSchedule.EnterShiftName();
    console.log("Entered shift name");

    // TODO: Select start date  
    await masterSchedule.SelectStartDate();
    console.log("Selected start date");

    // TODO: Perform the Master Week Schedule
    await masterSchedule.masterWeekSchedule();
    console.log("Master week schedule completed");

    await masterSchedule.selectEmployeeFromDropdown("John, Emily R. (TWI-000003)");
    console.log("Selected employee");

    await masterSchedule.selectPayRate(" Hub Location ");
    console.log(" Hub Location");

    await masterSchedule.selectPOC("TESTING (671268)");
    console.log("TESTING (671268)");

    await masterSchedule.selectServiceCode("G0156 U7");
    console.log("G0156 U7");

    await masterSchedule.clickEveryDayCheckbox();
    console.log("Select the Everyday");
    
    await masterSchedule.clickSaveButton();
    console.log("Save button clicked");

    await masterSchedule.clickOkBtnAndPrintMessage();
    console.log("Successfully message is printed and click ok button");

    await masterSchedule.refreshPage();
    console.log("Page refreshed");
    
//==================Open Created visit schedule Incremental Icon==================

    await masterSchedule.OpenCreatedVisitScheduleIncrementalIcon();
    console.log("Opened created visit schedule incremental icon");

    await masterSchedule.clickCloneOption();
    console.log("Successfully clicked clone Icon");

    await masterSchedule.OpenCreatedVisitScheduleIncrementalIcon();
    console.log("Successfully clicked again select Incremental Icon (Edit Page)");

    await masterSchedule.clickEditOption();
    console.log("Successfully clicked edit Icon");

     await masterSchedule.OpenCreatedVisitScheduleIncrementalIcon();
    console.log("Successfully clicked again select Incremental Icon (Delete Page)");

     await masterSchedule.clickDeleteOption();
    console.log("Successfully clicked Deleted Icon");

    await masterSchedule.confirmDelete();
    console.log("Successfully confirmed deletion of the schedule");

    console.log("Test completed successfully");
    

});

});