import { BasePage } from "@/pageObjects/BaseClass/BasePage";
import { Page } from "@playwright/test";


export class ScheduledCard extends BasePage {
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
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    }
}
