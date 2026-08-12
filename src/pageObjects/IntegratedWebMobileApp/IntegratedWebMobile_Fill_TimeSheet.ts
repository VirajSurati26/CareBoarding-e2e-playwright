import { remote, Browser } from 'webdriverio';

export class MobileApp {
    private driver!: Browser;

    //Connect to the Android app through Appium.
    async connect(): Promise<void> {
        this.driver = await remote({
            hostname: '127.0.0.1',
            port: 4724,

            capabilities: {
                platformName: 'Android',
                'appium:automationName': 'UiAutomator2',
                'appium:deviceName': 'emulator-5554',
                // Change these two values for your application
                'appium:appPackage': 'com.careboarding',
                'appium:appActivity': 'com.careboarding.MainActivity',
                'appium:noReset': true,
                'appium:autoGrantPermissions': true,
                'appium:newCommandTimeout': 300,
            },
        });

        console.log('✅ Connected to Android app');
    }

    //Wait for a short amount of time.
    private async wait(ms: number): Promise<void> {
        await this.driver.pause(ms);
    }

    //Handle the initial Continue/Allow screen.
    async handleInitialScreen(): Promise<void> {
        const continueButton = await this.driver.$('//*[@text="Continue" or @content-desc="Continue"]');

        if (await continueButton.isExisting()) {
            await continueButton.click();
            await this.wait(1000);
        }

        const allowButton = await this.driver.$('//*[@text="Allow" or @text="While using the app"]');

        if (await allowButton.isExisting()) {
            await allowButton.click();
            await this.wait(1000);
        }
    }

    //Login to the application.
    async login(emailAddress: string, password: string): Promise<void> {
        const email = await this.driver.$('android=new UiSelector().className("android.widget.EditText").instance(0)');
        const passwordField = await this.driver.$('android=new UiSelector().className("android.widget.EditText").instance(1)');
        await email.waitForDisplayed({ timeout: 10000 });
        await email.setValue(emailAddress);
        await passwordField.setValue(password);
        await this.driver.hideKeyboard().catch(() => { });
        const signInButton = await this.driver.$('//*[@text="Sign In" or @content-desc="Sign In"]');
        await signInButton.waitForDisplayed({ timeout: 10000 });
        await signInButton.click();
        await this.wait(3000);
        console.log('✅ Login completed');
    }

    //Open Visits screen.
    async openVisits(): Promise<void> {
        const visitsButton = await this.driver.$('//*[contains(@text, "Visits") or contains(@content-desc, "Visits")]');
        await visitsButton.waitForDisplayed({ timeout: 10000 });
        await visitsButton.click();
        await this.wait(2000);
        console.log('✅ Visits screen opened');
    }

    //Search for a patient.
    async searchPatient(patientName: string): Promise<void> {
        const searchBox = await this.driver.$('android=new UiSelector().resourceId("searchInput")');
        await searchBox.waitForDisplayed({ timeout: 10000 });
        await searchBox.click();
        await searchBox.clearValue();
        await searchBox.setValue(patientName);
        await this.wait(2000);
        console.log(`🔎 Searching for: ${patientName}`);
    }

    //Check whether a patient/visit exists.
    async visitExists(patientName: string): Promise<boolean> {
        const visit = await this.driver.$(`//*[contains(@text, "${patientName}") or contains(@content-desc, "${patientName}")]`);
        return await visit.isExisting();
    }

    //Open a patient's visit.
    async openPatientVisit(patientName: string): Promise<void> {
        const visit = await this.driver.$(`//*[contains(@text, "${patientName}") or contains(@content-desc, "${patientName}")]`);
        await visit.waitForDisplayed({ timeout: 10000 });
        await visit.click();
        await this.wait(2000);
        console.log(`✅ Opened visit for ${patientName}`);
    }

    //Perform client verification.
    async clientVerification(): Promise<void> {
        const timeVerified = await this.driver.$('//*[@text="Time Verified" or @content-desc="Time Verified"]');
        await timeVerified.waitForDisplayed({ timeout: 10000 });
        const checkboxes = await this.driver.$$('android=new UiSelector().className("android.widget.CheckBox")');

        if ((await checkboxes.length) >= 2) {
            await checkboxes[0].click();
            await checkboxes[1].click();
        }

        console.log('✅ Client verification completed');
    }

    //Close Appium session.
    async close(): Promise<void> {
        if (this.driver) {
            await this.driver.deleteSession();
            console.log('✅ Appium session closed');
        }
    }

    async closeDevice(): Promise<void> {
        await this.close();
    }
}
