import { remote, Browser } from 'webdriverio';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';

const execAsync = (command: string, options: any = {}): Promise<{ stdout: string; stderr: string }> => {
    return promisify(exec)(command, { windowsHide: true, encoding: 'utf8', ...options }) as any;
};

export class MobileApp {
    private driver!: Browser;
    private appiumProcess: any = null;

    // ------------------------- Start Emulator -------------------------
    async startEmulator(avd = 'Pixel_6a'): Promise<void> {
        try {
            const { stdout } = await execAsync('adb devices');
            if (stdout.includes('emulator-') || stdout.includes('device\n')) {
                console.log('✅ Active emulator detected');
                return;
            }
        } catch (error) {
            console.log('⚠️ Could not check for existing devices:', error);
        }
        console.log(`🚀 Starting ${avd}...`);
        exec(`emulator -avd ${avd} -no-boot-anim -no-audio -gpu host -no-snapshot-load`, { windowsHide: true });

        for (let i = 0; i < 30; i++) {
            try {
                const { stdout } = await execAsync('adb devices');
                if (stdout.includes('emulator-')) {
                    const { stdout: stateOut } = await execAsync(`adb -s emulator-5554 get-state`);
                    if (stateOut.trim() === 'device') {
                        console.log('✨ Emulator booted and is online');
                        break;
                    }
                }
            } catch (e) { }
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    // ------------------------- Start Appium -------------------------
    async startAppium(): Promise<void> {
        // Find and kill any existing process listening on port 4724
        try {
            const { stdout } = await execAsync('netstat -ano');
            const lines = stdout.split('\n');
            for (const line of lines) {
                if (line.includes(':4724')) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    if (pid && pid !== '0' && !isNaN(Number(pid))) {
                        console.log(`Killing old Appium process on port 4724 (PID: ${pid})...`);
                        await execAsync(`taskkill /F /PID ${pid}`).catch(() => {});
                    }
                }
            }
        } catch (e) {
            console.log('⚠️ Failed to check/kill existing Appium processes:', e);
        }

        console.log('🚀 Starting Appium Server on port 4724...');
        try {
            const appiumPath = require.resolve('appium');
            this.appiumProcess = spawn(process.execPath, [appiumPath, '--port', '4724', '--log-level', 'error'], {
                stdio: 'ignore',
                windowsHide: true,
            });
        } catch (err) {
            console.warn('⚠️ Could not resolve appium path, falling back to global npx appium:', err);
            this.appiumProcess = spawn('npx', ['appium', '--port', '4724', '--log-level', 'error'], {
                stdio: 'ignore',
                shell: true,
                windowsHide: true,
            });
        }

        for (let i = 0; i < 15; i++) {
            try {
                const res = await fetch('http://127.0.0.1:4724/status');
                if (res && res.ok) {
                    console.log('✅ Appium is up and ready');
                    return;
                }
            } catch (_) { }
            await new Promise(r => setTimeout(r, 2000));
        }
        console.warn('⚠️ Appium did not become ready within expected time');
    }

    // ------------------------- Connect Device -------------------------
    async connectDevice(deviceName = 'emulator-5554', appPath?: string): Promise<void> {
        for (let i = 0; i < 30; i++) {
            try {
                const { stdout } = await execAsync('adb devices');
                if (stdout.includes(deviceName)) break;
            } catch (_) { }
            await new Promise(r => setTimeout(r, 1000));
        }

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                this.driver = await remote({
                    hostname: '127.0.0.1',
                    port: 4724,
                    path: '/',
                    connectionRetryTimeout: 60000,
                    connectionRetryCount: 3,
                    logLevel: 'warn',
                    capabilities: {
                        platformName: 'Android',
                        'appium:deviceName': deviceName,
                        'appium:automationName': 'UiAutomator2',
                        'appium:appPackage': 'com.careboarding',
                        'appium:appActivity': 'com.example.care_boarding.MainActivity',
                        'appium:appWaitActivity': 'com.example.care_boarding.MainActivity',
                        'appium:noReset': true,
                        'appium:skipDeviceInitialization': false,
                        'appium:skipServerInstallation': false,
                        'appium:newCommandTimeout': 300,
                        'appium:ignoreHiddenApiPolicyError': true,
                        'appium:uiautomator2ServerLaunchTimeout': 120000,
                        'appium:autoGrantPermissions': true,
                        'appium:app': appPath || process.env.ANDROID_APK_PATH || ''
                    }
                });

                if (appPath) {
                    try {
                        const isInstalled = await this.driver.isAppInstalled('com.careboarding');
                        if (!isInstalled) {
                            console.log('📦 Installing APK on device...');
                            await execAsync(`adb -s ${deviceName} install -r "${appPath}"`);
                        }
                    } catch (installErr) {
                        console.warn('⚠️ APK installation check failed:', installErr);
                    }
                }

                await this.driver.launchApp();
                await this.verifyAppLaunched();
                console.log('✅ Mobile app launched successfully');
                return;
            } catch (err) {
                console.error(`❌ Attempt ${attempt} failed to create Appium session:`, err);
                if (attempt === 3) throw err;
                await new Promise(r => setTimeout(r, 5000));
            }
        }
    }

    // ------------------------- Handle Language -------------------------
    async handleLanguage(): Promise<void> {
        try {
            let btn = await this.driver.$('android=new UiSelector().textContains("Continue")');
            if (!(await btn.isExisting())) {
                btn = await this.driver.$('android=new UiSelector().descriptionContains("Continue")');
            }

            if (await btn.waitForExist({ timeout: 8000 })) {
                console.log('👉 Clicking Continue...');
                await btn.click();
                await new Promise(r => setTimeout(r, 2000));
            }
        } catch (e) {
            console.log('ℹ️ Language screen not found or already passed.');
        }
    }

    // ------------------------- Login -------------------------
    async login(user: string, pass: string): Promise<void> {
        await this.handleLanguage();

        console.log('📧 Entering email...');
        let email = await this.driver.$('android=new UiSelector().className("android.widget.EditText").instance(0)');
        try {
            await email.waitForExist({ timeout: 20000 });
        } catch (e) {
            console.log('⚠️ Primary email selector not found, attempting fallback using resourceId');
            const fallbackId = process.env.ANDROID_EMAIL_RESOURCE_ID || 'com.careboarding:id/email';
            email = await this.driver.$(`android=new UiSelector().resourceId("${fallbackId}")`);
            await email.waitForExist({ timeout: 20000 });
        }
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

        let signInBtn = await this.driver.$('android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().description("Sign In"))');
        if (!(await signInBtn.isExisting())) {
            signInBtn = await this.driver.$('android=new UiSelector().description("Sign In")');
        }
        await signInBtn.waitForExist({ timeout: 10000 });
        await signInBtn.click();
        await new Promise(r => setTimeout(r, 10000));
    }

    // ------------------------- Go to the "Visits" Screen -------------------------
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

    // ------------------------- Search Patient -------------------------
    async searchPatient(name: string): Promise<void> {
        const input = await this.driver.$('android=new UiSelector().resourceId("searchInput")');
        if (await input.isDisplayed()) await input.setValue(name);
    }

    // ------------------------- Check Visit Exists -------------------------
    async checkVisitExists(name: string, visitTime?: string): Promise<boolean> {
        const clean = this.cleanPatientName(name);
        if (visitTime) {
            const selector = `//*[contains(@text, "${visitTime}") or contains(@content-desc, "${visitTime}")]`;
            const existsByTime = await this.driver.$(selector).isExisting().catch(() => false);
            if (existsByTime) return true;
        }
        return (await this.driver.$(`//*[contains(@text, "${clean}") or contains(@content-desc, "${clean}")]`)).isExisting().catch(() => false);
    }

    // ------------------------- Find Recent Visit -------------------------
    async findRecentVisit(empName: string, patientName: string, visitTime?: string): Promise<boolean> {
        await this.goToVisits();
        await new Promise(r => setTimeout(r, 5000));

        console.log(`🔍 Searching mobile app for patient: "${patientName}"`);
        await this.searchPatient(patientName);
        await new Promise(r => setTimeout(r, 5000));

        const exists = await this.checkVisitExists(patientName, visitTime);
        if (!exists) {
            console.log(`⚠️ Visit not found using patientName search. Trying fallback to employee name "${empName}"...`);
            await this.searchPatient(empName);
            await new Promise(r => setTimeout(r, 5000));
            return this.checkVisitExists(patientName, visitTime);
        }
        return true;
    }

    // ------------------------- Click Visit -------------------------
    async clickVisit(patientName: string, visitTime?: string): Promise<void> {
        let selector = '';
        const clean = this.cleanPatientName(patientName);
        if (visitTime) {
            console.log(`Searching for visit card with time containing: ${visitTime}`);
            selector = `//*[contains(@text, "${visitTime}") or contains(@content-desc, "${visitTime}")]`;
            const el = await this.driver.$(selector);
            if (await el.isExisting()) {
                await el.click();
                return;
            }
            console.log(`⚠️ Visit not found by time "${visitTime}". Falling back to patient name "${clean}"...`);
        }

        selector = `//*[contains(@text, "${clean}") or contains(@content-desc, "${clean}")]`;
        const el = await this.driver.$(selector);
        await el.waitForExist({ timeout: 10000 });
        await el.click();
    }


    // ------------------------- Clock In -------------------------
    async clickClockIn(): Promise<void> {
        console.log('⏰ Clicking Clock In button...');
        const btn = await this.driver.$('//*[contains(@text, "CLOCK IN") or contains(@content-desc, "CLOCK IN")]');
        await btn.waitForExist({ timeout: 10000 });
        await btn.click();
        await new Promise(r => setTimeout(r, 5000));

        const confirmButton = await this.driver.$('//android.view.View[@content-desc="Confirm"] | //android.widget.Button[@text="Confirm"]');
        await confirmButton.waitForExist({ timeout: 10000 });
        await confirmButton.click();

        const okButton = await this.driver.$('android=new UiSelector().description("Ok")');
        await okButton.waitForExist({ timeout: 10000 });
        await okButton.click();
    }

    // ------------------------- Clock Out -------------------------
    async clickClockOut(): Promise<void> {
        console.log('⏰ Clicking Clock Out button...');
        const btn = await this.driver.$('//*[contains(@text, "CLOCK OUT") or contains(@content-desc, "CLOCK OUT")]');
        await btn.waitForExist({ timeout: 10000 });
        await btn.click();

        const confirmButton = await this.driver.$('//android.view.View[@content-desc="Confirm"] | //android.widget.Button[@text="Confirm"]');
        await confirmButton.waitForExist({ timeout: 10000 });
        await confirmButton.click();
        await new Promise(r => setTimeout(r, 5000));

        const icon = await this.driver.$('//*[@content-desc="Meal Preparation"]/following-sibling::*[1]');
        await icon.waitForExist({ timeout: 10000 });
        await icon.click();
    }

    // ------------------------- Client Verification -------------------------
    async clientVerification(): Promise<void> {
        console.log('📋 Scrolling to Client Verification...');
        await this.driver.$('android=new UiScrollable(new UiSelector().scrollable(true).instance(0)).scrollIntoView(new UiSelector().text("Time Verified"))');
        await new Promise(r => setTimeout(r, 1000));
        await this.clickCheckboxByIndex(0);
        await this.clickCheckboxByIndex(1);
    }

    // ------------------------- Patient Signature -------------------------
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
            console.log('⚠️ Could not find canvas, drawing skipped');
        }
    }

    // ------------------------- Click Checkbox By Index -------------------------
    async clickCheckboxByIndex(index: number): Promise<void> {
        console.log(`☑️ Clicking checkbox at index ${index}...`);
        const checkbox = await this.driver.$(`android=new UiSelector().className("android.widget.CheckBox").instance(${index})`);
        if (await checkbox.isExisting()) {
            await checkbox.click();
            await new Promise(r => setTimeout(r, 500));
        } else {
            console.log('⚠️ Checkbox not found at index ' + index);
        }
    }

    // ------------------------- Save Button -------------------------
    async saveButton(): Promise<void> {
        console.log('📋 Clicking Save button...');
        const button = await this.driver.$('//*[@content-desc="Save" or @text="Save"]');
        await button.waitForExist({ timeout: 10000 });
        await button.click();
    }

    // ------------------------- Ok Button -------------------------
    async okButton(): Promise<void> {
        console.log('📋 Clicking Ok button...');
        const button = await this.driver.$('//*[@content-desc="Ok" or @text="Ok"]');
        await button.waitForExist({ timeout: 10000 });
        await button.click();
    }

    // ------------------------- Patient Name Cleaning Helper -------------------------
    cleanPatientName(name: string): string {
        const parts = name.split('(')[0].split(',').map(p => p.trim());
        return parts.length > 1 ? `${parts[1]} ${parts[0]}` : parts[0];
    }

    // ------------------------- Close Device -------------------------
    async closeDevice(): Promise<void> {
        if (this.driver) await this.driver.deleteSession().catch(() => { });
        if (this.appiumProcess) {
            console.log('🛑 Stopping Appium Server...');
            try {
                this.appiumProcess.kill();
            } catch (e) {
                console.log('⚠️ Failed to kill Appium process:', e);
            }
        }
    }

    // ------------------------- Verify App Launched -------------------------
    async verifyAppLaunched(): Promise<void> {
        try {
            await this.driver.pause(2000);
            console.log('✅ Verified mobile app is active');
        } catch (e) {
            console.warn('⚠️ Verification of mobile app failed', e);
        }
    }
}