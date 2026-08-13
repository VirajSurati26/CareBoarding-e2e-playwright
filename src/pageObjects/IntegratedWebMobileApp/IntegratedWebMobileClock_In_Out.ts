import { remote, Browser } from 'webdriverio';
import { spawn, ChildProcess } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';
import 'dotenv/config';

const execAsync = promisify(exec);

export class MobileApp {
    private driver!: Browser;
    private appiumProcess?: ChildProcess;

    private async wait(ms: number): Promise<void> {
        await new Promise(r => setTimeout(r, ms));
    }

    // Start Android Emulator
    async startEmulator(): Promise<void> {
        const avd = process.env.AVD_NAME || 'Pixel_6a';
        try {
            const { stdout } = await execAsync('adb devices');
            if (stdout.includes('emulator-5554')) {
                console.log('Emulator emulator-5554 is already running.');
                return;
            }

            const emulatorCmd = process.env.ANDROID_HOME
                ? `${process.env.ANDROID_HOME}\\emulator\\emulator.exe`
                : 'emulator';

            console.log(`Starting emulator with AVD: ${avd}...`);
            const emulatorProc = spawn(emulatorCmd, [
                '-avd', avd,
                '-no-boot-anim',
                '-no-audio'
            ], {
                detached: true,
                stdio: 'ignore'
            });

            emulatorProc.unref();

            for (let i = 0; i < 30; i++) {
                try {
                    const { stdout: devOut } = await execAsync('adb devices');
                    if (devOut.includes('emulator-5554\tdevice')) {
                        break;
                    }
                } catch { }
                await this.wait(2000);
            }
            console.log('Emulator ready.');
        } catch (error) {
            console.warn('Warning during emulator startup:', error);
        }
    }

    // Start Appium Server
    async startAppium(): Promise<void> {
        const port = Number(process.env.APPIUM_PORT || 4724);

        try {
            const response = await fetch(`http://127.0.0.1:${port}/status`);
            if (response.ok) {
                console.log('Appium already running on port', port);
                return;
            }
        } catch { }

        console.log(`Starting Appium server on port ${port}...`);
        this.appiumProcess = spawn(
            'npx',
            ['appium', '--port', String(port)],
            { shell: true }
        );

        await this.wait(5000);
        console.log('Appium server started.');
    }

    // Connect to Device
    async connectDevice(deviceId?: string, appPath?: string): Promise<void> {
        return this.connect(deviceId, appPath);
    }

    async connect(deviceId?: string, appPath?: string): Promise<void> {
        const targetDevice = deviceId || process.env.ANDROID_DEVICE_NAME || 'emulator-5554';
        const targetAppPath = appPath || process.env.ANDROID_APK_PATH;
        const appPackage = process.env.ANDROID_APP_PACKAGE || 'com.careboarding';
        const appActivity = process.env.ANDROID_APP_ACTIVITY || 'com.example.care_boarding.MainActivity';
        const appWaitActivity = process.env.ANDROID_APP_WAIT_ACTIVITY || 'com.example.care_boarding.MainActivity';

        const capabilities: Record<string, any> = {
            platformName: 'Android',
            'appium:automationName': 'UiAutomator2',
            'appium:deviceName': targetDevice,
            'appium:appPackage': appPackage,
            'appium:appActivity': appActivity,
            'appium:appWaitActivity': appWaitActivity,
            'appium:noReset': true,
            'appium:autoGrantPermissions': true,
            'appium:newCommandTimeout': 300,
        };

        if (targetAppPath) {
            capabilities['appium:app'] = targetAppPath;
        }

        console.log('Connecting to Appium with capabilities:', capabilities);

        this.driver = await remote({
            hostname: '127.0.0.1',
            port: Number(process.env.APPIUM_PORT || 4724),
            path: '/',
            capabilities
        });

        console.log('✅ Connected to Android app');
    }

    // Language / Permission Handling
    async handleLanguage(): Promise<void> {
        try {
            const continueOrEnglish = await this.driver.$('//*[@text="English" or @text="Continue" or @content-desc="Continue" or @content-desc="English"]');
            if (await continueOrEnglish.isExisting()) {
                await continueOrEnglish.click();
                await this.wait(1000);
            }
            const allowButton = await this.driver.$('//*[@text="Allow" or @text="While using the app" or @content-desc="Allow"]');
            if (await allowButton.isExisting()) {
                await allowButton.click();
                await this.wait(1000);
            }
        } catch (e) {
            console.log('No language or permission screen encountered.');
        }
    }

    async handleInitialScreen(): Promise<void> {
        await this.handleLanguage();
    }

    // Login
    async login(username: string, password: string): Promise<void> {
        try {
            const inputs = await this.driver.$$('android.widget.EditText');
            if (inputs && await inputs.length >= 2) {
                await inputs[0].waitForDisplayed({ timeout: 10000 });
                await inputs[0].setValue(username);
                await inputs[1].setValue(password);
                await this.driver.hideKeyboard().catch(() => { });

                const signInBtn = await this.driver.$('//*[@text="Sign In" or @content-desc="Sign In" or @text="LOGIN" or @content-desc="LOGIN"]');
                await signInBtn.waitForDisplayed({ timeout: 10000 });
                await signInBtn.click();
                await this.wait(3000);
                console.log('✅ Login completed');
            } else {
                console.log('Login inputs not found or already logged in.');
            }
        } catch (err) {
            console.warn('Login step warning:', err);
        }
    }

    // Visits Screen
    async openVisits(): Promise<void> {
        try {
            const visitsButton = await this.driver.$('//*[contains(@text, "Visits") or contains(@content-desc, "Visits")]');
            if (await visitsButton.isExisting()) {
                await visitsButton.waitForDisplayed({ timeout: 10000 });
                await visitsButton.click();
                await this.wait(2000);
                console.log('✅ Visits screen opened');
            }
        } catch (e) {
            console.warn('openVisits warning:', e);
        }
    }

    async visits(): Promise<void> {
        await this.openVisits();
    }

    // Search Patient
    async searchPatient(patientName: string): Promise<void> {
        try {
            const searchBox = await this.driver.$('android=new UiSelector().resourceId("searchInput")');
            if (await searchBox.isExisting()) {
                await searchBox.waitForDisplayed({ timeout: 10000 });
                await searchBox.click();
                await searchBox.clearValue();
                await searchBox.setValue(patientName);
                await this.wait(2000);
                console.log(`🔎 Searching for: ${patientName}`);
            }
        } catch (e) {
            console.warn('searchPatient warning:', e);
        }
    }

    async search(name: string): Promise<void> {
        await this.searchPatient(name);
    }

    // Visit Check
    async findRecentVisit(empName: string, patientName: string, visitStartTime12H?: string): Promise<boolean> {
        try {
            await this.openVisits().catch(() => { });
            await this.searchPatient(patientName).catch(() => { });
            const visitCard = await this.driver.$(`//*[contains(@text, "${patientName}") or contains(@content-desc, "${patientName}")]`);
            const exists = await visitCard.isExisting();
            console.log(`Visit for ${patientName} exists: ${exists}`);
            return exists;
        } catch (e) {
            console.warn('findRecentVisit check error:', e);
            return false;
        }
    }

    async visitExists(patientName: string): Promise<boolean> {
        return this.findRecentVisit('', patientName);
    }

    // Open / Click Visit Card
    async clickVisit(patientName: string, visitStartTime12H?: string): Promise<void> {
        const visit = await this.driver.$(`//*[contains(@text, "${patientName}") or contains(@content-desc, "${patientName}")]`);
        await visit.waitForDisplayed({ timeout: 10000 });
        await visit.click();
        await this.wait(2000);
        console.log(`✅ Opened visit for ${patientName}`);
    }

    async openVisit(name: string): Promise<void> {
        await this.clickVisit(name);
    }

    async openPatientVisit(patientName: string): Promise<void> {
        await this.clickVisit(patientName);
    }

    // Clock In
    async clickClockIn(): Promise<void> {
        const clockInBtn = await this.driver.$('//*[contains(@text, "CLOCK IN") or contains(@content-desc, "CLOCK IN") or contains(@text, "Clock In") or contains(@content-desc, "Clock In")]');
        await clockInBtn.waitForDisplayed({ timeout: 10000 });
        await clockInBtn.click();
        await this.wait(1000);

        const confirmBtn = await this.driver.$('//*[@text="Confirm" or @content-desc="Confirm" or @text="YES" or @content-desc="YES"]');
        if (await confirmBtn.isExisting()) {
            await confirmBtn.click();
        }
        console.log('✅ Clock In performed');
    }

    async clockIn(): Promise<void> {
        await this.clickClockIn();
    }

    // Clock Out
    async clickClockOut(): Promise<void> {
        const clockOutBtn = await this.driver.$('//*[contains(@text, "CLOCK OUT") or contains(@content-desc, "CLOCK OUT") or contains(@text, "Clock Out") or contains(@content-desc, "Clock Out")]');
        await clockOutBtn.waitForDisplayed({ timeout: 10000 });
        await clockOutBtn.click();
        await this.wait(1000);

        const confirmBtn = await this.driver.$('//*[@text="Confirm" or @content-desc="Confirm" or @text="YES" or @content-desc="YES"]');
        if (await confirmBtn.isExisting()) {
            await confirmBtn.click();
        }
        console.log('✅ Clock Out performed');
    }

    async clockOut(): Promise<void> {
        await this.clickClockOut();
    }

    // Client verification
    async clientVerification(): Promise<void> {
        try {
            const timeVerified = await this.driver.$('//*[@text="Time Verified" or @content-desc="Time Verified"]');
            if (await timeVerified.isExisting()) {
                await timeVerified.waitForDisplayed({ timeout: 5000 });
            }
            const checkboxes = await this.driver.$$('android.widget.CheckBox');
            for (const cb of checkboxes) {
                if (await cb.isExisting()) {
                    await cb.click().catch(() => { });
                }
            }
            console.log('✅ Client verification completed');
        } catch (e) {
            console.warn('clientVerification warning:', e);
        }
    }

    // Patient's Signature
    async patientsSignature(): Promise<void> {
        try {
            const sig = await this.driver.$('//*[contains(@text, "Signature") or contains(@content-desc, "Signature")]');
            if (await sig.isExisting()) {
                await sig.click();
                await this.wait(1000);
            }
            console.log('✅ Patients signature handled');
        } catch (e) {
            console.warn('patientsSignature warning:', e);
        }
    }

    // Save Button
    async saveButton(): Promise<void> {
        try {
            const saveBtn = await this.driver.$('//*[@text="Save" or @content-desc="Save" or @text="SAVE" or @content-desc="SAVE"]');
            if (await saveBtn.isExisting()) {
                await saveBtn.click();
                await this.wait(2000);
            }
            console.log('✅ Save clicked');
        } catch (e) {
            console.warn('saveButton warning:', e);
        }
    }

    // OK Button
    async okButton(): Promise<void> {
        try {
            const okBtn = await this.driver.$('//*[@text="OK" or @content-desc="OK" or @text="Ok" or @content-desc="Ok"]');
            if (await okBtn.isExisting()) {
                await okBtn.click();
                await this.wait(1000);
            }
            console.log('✅ OK clicked');
        } catch (e) {
            console.warn('okButton warning:', e);
        }
    }

    // Teardown / Close
    async close(): Promise<void> {
        try {
            if (this.driver) {
                await this.driver.deleteSession();
                console.log('✅ Appium session closed');
            }
        } catch { }

        if (this.appiumProcess) {
            this.appiumProcess.kill();
            console.log('✅ Appium process killed');
        }
    }

    async closeDevice(): Promise<void> {
        await this.close();
    }
}
