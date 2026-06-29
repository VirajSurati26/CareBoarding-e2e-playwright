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

    // Click the Today's option in the calendar and wait for navigation
    async ClickTodayOptionInCalendar() {
        // Open the dropdown if it isn't already open
        await this.page.locator('.icon-calendar-days').click();
        await this.page.waitForTimeout(1000); // Wait for the dropdown to open
        const todayOption = this.page.locator('li[data-range-key="Today"]');
        await todayOption.waitFor({ state: 'visible' });
        await todayOption.click();
        await this.waitForPageLoad();
    }

    //------------------Missed visit" card-----------------------

    // Click on the "Missed visit" card Visit review page
    async ClickMissedVisitcard() {
        const missedTab = this.page.getByText('Missed', { exact: true });
        await missedTab.waitFor({ state: 'visible', timeout: 20000 });
        await missedTab.click();

        // Wait for the Missed table to load after tab click
        await this.page.waitForTimeout(3000);

        // Scroll down to reveal table rows
        await this.page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });

        // Extra pause to ensure all rows and action buttons are rendered
        await this.page.waitForTimeout(2000);
    }

    // Click "Send Notification" for the first visit in the Missed card
    async CreateNewRecentScheduledVisitForFirstMissedVisit() {

        // Click Send Notification
        const sendNotification = this.page.locator('[title="Send Notification"]');
        const count = await sendNotification.count();
        console.log("Send Notification Count:", count);

        if (count === 0) {
            throw new Error("Send Notification icon not found.");
        }

        // Click the first "Send Notification" button
        await sendNotification.first().click();

        // Wait for confirmation popup
        const popup = this.page.locator('.swal2-popup');
        await popup.waitFor({ state: 'visible', timeout: 30000 });

        // Click Yes Button
        await popup.getByRole('button', { name: 'Yes' }).click();
        await this.page.waitForTimeout(1000);

        //Click ok Button
        await popup.getByRole('button', { name: 'Ok' }).click();
        await this.page.waitForTimeout(1000);

        // Wait for page/action to complete
        await this.waitForPageLoad();


    }
}