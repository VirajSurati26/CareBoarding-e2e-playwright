import { BaseTest } from "@/base/BaseTest";
import { Page } from "@playwright/test";


export class Visit_Review_IN_Visits_Field extends BaseTest {
    constructor(page: Page) {
        super(page)
    }

    async ClickINVisitInSideMenu() {
        await this.page.locator('.loading-overlay.is-active').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
        const visitsMenu = this.page.locator('a.nav-link').filter({ hasText: 'Visits' }).first();
        await visitsMenu.waitFor({ state: 'visible', timeout: 10000 });
        const visitReviewLink = this.page.locator('a').filter({ hasText: 'Visit Review' }).first();
        if (!await visitReviewLink.isVisible()) {
            await visitsMenu.click();
        }
        await visitReviewLink.waitFor({ state: 'visible', timeout: 10000 });
        await visitReviewLink.click();
    }
}
