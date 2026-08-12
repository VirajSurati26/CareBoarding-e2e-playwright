
import { BasePage } from "@/pageObjects/BaseClass/BasePage";
import { Page } from "@playwright/test";


export class Visit_Review_IN_Visits_Field extends BasePage {
    constructor(page: Page) {
        super(page)
    }

    // Click on the "Visit Review" option in the side menu
    
    async ClickINVisitInSideMenu() {
        // Wait for potential SweetAlert2 overlay to disappear (if present)
        const overlay = this.page.locator('.swal2-container');
        if (await overlay.isVisible().catch(() => false)) {
            await overlay.waitFor({ state: 'hidden', timeout: 8000 });
        }
        
        // Click the Visits link; force click in case of minor obstruction
        await this.page.locator('a.nav-link:has-text("Visits")').first().click({ force: true });
        await this.waitForPageLoad();
    }

    // Click the "Visit Review" option in the side menu and wait for navigation
    async ClickVisitReviewOption() {
        const overlay = this.page.locator('.swal2-container');
        await overlay.waitFor({ state: 'hidden', timeout: 8000 });
        const link = this.page.locator('a.nav-link[href*="/admin/visits/index"]').first();
        if (!(await link.isVisible().catch(() => false))) {
            await this.page.locator('a.nav-link:has-text("Visits")').first().click({ force: true }).catch(() => undefined);
            await this.page.waitForTimeout(500);
        }
        
        try {
            await link.click({ timeout: 5000 });
        } catch {
            await link.evaluate((el: HTMLElement) => (el as HTMLAnchorElement).click());
        }
        await this.waitForPageLoad();
    }

    // Click the Today's option in the calendar and wait for navigation
    async ClickTodayOptionInCalendar() {
        // Open the dropdown if it isn't already open
        await this.page.locator('.icon-calendar-days').click();
        await this.page.waitForTimeout(1000); // Wait for the dropdown to open
        const todayOption = this.page.locator('[data-range-key="Today"]');
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
