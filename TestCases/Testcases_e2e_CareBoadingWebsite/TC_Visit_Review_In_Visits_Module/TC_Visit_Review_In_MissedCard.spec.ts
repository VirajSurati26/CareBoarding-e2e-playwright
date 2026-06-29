import { test, expect } from '@playwright/test';
import { TEST_USERS, URLS } from '@/data/testData/testData';
import { ChangeEntity } from '@/pageObjects/BaseClass/ChangeEntity';
import { LoginPage } from '@/pageObjects/BaseClass/LoginPage';
import { Visit_Review_IN_Visits_Field } from '@/pageObjects/Visits_Module/Visit_Review_In_Visits_Field';
import { Employee } from '@/pageObjects/Employee/Past_Visit_Create_TimeSheet';

const VisitReviewPage = async (page: any) => {
  const loginPage = new LoginPage(page);
  const changeEntity = new ChangeEntity(page);
  await loginPage.goto(URLS.LOGIN);
  await loginPage.login(TEST_USERS.ADMIN_USER.username, TEST_USERS.ADMIN_USER.password);
  await loginPage.maximizeWindow();
  await changeEntity.selectEntity('Smith HHE');

  const employee = new Employee(page);
  await employee.clickEmployeeButtonsideMenu();
  await employee.clickSearchEmployeeButton();
  await employee.selectAndOpenEmployee(0);
  await employee.clickCalendarButton();
  await employee.selectCurrentDate();
  await employee.generatePastVisitTime();
  const selectedPatient = await employee.selectPatientByIndex(0);
  expect(selectedPatient).toBeTruthy();
  const selectedPayRate = await employee.selectPayRateByIndex(1);
  expect(selectedPayRate).toBeTruthy();
  const selectedPOC = await employee.selectPOC('TESTING (671268)');
  expect(selectedPOC).toBeTruthy();
  const selectedServiceCode = await employee.selectServiceCode('G0156 U7');
  expect(selectedServiceCode).toBeTruthy();
  await employee.clickCreateButton();
  await employee.clickOKButtonandPrintValidationMessage();
};

test('Visit Review appears in Visits module', async ({ page }) => {
  test.setTimeout(120000);
  await VisitReviewPage(page);

  const visitReviewPage = new Visit_Review_IN_Visits_Field(page);
  await visitReviewPage.maximizeWindow();
  await visitReviewPage.ClickINVisitInSideMenu();
  await visitReviewPage.ClickVisitReviewOption();
  await visitReviewPage.ClickTodayOptionInCalendar();

  const missedCard = page.getByText('Missed', { exact: true });
  await missedCard.waitFor({ state: 'visible', timeout: 20000 });

  // Verify and select the "Missed visit" card in Visit review page
  await visitReviewPage.ClickMissedVisitcard();
});
