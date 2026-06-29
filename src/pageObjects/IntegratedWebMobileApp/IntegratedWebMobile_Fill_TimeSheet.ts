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
    [x: string]: any;
    private driver!: Browser;
    private appiumProcess: any = null;

    // ------------------------- Start Emulator -------------------------

    async startEmulator(avd = process.env.AVD_NAME || 'Pixel_6a'): Promise<void> {
        const { stdout } = await execAsync('adb devices').catch(() => ({ stdout: '' }));
        if (/emulator-\d+\s+device/.test(stdout)) {
            console.log('Emulator is already running.');
            return;
        }

        const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
        const cmd = sdk ? `${sdk}\\emulator\\emulator.exe` : 'emulator';

        console.log(`Starting emulator ${avd}...`);
        const proc = spawn(cmd, ['-avd', avd, '-no-boot-anim', '-no-audio', '-gpu', 'host', '-no-snapshot-load'], {
            detached: true,
            stdio: 'ignore',
            windowsHide: true
        });
        proc.unref();

        for (let i = 0; i < 30; i++) {
            const { stdout: devices } = await execAsync('adb devices').catch(() => ({ stdout: '' }));
            if (/emulator-\d+\s+device/.test(devices)) {
                console.log('Emulator detected and ready.');
                return;
            }
            await new Promise(r => setTimeout(r, 2000));
        }
        throw new Error(`Android emulator '${avd}' did not reach a usable device state within time.`);
    }

    // ------------------------- Start Appium -------------------------
    async startAppium(): Promise<void> {
        this.ensureAndroidEnv();
        const port = process.env.APPIUM_PORT || '4724';
        await execAsync(`npx kill-port ${port}`).catch(() => { });

        this.appiumProcess = spawn('npx', ['appium', '--port', port, '--log-level', 'error'], {
            stdio: 'ignore',
            shell: true,
            windowsHide: true,
        });

        for (let i = 0; i < 15; i++) {
            const res = await fetch(`http://127.0.0.1:${port}/status`).catch(() => null);
            if (res?.ok) return;
            await new Promise(r => setTimeout(r, 2000));
        }
        if (this.appiumProcess) this.appiumProcess.kill();
        throw new Error(`Appium server did not become ready on port ${port}.`);
    }

    // ------------------------- Helper: Verify Android env vars -------------------------
    private ensureAndroidEnv(): void {
        const home = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
        if (!home) {
            console.warn('⚠️ ANDROID_HOME or ANDROID_SDK_ROOT environment variable is not set.');
        }
    }

    // ------------------------- Connect Device -------------------------
    async connectDevice(deviceName = process.env.ANDROID_DEVICE_NAME || 'emulator-5554', appPath?: string): Promise<void> {
        for (let i = 0; i < 30; i++) {
            const { stdout } = await execAsync('adb devices').catch(() => ({ stdout: '' }));
            if (stdout.includes(deviceName)) break;
            await new Promise(r => setTimeout(r, 1000));
        }

        const port = process.env.APPIUM_PORT || '4724';
        const appPackage = process.env.ANDROID_APP_PACKAGE || 'com.careboarding';
        const appPathResolved = appPath || process.env.ANDROID_APK_PATH || '';

        this.driver = await remote({
            hostname: '127.0.0.1',
            port: parseInt(port, 10),
            path: '/',
            logLevel: 'warn',
            capabilities: {
                platformName: 'Android',
                'appium:deviceName': deviceName,
                'appium:automationName': 'UiAutomator2',
                'appium:appPackage': appPackage,
                'appium:appActivity': process.env.ANDROID_APP_ACTIVITY || 'com.example.care_boarding.MainActivity',
                'appium:appWaitActivity': process.env.ANDROID_APP_WAIT_ACTIVITY || 'com.example.care_boarding.MainActivity',
                'appium:noReset': true,
                'appium:ignoreHiddenApiPolicyError': true,
                'appium:autoGrantPermissions': true,
                'appium:uiautomator2ServerLaunchTimeout': 120000,
                'appium:app': appPathResolved
            }
        });
        await new Promise(r => setTimeout(r, 5000));
    }

    // ------------------------- Handle Language -------------------------
    async handleLanguage(): Promise<void> {
        // Handle Android permission popup if it appears
        try {
            const permBtn = await this.driver.$('//*[contains(@text, "While using the app") or contains(@text, "Allow")]');
            if (await permBtn.isExisting()) {
                await permBtn.click();
                await new Promise(r => setTimeout(r, 1000));
            }
        } catch { }

        const btn = await this.driver.$('//*[@text="Continue" or @content-desc="Continue"]');
        if (await btn.waitForExist({ timeout: 8000 }).catch(() => false)) {
            await btn.click();
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    // ------------------------- Login -------------------------

    async login(user: string, pass: string): Promise<void> {
        await this.handleLanguage();

        const email = await this.driver.$('android=new UiSelector().className("android.widget.EditText").instance(0)');
        await email.waitForExist({ timeout: 15000 });
        await email.click();
        await email.setValue(user);     

        const pwd = await this.driver.$('android=new UiSelector().className("android.widget.EditText").instance(1)');
        await pwd.waitForExist({ timeout: 10000 });
        await pwd.click();
        await pwd.setValue(pass);
        await this.driver.hideKeyboard().catch(() => { });

        const signIn = await this.driver.$('//*[@content-desc="Sign In" or @text="Sign In"]');
        await signIn.click();
        await new Promise(r => setTimeout(r, 10000));
    }

    // ------------------------- Go to the "Visits" Screen -------------------------
    async goToVisits(): Promise<void> {
        const btn = await this.driver.$('//*[contains(@content-desc, "Visits") or contains(@text, "Visits")]');
        await btn.waitForExist({ timeout: 20000 });
        await btn.click();
    }

    // ------------------------- Check Visit Exists -------------------------
    async checkVisitExists(name: string, visitTime?: string): Promise<boolean> {
        if (visitTime) {
            const selector = `//*[contains(@text, "${visitTime}") or contains(@content-desc, "${visitTime}")]`;
            const existsByTime = await this.driver.$(selector).isExisting().catch(() => false);
            if (existsByTime) return true;
        }

        const variations = this.getNameVariations(name);
        for (const val of variations) {
            const selector = `//*[contains(@text, "${val}") or contains(@content-desc, "${val}")]`;
            const exists = await this.driver.$(selector).isExisting().catch(() => false);
            if (exists) return true;
        }
        return false;
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
        if (visitTime) {
            selector = `//*[contains(@text, "${visitTime}") or contains(@content-desc, "${visitTime}")]`;
            const el = await this.driver.$(selector);
            if (await el.isExisting()) {
                await el.click();
                return;
            }
        }

        const variations = this.getNameVariations(patientName);
        for (const val of variations) {
            selector = `//*[contains(@text, "${val}") or contains(@content-desc, "${val}")]`;
            const el = await this.driver.$(selector);
            if (await el.isExisting()) {
                await el.click();
                return;
            }
        }

        const firstVal = variations[0];
        selector = `//*[contains(@text, "${firstVal}") or contains(@content-desc, "${firstVal}")]`;
        const el = await this.driver.$(selector);
        await el.waitForExist({ timeout: 10000 });
        await el.click();
    }

}