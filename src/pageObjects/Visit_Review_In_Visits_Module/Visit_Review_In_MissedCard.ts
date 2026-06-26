import { BasePage } from "@/pageObjects/BaseClass/BasePage";
import { Page } from "@playwright/test";


export class MissedCard extends BasePage {
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

    
    //------------------Missed visit" card-----------------------

    //Click on the "Missed visit" card Visit review page
    async ClickMissedVisitcard() {
        await this.page.getByText('Missed', { exact: true }).click();

        // or scroll to bottom
        await this.page.evaluate(() => { window.scrollTo(300, document.body.scrollHeight); });

        //Select the create the new "Recent Scheduled Visits"
        await this.page.locator('a.btn.btn-primary:has-text("Create New Recent Scheduled Visits")').click();
        await this.waitForPageLoad();

        //Send the Nofication action in Action column for Created new visit
        await this.page.locator('tr:nth-child(1) td:nth-child(5) a.btn.btn-primary.text-success.fs-14:has-text("Send Notification")').click();
        await this.waitForPageLoad();

    }
}
