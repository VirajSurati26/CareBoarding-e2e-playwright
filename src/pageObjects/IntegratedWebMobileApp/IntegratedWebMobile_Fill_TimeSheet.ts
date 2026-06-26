import { remote, Browser } from 'webdriverio';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

const execAsync = (command: string, options: any = {}): Promise<{ stdout: string; stderr: string }> => {
    return promisify(exec)(command, { windowsHide: true, encoding: 'utf8', ...options }) as any;
};

export class MobileApp {
    private driver!: Browser;
    private appiumProcess: any = null;

    // ------------------------- Start Emulator -------------------------
    async startEmulator(avd = process.env.AVD_NAME || 'Pixel_6a'): Promise<void> {
        try {
            const { stdout } = await execAsync('adb devices');
            if (stdout.includes('emulator-') || stdout.includes('device\n')) {
                return;
            }
        } catch (error) {
            console.log('⚠️ Could not check for existing devices:', error);
        }
        const androidHome = process.env.ANDROID_HOME;
        const emulatorCmd = androidHome ? `"${androidHome}\\emulator\\emulator.exe"` : 'emulator';
        exec(`${emulatorCmd} -avd ${avd} -no-boot-anim -no-audio -gpu host -no-snapshot-load`, { windowsHide: true });

        const expectedDevice = process.env.ANDROID_DEVICE_NAME || 'emulator-5554';
        for (let i = 0; i < 30; i++) {
            try {
                const { stdout } = await execAsync('adb devices');
                if (stdout.includes('emulator-')) {
                    const match = stdout.match(/(emulator-\d+)\s+device/);
                    const deviceId = match ? match[1] : expectedDevice;
                    const { stdout: stateOut } = await execAsync(`adb -s ${deviceId} get-state`);
                    if (stateOut.trim() === 'device') {
                        break;
                    }
                }
            } catch (error) {
                console.error('Error occurred while checking emulator status:', error);
            }
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    // ------------------------- Start Appium -------------------------
    async startAppium(): Promise<void> {
        this.ensureAndroidEnv();
        const appiumPort = process.env.APPIUM_PORT || '4724';
        // Find and kill any existing process listening on port
        try {
            const { stdout } = await execAsync('netstat -ano');
            const lines = stdout.split('\n');
            for (const line of lines) {
                if (line.includes(`:${appiumPort}`)) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    if (pid && pid !== '0' && !isNaN(Number(pid))) {
                        await execAsync(`taskkill /F /PID ${pid}`).catch(() => { });
                    }
                }
            }
        } catch (e) {
            console.log('⚠️ Failed to check/kill existing Appium processes:', e);
        }

        try {
            const appiumPath = require.resolve('appium');
            this.appiumProcess = spawn(process.execPath, [appiumPath, '--port', appiumPort, '--log-level', 'error'], {
                stdio: 'ignore',
                windowsHide: true,
            });
        } catch (err) {
            console.warn('⚠️ Could not resolve appium path, falling back to global npx appium:', err);
            this.appiumProcess = spawn('npx', ['appium', '--port', appiumPort, '--log-level', 'error'], {
                stdio: 'ignore',
                shell: true,
                windowsHide: true,
            });
        }

        for (let i = 0; i < 15; i++) {
            try {
                const res = await fetch(`http://127.0.0.1:${appiumPort}/status`);
                if (res && res.ok) {
                    return;
                }
            } catch (error) {
                console.error('Error occurred while checking Appium status:', error);
            }
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    // ------------------------- Helper: Verify Android env vars -------------------------
    private ensureAndroidEnv(): void {
        const androidHome = process.env.ANDROID_HOME;
        const androidSdkRoot = process.env.ANDROID_SDK_ROOT;

        if (!androidHome) {
            console.warn('⚠️ ANDROID_HOME environment variable is not set. Please set it in your .env file.');
        } else if (!require('fs').existsSync(androidHome)) {
            console.warn(`⚠️ ANDROID_HOME path "${androidHome}" does not exist.`);
        }

        if (!androidSdkRoot) {
            console.warn('⚠️ ANDROID_SDK_ROOT environment variable is not set. Please set it in your .env file.');
        } else if (!require('fs').existsSync(androidSdkRoot)) {
            console.warn(`⚠️ ANDROID_SDK_ROOT path "${androidSdkRoot}" does not exist.`);
        }
    }

    // ------------------------- Connect Device -------------------------
    async connectDevice(deviceName = process.env.ANDROID_DEVICE_NAME || 'emulator-5554', appPath?: string): Promise<void> {
        for (let i = 0; i < 30; i++) {
            try {
                const { stdout } = await execAsync('adb devices');
                if (stdout.includes(deviceName)) break;
            } catch (error) {
                console.error('Error occurred while checking device status:', error);
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        const appiumPort = process.env.APPIUM_PORT || '4724';
        const appPackage = process.env.ANDROID_APP_PACKAGE || 'com.careboarding';
        const appActivity = process.env.ANDROID_APP_ACTIVITY || 'com.example.care_boarding.MainActivity';
        const appWaitActivity = process.env.ANDROID_APP_WAIT_ACTIVITY || 'com.example.care_boarding.MainActivity';

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                this.driver = await remote({
                    hostname: '127.0.0.1',
                    port: parseInt(appiumPort, 10),
                    path: '/',
                    connectionRetryTimeout: 60000,
                    connectionRetryCount: 3,
                    logLevel: 'warn',
                    capabilities: {
                        platformName: 'Android',
                        'appium:deviceName': deviceName,
                        'appium:automationName': 'UiAutomator2',
                        'appium:appPackage': appPackage,
                        'appium:appActivity': appActivity,
                        'appium:appWaitActivity': appWaitActivity,
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
                        const isInstalled = await this.driver.isAppInstalled(appPackage);
                        if (!isInstalled) {
                            await execAsync(`adb -s ${deviceName} install -r "${appPath}"`);
                        }
                    } catch (installErr) {
                        console.error('Error occurred while checking APK installation:', installErr);
                    }
                }

                await this.driver.launchApp();
                await this.verifyAppLaunched();
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

        let email = await this.driver.$('android=new UiSelector().className("android.widget.EditText").instance(0)');
        try {
            await email.waitForExist({ timeout: 20000 });
        } catch (e) {
            const appPackage = process.env.ANDROID_APP_PACKAGE || 'com.careboarding';
            const fallbackId = process.env.ANDROID_EMAIL_RESOURCE_ID || `${appPackage}:id/email`;
            email = await this.driver.$(`android=new UiSelector().resourceId("${fallbackId}")`);
            await email.waitForExist({ timeout: 20000 });
        }
        await email.click();
        await new Promise(r => setTimeout(r, 1000));
        await email.setValue(user);

        const password = await this.driver.$('android=new UiSelector().className("android.widget.EditText").instance(1)');
        await password.waitForExist({ timeout: 5000 });
        await password.click();
        await new Promise(r => setTimeout(r, 1000));
        await password.setValue(pass);

        try { await this.driver.hideKeyboard(); } catch (error) {
            console.error('Error occurred while hiding keyboard:', error);
        }

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
        try {
            const visitsBtn = await this.driver.$('android=new UiSelector().descriptionContains("Visits")');
            if (await visitsBtn.waitForExist({ timeout: 2000 })) {
                await visitsBtn.click();
                return;
            }
        } catch (error) {
            console.error('Error occurred while checking visits button:', error);
        }
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

        await this.searchPatient(patientName);
        await new Promise(r => setTimeout(r, 5000));

        const exists = await this.checkVisitExists(patientName, visitTime);
        if (!exists) {
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
            selector = `//*[contains(@text, "${visitTime}") or contains(@content-desc, "${visitTime}")]`;
            const el = await this.driver.$(selector);
            if (await el.isExisting()) {
                await el.click();
                return;
            }
        }

        selector = `//*[contains(@text, "${clean}") or contains(@content-desc, "${clean}")]`;
        const el = await this.driver.$(selector);
        await el.waitForExist({ timeout: 10000 });
        await el.click();
    }

    // ------------------------- Client Verification -------------------------

    async clientVerification(): Promise<void> {
        await this.driver.$('android=new UiScrollable(new UiSelector().scrollable(true).instance(0)).scrollIntoView(new UiSelector().text("Time Verified"))');
        await new Promise(r => setTimeout(r, 1000));
        await this.clickCheckboxByIndex(0);
        await this.clickCheckboxByIndex(1);
    }


    // ------------------------- Patient Signature -------------------------

    async scrollToDrawCanvas(): Promise<void> {

        // Scroll until we find DrawCanvas or scroll limit
        let canvasFound = false;
        let attempts = 0;
        const maxAttempts = 20;

        while (!canvasFound && attempts < maxAttempts) {
            try {
                const canvas = await this.driver.$('android=new UiSelector().description("DrawCanvas")');
                if (await canvas.isExisting()) {
                    canvasFound = true;
                    break;
                }
            } catch (error) {
                // Ignore error and try scrolling
            }

            // Try scrolling forward
            try { await this.driver.$('android=new UiScrollable(new UiSelector().scrollable(true)).scrollForward()'); } catch (e) { /* ignore scroll errors */ }
            await new Promise(r => setTimeout(r, 500));
            attempts++;
        }
        if (!canvasFound) {
            console.log('⚠️ DrawCanvas not found after scrolling');
        }
    }

    async patientsSignature(): Promise<void> {

        // Click the checkbox, scrolling if necessary to find it
        const checkbox = await this.findScrollableCheckbox('//android.widget.ScrollView/android.view.View[11]');
        await checkbox.click();
        await new Promise(r => setTimeout(r, 1000));

        // Try to find DrawCanvas, scrolling if necessary
        await this.scrollToDrawCanvas();

        let canvas = await this.driver.$('android=new UiSelector().description("DrawCanvas")');
        try {
            await canvas.waitForExist({ timeout: 5000 });
        } catch (error) {
            canvas = await this.driver.$('//android.widget.ImageView');
            await canvas.waitForExist({ timeout: 5000 });
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
        const checkbox = await this.driver.$(`android=new UiSelector().className("android.widget.CheckBox").instance(${index})`);
        if (await checkbox.isExisting()) {
            await checkbox.click();
            await new Promise(r => setTimeout(r, 500));
        } else {
            console.log('⚠️ Checkbox not found at index ' + index);
        }
    }

    // ------------------------- Find Scrollable Checkbox -------------------------

    private async findScrollableCheckbox(xpath: string): Promise<any> {
        // Attempt to locate the element directly
        let element = await this.driver.$(xpath);
        if (await element.isExisting()) {
            return element;
        }
        // If not found, try scrolling a few times
        const maxScrolls = 5;
        for (let i = 0; i < maxScrolls; i++) {
            try {
                await this.driver.$('android=new UiScrollable(new UiSelector().scrollable(true)).scrollForward()');
            } catch (error) {
                console.error('Error occurred while scrolling:', error);
            }
            element = await this.driver.$(xpath);
            if (await element.isExisting()) {
                return element;
            }
        }
        // Return element (may not exist) for caller to handle
        return element;
    }

    // ------------------------- Save Button -------------------------

    async saveButton(): Promise<void> {
        const button = await this.driver.$('//*[@content-desc="Save" or @text="Save"]');
        await button.waitForExist({ timeout: 10000 });
        await button.click();
    }

    // ------------------------- Ok Button -------------------------

    async okButton(): Promise<void> {
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
        } catch (e) {
            console.warn('⚠️ Verification of mobile app failed', e);
        }
    }
}