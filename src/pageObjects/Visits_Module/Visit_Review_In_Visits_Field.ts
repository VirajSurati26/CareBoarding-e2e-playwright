
import { BasePage } from "@/pageObjects/BaseClass/BasePage";
import { Page } from "@playwright/test";



export class Visit_Review_In_Visits_Field extends BasePage {
    constructor(page: Page) {
        super(page)
    }

    // Click on the "Visit Review" option in the side menu
    // Click the "Visits" entry in the side menu and wait for navigation
    async ClickINVisitInSideMenu() {
        await this.page.locator('a.nav-link:has-text("Visits")').nth(0).click();
        // Ensure the navigation finishes before proceeding
        await this.waitForPageLoad();
    }

    // Click the "Visit Review" option in the side menu and wait for navigation
    async ClickVisitReviewOption() {
        await this.page.locator('a.nav-link[href*="/admin/visits/index"]').click();
        await this.waitForPageLoad();
    }

    async ClickTodayOptionInCalendar() {
        // Open the dropdown if it isn't already open
        await this.page.locator('.icon-calendar-days').click();

        const todayOption = this.page.locator('li[data-range-key="Today"]');

        await todayOption.waitFor({ state: 'visible' });
        await todayOption.click();

        await this.waitForPageLoad();
    }

    //------------------Scheduled visit" card-----------------------

    //Click on the "Scheduled visit" card in Visit review page
    async ClickScheduledVisitcard() {
        await this.page.getByText('Scheduled', { exact: true }).click();

        // or scroll to bottom
        await this.page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });
    }

    //------------------In Progress visit" card-----------------------

    //Click on the "In Progress visit" card in Visit review page
    async ClickInProgressVisitcard() {
        await this.page.getByText('In Progress', { exact: true }).click();

        // or scroll to bottom
        await this.page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });
        await this.scrollUp(500);

    }

    //------------------Missed visit" card-----------------------

    //Click on the "Missed visit" card Visit review page
    async ClickMissedVisitcard() {
        const missedTab = this.page.getByText('Missed', { exact: true });
        await missedTab.waitFor({ state: 'visible', timeout: 20000 });
        await missedTab.click();

        // Wait for the Missed table to render after tab click
        await this.page.waitForTimeout(3000);

        // Scroll down to reveal table rows
        await this.page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });
    }



    // Click the Send Notification button for the first entry in the Missed visit list
    async ClickSendNotification() {
        const firstRow = this.page.locator('table tbody tr:first-child');
        const sendNotification = firstRow.locator('td:nth-child(5) button.sendNotification.ml-1');
        await sendNotification.waitFor({ state: 'visible', timeout: 20000 });
        await sendNotification.click();
    }

    //------------------Completed visit" card-----------------------

    //Click on the "Completed" status dropdown in Visit review page
    async ClickCompletedStatusDropdown() {
        await this.page.getByText('Completed', { exact: true }).click();

        // or scroll to bottom
        await this.page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });
        await this.scrollUp(500);

    }


}
