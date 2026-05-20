import { remote, Browser } from 'webdriverio';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class MobileApp {
    private driver!: Browser;

    //------------------------- Start Emulator -------------------------/ 

    async startEmulator(avd = 'Pixel_6a'): Promise<void> {
        try {
            const { stdout } = await execAsync('adb devices');
            // Check if ANY emulator/device is already running (e.g. emulator-5554 or emulator-5556)
            // If yes, we reuse it immediately to save time and system resources!
            if (stdout.includes('emulator-') || stdout.includes('device\n')) {
                return console.log('✅ Active emulator detected');
            }
        } catch { }

        console.log(`🚀 Starting ${avd}...`);
        exec(`emulator -avd ${avd} -no-boot-anim -no-audio -gpu host -no-snapshot-load`);

        for (let i = 0; i < 30; i++) {
            try {
                const { stdout } = await execAsync('adb shell getprop sys.boot_completed');
                if (stdout.trim() === '1') return console.log('✨ Booted successfully!');
            } catch { }
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    //------------------------- Start Appium -------------------------/
    async startAppium(): Promise<void> {
        try {
            const res = await fetch('http://127.0.0.1:4724/status').catch(() => null);
            if (res && res.ok) return console.log('✅ Appium port 4724 is ready');
        } catch { }

        console.log('🚀 Starting Appium Server on port 4724...');
        exec('npx appium --port 4724');
        await new Promise(r => setTimeout(r, 15000)); // Wait for Appium service to boot up
    }

    //------------------------- Connect Device -------------------------/    
    async connectDevice(deviceName = 'emulator-5554', appPath?: string): Promise<void> {
        let activeDevice = deviceName;
        try {
            // Automatically detect the actual active emulator (e.g., emulator-5556) to prevent test hangs!
            const { stdout } = await execAsync('adb devices');
            const match = stdout.match(/emulator-\d+/);
            if (match) {
                activeDevice = match[0];
                console.log(`🔌 Dynamically resolved active emulator: ${activeDevice}`);
            }
        } catch { }

        this.driver = await remote({
            hostname: '127.0.0.1', port: 4724, path: '/',
            connectionRetryTimeout: 60000,
            connectionRetryCount: 3,
            logLevel: 'warn', // Keeps terminal logs clean and free of HTTP traffic noise
            capabilities: {
                platformName: 'Android',
                'appium:deviceName': activeDevice,
                'appium:automationName': 'UiAutomator2',
                'appium:appPackage': 'com.careboarding',
                'appium:appActivity': 'com.example.care_boarding.MainActivity',
                'appium:noReset': true,
                'appium:app': appPath
            }
        });
    }

    //------------------------- Handle Language -------------------------/ 
    async handleLanguage(): Promise<void> {
        try {
            // Locate the Continue button using accessibility description or text selector
            let btn = await this.driver.$('android=new UiSelector().textContains("Continue")');
            if (!(await btn.isExisting())) {
                btn = await this.driver.$('android=new UiSelector().descriptionContains("Continue")');
            }

            if (await btn.waitForExist({ timeout: 8000 })) {
                console.log('👉 Clicking Continue...');
                await btn.click();
                await new Promise(r => setTimeout(r, 2000)); // Short wait for screen transition
            }
        } catch (e) {
            console.log('ℹ️ Language screen not found or already passed.');
        }
    }

    //------------------------- Login -------------------------/    
    async login(user: string, pass: string): Promise<void> {
        await this.handleLanguage();

        console.log('📧 Entering email...');
        const email = await this.driver.$('android=new UiSelector().className("android.widget.EditText").instance(0)');
        await email.waitForExist({ timeout: 10000 });
        await email.click();
        await new Promise(r => setTimeout(r, 1000));
        await email.setValue(user);

        console.log('🔑 Entering password...');
        const password = await this.driver.$('android=new UiSelector().className("android.widget.EditText").instance(1)');
        await password.waitForExist({ timeout: 5000 });
        await password.click();
        await new Promise(r => setTimeout(r, 1000));
        await password.setValue(pass);

        console.log('👆 Scrolling to and clicking Sign In...');
        try { await this.driver.hideKeyboard(); } catch (e) { }

        // Scroll to find the Sign In button, or click it directly if it's already visible
        let signInBtn = await this.driver.$('android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().description("Sign In"))');
        if (!(await signInBtn.isExisting())) {
            signInBtn = await this.driver.$('android=new UiSelector().description("Sign In")');
        }
        await signInBtn.waitForExist({ timeout: 10000 });
        await signInBtn.click();

        await new Promise(r => setTimeout(r, 10000)); // Wait for login dashboard to load
    }

    //------------------------- Go to the "Visits" Screen -------------------------/    

    async goToVisits(): Promise<void> {
        console.log('👀 Waiting for Visits button...');

        try {
            const visitsBtn = await this.driver.$('android=new UiSelector().descriptionContains("Visits")');
            if (await visitsBtn.waitForExist({ timeout: 2000 })) {
                await visitsBtn.click();
                return;
            }
        } catch (e) { }
        const visitsBtn = await this.driver.$('android=new UiSelector().textContains("Visits")');
        await visitsBtn.waitForExist({ timeout: 10000 });
        await visitsBtn.click();
    }

    //------------------------- Search Patient -------------------------/        
    async searchPatient(name: string): Promise<void> {
        try {
            const input = await this.driver.$('android=new UiSelector().resourceId("searchInput")');
            if (await input.isDisplayed()) await input.setValue(name);
        } catch { }
    }

    //------------------------- Check Visit Exists -------------------------/ 
    async checkVisitExists(name: string, visitTime?: string): Promise<boolean> {
        if (visitTime) {
            const selector = `//*[contains(@text, "${visitTime}") or contains(@content-desc, "${visitTime}")]`;
            return (await this.driver.$(selector)).isExisting().catch(() => false);
        }
        const clean = this.cleanPatientName(name);
        return (await this.driver.$(`//*[contains(@text, "${clean}")]`)).isExisting().catch(() => false);
    }

    //------------------------- Find Recent Visit -------------------------/    

    async findRecentVisit(empName: string, patientName: string, visitTime?: string): Promise<boolean> {
        await this.goToVisits();
        await new Promise(r => setTimeout(r, 5000));
        await this.searchPatient(empName);
        await new Promise(r => setTimeout(r, 5000));
        return this.checkVisitExists(patientName, visitTime);
    }

    //------------------------- Click Visit -------------------------/

    async clickVisit(patientName: string, visitTime?: string): Promise<void> {
        let selector = '';
        if (visitTime) {
            console.log(`Searching for visit card with time containing: ${visitTime}`);
            selector = `//*[contains(@text, "${visitTime}") or contains(@content-desc, "${visitTime}")]`;
        } else {
            const clean = this.cleanPatientName(patientName);
            selector = `//*[contains(@text, "${clean}") or contains(@content-desc, "${clean}")]`;
        }
        const el = await this.driver.$(selector);
        await el.waitForExist({ timeout: 10000 });
        await el.click();
    }

    //-------------------------Perform the Clock In successfully -------------------------/

    async clickClockIn(): Promise<void> {
        console.log('⏰ Clicking Clock In button...');
        const btn = await this.driver.$('//*[contains(@text, "CLOCK IN") or contains(@content-desc, "CLOCK IN")]');
        await btn.waitForExist({ timeout: 10000 });
        await btn.click();
        await new Promise(r => setTimeout(r, 5000));

        //---------Perform the clock-In actions confirmbutton Click--------------/
        const confirmButtonClockIn = await this.driver.$('//android.view.View[@content-desc="Confirm"] | //android.widget.Button[@text="Confirm"]');
        await confirmButtonClockIn.waitForExist({ timeout: 10000 });
        await confirmButtonClockIn.click();

        //---------Perform the Ok button click ----------------/
        const okButton = await this.driver.$('android=new UiSelector().description("Ok")');
        await okButton.waitForExist({ timeout: 10000 });
        await okButton.click();
    }

    //-------------------------Perform the Clock-Out successfully -------------------------/

    async clickClockOut(): Promise<void> {
        console.log('⏰ Clicking Clock Out button...');
        const btn = await this.driver.$('//*[contains(@text, "CLOCK OUT") or contains(@content-desc, "CLOCK OUT")]');
        await btn.waitForExist({ timeout: 10000 });
        await btn.click();

        //---------Perform the clock-out actions confirmbutton Click--------------/
        const confirmButtonClocOut = await this.driver.$('//android.view.View[@content-desc="Confirm"] | //android.widget.Button[@text="Confirm"]');
        await confirmButtonClocOut.waitForExist({ timeout: 10000 });
        await confirmButtonClocOut.click();
        await new Promise(r => setTimeout(r, 5000));

        //---------Perform the Select the value "Plan Of Care Tasks"--------------/   

        // Find the icon directly following "Meal Preparation"
        const icon = await this.driver.$('//*[@content-desc="Meal Preparation"]/following-sibling::*[1]');
        await icon.waitForExist({ timeout: 10000 });
        await icon.click();
    }

    //--------------Perform the "Client Verification" check-box---------

    async clientVerification(): Promise<void> {
        console.log('📋 Scrolling to Client Verification...');
        // Scroll once to make checkboxes visible
        await this.driver.$('android=new UiScrollable(new UiSelector().scrollable(true).instance(0)).scrollIntoView(new UiSelector().text("Time Verified"))');
        await new Promise(r => setTimeout(r, 1000));
        // Click first checkbox (Time Verified)
        await this.clickCheckboxByIndex(0);
        // Click second checkbox (Service Verified)
        await this.clickCheckboxByIndex(1);
    }

    //--------------Perform the "Patient Signature" Drawing--------

    async patientsSignature(): Promise<void> {
        const checkbox = await this.driver.$('//android.widget.ScrollView/android.view.View[11]');
        await checkbox.click();

        let canvas = await this.driver.$('android=new UiSelector().description("DrawCanvas")');

        try {
            await canvas.waitForExist({ timeout: 5000 });
        } catch (error) {
            console.log('⚠️ DrawCanvas not found by description. Trying android.widget.ImageView...');
            canvas = await this.driver.$('//android.widget.ImageView');
            await canvas.waitForExist({ timeout: 5000 }).catch(() => { });
        }

        if (await canvas.isExisting()) {
            const loc = await canvas.getLocation();
            const size = await canvas.getSize();

            await this.driver.performActions([{
                type: 'pointer',
                id: 'finger',
                parameters: { pointerType: 'touch' },
                actions: [
                    { type: 'pointerMove', duration: 0, x: loc.x + 30, y: loc.y + 50 },
                    { type: 'pointerDown', button: 0 },
                    { type: 'pointerMove', duration: 200, x: loc.x + size.width - 30, y: loc.y + size.height - 50 },
                    { type: 'pointerUp', button: 0 }
                ]
            }]);
        } else {
            console.log('⚠️ Could not find a canvas to draw on. Skipping drawing.');
            // Dump page source so we can find the real selector
            const source = await this.driver.getPageSource();
            require('fs').writeFileSync('appium_page_source.xml', source);
            console.log('📄 Saved UI hierarchy to appium_page_source.xml');
        }
    }

    //------------------------- Click Checkbox By Index (No Scroll) -------------------------/

    async clickCheckboxByIndex(index: number): Promise<void> {
        console.log(`☑️ Clicking checkbox at index ${index}...`);
        // Use direct index-based selector without scrolling
        const checkbox = await this.driver.$(`android=new UiSelector().className("android.widget.CheckBox").instance(${index})`);
        if (await checkbox.isExisting()) {
            await checkbox.click();
            await new Promise(r => setTimeout(r, 500));
        } else {
            console.log('⚠️ Checkbox not found at index ' + index);
        }
    }

    //--------------Perform the "Save" button click---------
    async saveButton(): Promise<void> {
        console.log('📋 Clicking Save button...');
        const button = await this.driver.$('//*[@content-desc="Save" or @text="Save"]');
        await button.waitForExist({ timeout: 10000 });
        await button.click();
    }

    //--------------Perform the "OK" button click---------
    async okButton(): Promise<void> {
        console.log('📋 Clicking Ok button...');
        const button = await this.driver.$('//*[@content-desc="Ok" or @text="Ok"]');
        await button.waitForExist({ timeout: 10000 });
        await button.click();
    }

    //------------------------- Patient Name Cleaning Helper -------------------------/
    cleanPatientName(name: string): string {
        const parts = name.split('(')[0].split(',').map(p => p.trim());
        return parts.length > 1 ? `${parts[1]} ${parts[0]}` : parts[0];
    }

    //------------------------- Close Device / Teardown -------------------------/

    async closeDevice(): Promise<void> {
        if (this.driver) await this.driver.deleteSession().catch(() => { });
    }
}