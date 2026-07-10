import { remote, Browser } from 'webdriverio';
import { exec, spawn, ChildProcessWithoutNullStreams, ExecOptions } from 'child_process';
import { existsSync } from 'fs';
import { promisify } from 'util';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

interface ExecAsyncResult {
    stdout: string;
    stderr: string;
}

const execAsync = (command: string, options: ExecOptions = {}): Promise<ExecAsyncResult> => {
    return promisify(exec)(command, { windowsHide: true, encoding: 'utf8', ...options }) as Promise<ExecAsyncResult>;
};

export class MobileApp {
    private driver!: Browser;
    private appiumProcess: ChildProcessWithoutNullStreams | null = null;
    private readonly defaultTimeoutMs = 10000;
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private isDeviceReady(output: string): boolean {
        return /emulator-\d+\s+device/.test(output);
    }

    private getAndroidHome(): string | undefined {
        return process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
    }

    private getAppiumPort(): string {
        return process.env.APPIUM_PORT || '4724';
    }

    async startEmulator(avd = process.env.ANDROID_EMULATOR_AVD_NAME || process.env.AVD_NAME || 'Pixel_4_API_30'): Promise<void> {
        const { stdout } = await execAsync('adb devices').catch(() => ({ stdout: '' }));
        if (this.isDeviceReady(stdout)) {
            console.log('Emulator is already running.');
            return;
        }

        const sdk = this.getAndroidHome();
        if (!sdk) {
            throw new Error('ANDROID_HOME or ANDROID_SDK_ROOT is not set. Cannot start emulator.');
        }

        const cmd = `${sdk}\\emulator\\emulator.exe`;
        if (!existsSync(cmd)) {
            throw new Error(`Android emulator executable was not found at ${cmd}. Please install the Android Emulator component in Android Studio or update ANDROID_HOME.`);
        }

        console.log(`Starting emulator ${avd} with ${cmd}...`);

        const proc = spawn(cmd, ['-avd', avd, '-no-boot-anim', '-no-audio', '-gpu', 'host', '-no-snapshot-load'], {
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: false,
            windowsHide: true,
        });

        proc.stdout.on('data', data => console.log(`[emulator stdout] ${data.toString().trim()}`));
        proc.stderr.on('data', data => console.error(`[emulator stderr] ${data.toString().trim()}`));
        proc.on('error', err => console.error('Emulator spawn error:', err));
        proc.unref();

        for (let i = 0; i < 30; i++) {
            const { stdout: devices } = await execAsync('adb devices').catch(() => ({ stdout: '' }));
            if (this.isDeviceReady(devices)) {
                console.log('Emulator detected and ready.');
                return;
            }
            await this.delay(2000);
        }
        throw new Error(`Android emulator '${avd}' did not reach a usable device state within time.`);
    }

    async startAppium(): Promise<void> {
        this.ensureAndroidEnv();
        const port = this.getAppiumPort();

        const res = await fetch(`http://127.0.0.1:${port}/status`).catch(() => null);
        if (res?.ok) {
            console.log('Appium server is already running.');
            return;
        }

        await execAsync(`npx kill-port ${port}`).catch(() => undefined);

        const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
        console.log(`Starting Appium server using ${npxCommand}`);
        this.appiumProcess = spawn(npxCommand, ['appium', '--port', port, '--log-level', 'error'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false,
            windowsHide: true,
        });

        const appiumProcess = this.appiumProcess;
        if (!appiumProcess) {
            throw new Error('Failed to spawn Appium process.');
        }

        appiumProcess.stdout.on('data', data => console.log(`[appium stdout] ${data.toString().trim()}`));
        appiumProcess.stderr.on('data', data => console.error(`[appium stderr] ${data.toString().trim()}`));
        appiumProcess.on('error', err => console.error('Appium spawn error:', err));

        for (let i = 0; i < 15; i++) {
            const status = await fetch(`http://127.0.0.1:${port}/status`).catch(() => null);
            if (status?.ok) return;
            await this.delay(2000);
        }

        if (this.appiumProcess) this.appiumProcess.kill();
        throw new Error(`Appium server did not become ready on port ${port}.`);
    }

    private ensureAndroidEnv(): void {
        const home = this.getAndroidHome();
        const javaHome = process.env.JAVA_HOME;
        if (!home) {
            console.warn('⚠️ ANDROID_HOME or ANDROID_SDK_ROOT environment variable is not set.');
            console.warn('   Set ANDROID_HOME to your Android SDK path (e.g., C:\\Users\\Admin\\AppData\\Local\\Android\\Sdk)');
        }
        if (!javaHome) {
            console.warn('⚠️ JAVA_HOME environment variable is not set.');
            console.warn('   Set JAVA_HOME to your Java installation (e.g., C:\\Program Files\\Java\\jdk-17.0.1)');
        }
    }

    private async waitForDevice(deviceName: string): Promise<string> {
        for (let i = 0; i < 30; i++) {
            const { stdout } = await execAsync('adb devices').catch(() => ({ stdout: '' }));
            const lines = stdout.split(/\r?\n/).slice(1).map(line => line.trim()).filter(Boolean);
            const exactMatch = lines.find(line => line.startsWith(deviceName) && line.includes('device'));
            if (exactMatch) {
                return deviceName;
            }
            const fallback = lines.find(line => line.endsWith('device'));
            if (fallback) {
                return fallback.split(/\s+/)[0];
            }
            await this.delay(1000);
        }
        return deviceName;
    }

    private async launchApp(appPackage: string, appActivity: string, appWaitActivity: string, deviceName: string): Promise<void> {
        const activityCandidates = [
            appActivity,
            appWaitActivity,
            `${appPackage}.MainActivity`,
            'com.example.care_boarding.MainActivity',
        ].filter(Boolean) as string[];

        for (const activity of activityCandidates) {
            try {
                await execAsync(`adb -s ${deviceName} shell am start -n ${appPackage}/${activity}`);
                await this.delay(5000);
                return;
            } catch (error) {
                console.warn(`Unable to launch activity ${activity}:`, error);
            }
        }

        try {
            await execAsync(`adb -s ${deviceName} shell monkey -p ${appPackage} -c android.intent.category.LAUNCHER 1`);
            await this.delay(5000);
        } catch (error) {
            console.warn('Fallback app launch also failed:', error);
        }
    }

    async connectDevice(deviceName = process.env.ANDROID_DEVICE_ID || process.env.ANDROID_DEVICE_NAME || 'emulator-5554', appPath?: string): Promise<void> {
        const resolvedDevice = await this.waitForDevice(deviceName);

        const port = this.getAppiumPort();
        const appPackage = process.env.ANDROID_APP_PACKAGE || 'com.careboarding';
        const appActivity = process.env.ANDROID_APP_ACTIVITY || 'com.careboarding.MainActivity';
        const appWaitActivity = process.env.ANDROID_APP_WAIT_ACTIVITY || appActivity;
        const appPathResolved = appPath || process.env.ANDROID_APK_PATH || '';

        console.log('Connecting mobile device with:', {
            deviceName: resolvedDevice,
            appPathResolved,
            appPackage,
            appActivity,
            appWaitActivity,
            port,
        });

        const capabilities: Record<string, unknown> = {
            platformName: 'Android',
            'appium:deviceName': resolvedDevice,
            'appium:automationName': 'UiAutomator2',
            'appium:appPackage': appPackage,
            'appium:appActivity': appActivity,
            'appium:appWaitActivity': appWaitActivity,
            'appium:noReset': true,
            'appium:ignoreHiddenApiPolicyError': true,
            'appium:autoGrantPermissions': true,
            'appium:uiautomator2ServerLaunchTimeout': 120000,
            'appium:skipServerInstallation': true,
            'appium:skipDeviceInitialization': true,
        };

        if (appPathResolved && existsSync(appPathResolved)) {
            capabilities['appium:app'] = appPathResolved;
        }

        this.driver = await remote({
            hostname: '127.0.0.1',
            port: parseInt(port, 10),
            path: '/',
            logLevel: 'warn',
            capabilities,
        });

        await this.delay(5000);
        await this.launchApp(appPackage, appActivity, appWaitActivity, resolvedDevice);
    }

    async handleLanguage(): Promise<void> {
        const permission = await this.driver.$('//*[contains(@text, "While using the app") or contains(@text, "Allow") or contains(@text, "Continue")]');
        if (await permission.isExisting().catch(() => false)) {
            await permission.click().catch(() => undefined);
            await this.driver.pause(1000);
        }

        const continueBtn = await this.driver.$('//*[@text="Continue" or @content-desc="Continue"]');
        if (await continueBtn.waitForExist({ timeout: 8000 }).catch(() => false)) {
            await continueBtn.click().catch(() => undefined);
            await this.delay(2000);
        }
    }

    async login(user: string, pass: string): Promise<void> {
        await this.handleLanguage();

        const email = await this.driver.$('android=new UiSelector().className("android.widget.EditText").instance(0)');
        await email.waitForExist({ timeout: this.defaultTimeoutMs });
        await email.click();
        await email.setValue(user);

        const pwd = await this.driver.$('android=new UiSelector().className("android.widget.EditText").instance(1)');
        await pwd.waitForExist({ timeout: this.defaultTimeoutMs });
        await pwd.click();
        await pwd.setValue(pass);
        await this.driver.hideKeyboard().catch(() => undefined);

        const signIn = await this.driver.$('//*[@content-desc="Sign In" or @text="Sign In"]');
        if (await signIn.waitForExist({ timeout: this.defaultTimeoutMs }).catch(() => false)) {
            await signIn.click();
        }
        await this.delay(1000);
    }

    async goToVisits(): Promise<void> {
        const btn = await this.driver.$('//*[contains(@content-desc, "Visits") or contains(@text, "Visits")]');
        await btn.waitForExist({ timeout: 20000 });
        await btn.click();
    }

    getNameVariations(name: string): string[] {
        const variations = new Set<string>();
        const clean = name.trim();
        variations.add(clean);

        if (clean.includes(',')) {
            const parts = clean.split(',').map(part => part.trim());
            if (parts.length >= 2) {
                const lastName = parts[0];
                const firstName = parts[1];
                variations.add(`${firstName} ${lastName}`);
                const firstWordOfFirst = firstName.split(' ')[0];
                variations.add(`${firstWordOfFirst} ${lastName}`);
            }
        } else {
            const parts = clean.split(/\s+/);
            if (parts.length >= 2) {
                const firstName = parts[0];
                const lastName = parts[parts.length - 1];
                variations.add(`${lastName}, ${firstName}`);
                if (parts.length > 2) {
                    const middleAndLast = parts.slice(1).join(' ');
                    variations.add(`${middleAndLast}, ${firstName}`);
                }
            }
        }
        return Array.from(variations);
    }

    async searchPatient(name: string): Promise<void> {
        try {
            const input = await this.driver.$('android=new UiSelector().resourceId("searchInput")');
            if (await input.isDisplayed().catch(() => false)) {
                await input.click().catch(() => undefined);
                await input.setValue(name);
            }
        } catch (error) {
            console.warn('searchPatient failed:', error);
        }
    }

    private async getMatchingElement(texts: string[], visitTime?: string) {
        if (visitTime) {
            const byTime = await this.driver.$(`//*[contains(@text, "${visitTime}") or contains(@content-desc, "${visitTime}")]`);
            if (await byTime.isExisting().catch(() => false)) {
                return byTime;
            }
        }

        for (const text of texts) {
            const element = await this.driver.$(`//*[contains(@text, "${text}") or contains(@content-desc, "${text}")]`);
            if (await element.isExisting().catch(() => false)) {
                return element;
            }
        }

        return null;
    }

    async checkVisitExists(name: string, visitTime?: string): Promise<boolean> {
        const variations = this.getNameVariations(name);
        const element = await this.getMatchingElement(variations, visitTime);
        return Boolean(element);
    }

    async findRecentVisit(empName: string, patientName: string, visitTime?: string): Promise<boolean> {
        await this.goToVisits();
        await this.driver.pause(5000);

        await this.searchPatient(patientName);
        await this.driver.pause(5000);

        if (await this.checkVisitExists(patientName, visitTime)) {
            return true;
        }

        await this.searchPatient(empName);
        await this.driver.pause(5000);
        return this.checkVisitExists(patientName, visitTime);
    }

    async clickVisit(patientName: string, visitTime?: string): Promise<void> {
        const variations = this.getNameVariations(patientName);
        const element = await this.getMatchingElement(variations, visitTime);

        if (element) {
            await element.click();
            return;
        }

        const fallback = await this.driver.$(`//*[contains(@text, "${variations[0]}") or contains(@content-desc, "${variations[0]}")]`);
        await fallback.waitForExist({ timeout: 10000 });
        await fallback.click();
    }

    private async clickCheckboxByIndex(index: number): Promise<void> {
        const checkbox = await this.driver.$(`android=new UiSelector().className("android.widget.CheckBox").instance(${index})`);
        if (await checkbox.waitForExist({ timeout: 5000 }).catch(() => false)) {
            await checkbox.click().catch(() => undefined);
        }
    }

    async clientVerification(): Promise<void> {
        try {
            await this.driver.$('android=new UiScrollable(new UiSelector().scrollable(true).instance(0)).scrollIntoView(new UiSelector().text("Time Verified"))');
            await this.delay(1000);
            await this.clickCheckboxByIndex(0);
            await this.clickCheckboxByIndex(1);
        } catch (error) {
            console.warn('clientVerification skipped:', error);
        }
    }

    async closeDevice(): Promise<void> {
        if (this.driver) {
            await this.driver.deleteSession().catch(() => undefined);
        }
        if (this.appiumProcess) {
            try {
                this.appiumProcess.kill();
            } catch (error) {
                console.log('⚠️ Failed to kill Appium process:', error);
            }
        }
    }
}