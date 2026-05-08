import { Page } from '@playwright/test';
import { pause } from 'webdriverio/build/commands/browser';
import { generateRandomShiftName, selectCalendarDate, convertAmPmTo24Hour, generateRandomAmPmTime, isValidAmPmTime, scrollToBottom } from '../utils/ReusableMethod';
import { threadId } from 'worker_threads';

export class MasterSchedule {
  constructor(private page: Page) {}

  private async waitAndClick(selector: string, timeout = 20000): Promise<void> {
    const locator = this.page.locator(selector).first();
    await locator.waitFor({ state: 'visible', timeout });
    await locator.click({ timeout });
  }

  async selectPatientFieldsideMenu(patientName: string): Promise<void> {
    await this.page.click(`text=${patientName}`);
    await this.page.click('text=Recurring Schedule');
  
  }

async selectFirstPatientAndSearch(): Promise<void> {

    // Wait for page to load
    await this.page.waitForLoadState('networkidle');
    
    // Click the "Select Patient" span element
    await this.page.locator('span.select2-selection__rendered:has-text("Select Patient")').click();
    
    // Wait for dropdown to open and fill the search input
    await this.page.locator('input.select2-search__field').waitFor({ state: 'visible' });
    await this.page.locator('input.select2-search__field').fill('Smith, John M. (TWI-000004)');
    
    // Wait for results and click patient by index (0 = first, 1 = second, etc.)
    await this.page.locator('.select2-results__option').first().waitFor({ state: 'visible' });
    await this.page.locator('.select2-results__option').first().click(); 
    // Click the Search button
    await this.page.locator('button:has-text("Search")').click();

}
    //==============Performed click on Add Recurring Schedule Button==============

    async AddRecurringScheduleButton(): Promise<void> {
 
     await this.page.getByText('Add Recurring Schedule').click();
  
    }

    //===============Handle recurring period radio buttons with condition===============

    async RecurringPeriodbutton(): Promise<void> {
    const weeklyOption = this.page.locator('text=Weekly');
    const monthlyOption = this.page.locator('text=Monthly');
    
    // Wait for radio buttons to be visible
    await Promise.any([
        weeklyOption.waitFor({ state: 'visible' }),
        monthlyOption.waitFor({ state: 'visible' })
    ]);
    
    // Check if Monthly is currently selected, then click Weekly
    if (await monthlyOption.isVisible()) {
      await monthlyOption.click();
    } else {
      // Fallback: click Weekly directly
      await weeklyOption.click();
    }
  }

    //===============Performed the Enter the Shift Name===============

    async EnterShiftName(): Promise<void> {

    const randomShiftName = generateRandomShiftName();
    await this.page.locator('input[name="shift_name"]').fill(randomShiftName);
    }

    //===============Performed the Select the start date===============

    async SelectStartDate(): Promise<void> {
      
     const today = new Date();
     const dateStr = String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0') + '-' + 
                    today.getFullYear();    
     await this.page.locator('input[name="from_date"]').fill(dateStr);    
  }   

//============================Performed the Master Week Schedule=======================

 async masterWeekSchedule(): Promise<void> {

  // Scroll to bottom to ensure all elements are loaded
  await this.page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });
  
  const startHour = Math.floor(Math.random() * 10) + 1;
  const endHour = startHour + Math.floor(Math.random() * 4) + 1;
  const start = `${startHour.toString().padStart(2, '0')}:00`;
  const end = `${endHour.toString().padStart(2, '0')}:00`;

  // Fill the time input fields for Master Week Schedule
  await this.page.locator('input[type="time"]').first().fill(start);
  await this.page.locator('input[type="time"]').nth(1).fill(end);

  console.log(`Filled Master Week Schedule with start: ${start}, end: ${end}`);
}

  //----------------Performed the select employee in Master Week Schedule-----------------

    async selectEmployeeFromDropdown(employeeName: string): Promise<void> {
        await this.page.locator('select[name="is_whole_week_caregiver"] + .select2-container .select2-selection__rendered').click();
        await this.page.locator('input.select2-search__field').waitFor({ state: 'visible' });
         await this.page.waitForTimeout(3000);
        await this.page.locator('input.select2-search__field').fill(employeeName);       
        await this.page.locator('.select2-results__option').first().waitFor({ state: 'visible' });
         await this.page.waitForTimeout(3000);
        await this.page.locator('.select2-results__option').first().click();
   }

  //-------------------Performed the select pay rate in Master Week Schedule-----------------

        async selectPayRate(payRate: string): Promise<void> {
          await this.page.locator('select[name="is_whole_week_pay_rate"] + .select2-container .select2-selection__rendered').click();
          await this.page.locator('input.select2-search__field').waitFor({ state: 'visible' });
          await this.page.locator('input.select2-search__field').fill(payRate);
          await this.page.waitForTimeout(2000);
          await this.page.locator('.select2-results__option').first().waitFor({ state: 'visible' });
          await this.page.locator('.select2-results__option').first().click();
  }

  //-------------------Performed the select POC in Master Week Schedule-----------------

         async selectPOC(pocName: string): Promise<void> {
          await this.page.locator('select[name="is_whole_week_poc"] + .select2-container .select2-selection__rendered').click();
          await this.page.locator('input.select2-search__field').waitFor({ state: 'visible' });
          await this.page.locator('input.select2-search__field').fill(pocName);
          await this.page.waitForTimeout(1000);
          await this.page.locator('.select2-results__option').first().waitFor({ state: 'visible' });
          await this.page.locator('.select2-results__option').first().click();
  }

  //-------------------Performed the select service code in Master Week Schedule------------------

 async selectServiceCode(serviceCode: string): Promise<void> {
  // Locate specific service code dropdown
  const dropdown = this.page.locator('select[name="is_whole_week_service_code"] + .select2-container .select2-selection__rendered');
  
  // Open dropdown
  await dropdown.click();

  // Locate search box
  const searchBox = this.page.locator('input.select2-search__field');
  await searchBox.fill(serviceCode);

  // Locate matching option
  const option = this.page.locator('.select2-results__option').first();
  await option.waitFor({ state: 'visible', timeout: 5000 });
  await option.click();
}

  //-------------------Performed the Copy Schedule To(Select the Every Day checkbox) Week Schedule------------------
  async clickEveryDayCheckbox(): Promise<void> {
    await this.waitAndClick('label[for="sametime"]');
  }

  //-------------------Performed the Save button in Master Week Schedule------------------

  async clickSaveButton(): Promise<void> {
  await this.page.locator('#savefrm').click();

}

  // -------------------Performed the OK button and Print the message in Master Week Schedule------------------

    async clickOkBtnAndPrintMessage(): Promise<boolean> {
        try {
            await this.page.locator('.preloader').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
            const okButton = this.page.locator('button:has-text("OK")');
            await okButton.click({ force: true });
            console.log("OK button clicked");
        } catch (e) {
            console.log("OK button not found, continuing");
        }
        return true;
    }

    // -------------------Page refresh Method------------------

    async refreshPage(): Promise<void> {
        try {
            // Check if page is still valid before refreshing
            if (this.page.isClosed()) {
                console.log("Page already closed, skipping refresh");
                return;
            }
            const currentUrl = this.page.url();
            console.log("Refreshing page:", currentUrl);
            await this.page.goto(currentUrl, { timeout: 10000 });
            await this.page.waitForLoadState('networkidle');
            console.log("Page refreshed successfully");
        } catch (error: any) {
            console.log("Page refresh error:", error.message);
            // Try alternative refresh method
            try {
                await this.page.reload({ timeout: 10000 });
                await this.page.waitForLoadState('networkidle');
                console.log("Page reloaded successfully");
            } catch (reloadError: any) {
                console.log("Page reload also failed:", reloadError.message);
            }
        }
  
    }

//=====================Open Created visit schedule Incremental Icon============================

   //--------------Open Created VisitScheduleIncrementalIcon --------------

  async OpenCreatedVisitScheduleIncrementalIcon(): Promise<void> {
    // Wait and scroll
    await this.page.waitForTimeout(2000);
    await this.page.evaluate(() => { window.scrollTo(300, document.body.scrollHeight); });
    await this.page.waitForTimeout(3000);
    // Click the plus icon button
    await this.page.locator('button.btn.btn-tool').first().click();
    await this.page.waitForTimeout(2000);
    await this.page.waitForLoadState('networkidle');
  }

  //----------------Performed the Clone option in Incremental Icon recurring schedule------------------

  async clickCloneOption(): Promise<void> {
    // Click Clone button
    await this.waitAndClick('a[title="Clone"]');
    await this.page.waitForTimeout(2000);
    await this.page.waitForLoadState('networkidle');
    await this.page.goBack();
    await this.page.waitForTimeout(2000);
    await this.page.waitForLoadState('networkidle');
  }

  //----------------Performed the Edit option in Incremental Icon recurring schedule------------------

  async clickEditOption(): Promise<void> {
    // Click Edit button
    await this.waitAndClick('a[title="Edit"]');
    await this.page.waitForTimeout(2000);
    await this.page.waitForLoadState('networkidle');
    await this.page.goBack();
    await this.page.waitForTimeout(2000);
    await this.page.waitForLoadState('networkidle');
  }

  //----------------Performed the Delete option in Incremental Icon recurring schedule------------------

  async clickDeleteOption(): Promise<void> {
    // Click Delete button
    await this.waitAndClick('a.btn.btn-danger');
    await this.page.waitForTimeout(2000);
    await this.page.waitForLoadState('networkidle');
  }

  // Go back to previous page
  async goBack(): Promise<void> {
    await this.page.goBack();
    await this.page.waitForTimeout(2000);
    await this.page.waitForLoadState('networkidle');
  }

  // Perform the Delete action and confirm deletion
  async confirmDelete(): Promise<void> {
    await this.waitAndClick('button:has-text("Yes")');
    // await this.waitAndClick('button:has-text("cancel")');
    await this.waitAndClick('button:has-text("OK")');
    await this.page.waitForLoadState('networkidle');
  }


}

