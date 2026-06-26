
import { BasePage } from "@/pageObjects/BaseClass/BasePage";
import { Page } from "@playwright/test";


export class Visit_Review_IN_Visits_Field extends BasePage {
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

        // scroll down to reveal the action button if needed
        await this.page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });

        const createRecentVisitButton = this.page.locator('a.btn.btn-primary:has-text("Create New Recent Scheduled Visits")').first();
        await createRecentVisitButton.waitFor({ state: 'visible', timeout: 20000 });
        await createRecentVisitButton.click();
        await this.waitForPageLoad();

        const sendNotificationButton = this.page.locator('tr:nth-child(1) td:nth-child(5) a.btn.btn-primary.text-success.fs-14:has-text("Send Notification")').first();
        await sendNotificationButton.waitFor({ state: 'visible', timeout: 20000 });
        await sendNotificationButton.click();
        await this.waitForPageLoad();

        //  


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
