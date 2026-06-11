import { BaseTest } from "@/base/BaseTest";
import { Page } from "@playwright/test";


export class Visit_Review_IN_Visits_Field extends BaseTest {
    constructor(page: Page) {
        super(page)
    }

    async ClickINVisitInSideMenu() {
        await this.page.locator('[data-testid="visit-menu"]').click();
    }
}
