import { remote, Browser } from 'webdriverio';
import { spawn, ChildProcess, exec } from 'child_process';
import { promisify } from 'util';
import 'dotenv/config';
class MobileAppLogger {
    constructor(private readonly debug = false) {}

    info(message: string): void {
        if (this.debug) console.info(message);
    }

    success(message: string): void {
        console.info(message);
    }

    warning(message: string, error?: unknown): void {
        console.warn(message, error ?? '');
    }

    error(message: string, error?: unknown): void {
        console.error(message, error ?? '');
    }
}

const MOBILE_SELECTORS = {
    LANGUAGE_OR_CONTINUE: '//*[@text="Continue" or @text="English" or @content-desc="Continue" or @content-desc="English"]',
    ALLOW_PERMISSION: '//*[@text="Allow" or @text="While using the app" or @content-desc="Allow"]',
    USERNAME_INPUT: '//android.widget.EditText[@hint="Enter your email"] | //*[@resource-id="username" or contains(@resource-id, ":id/username")] | (//android.widget.EditText)[1]',
    PASSWORD_INPUT: '//android.widget.EditText[@hint="Enter your password"] | //*[@resource-id="password" or contains(@resource-id, ":id/password")] | (//android.widget.EditText)[2]',
    SIGN_IN_BUTTON: '//*[@text="Sign In" or @text="Login" or @content-desc="Sign In" or @content-desc="Login"]',
    VISITS_BUTTON: '//*[contains(@text, "Visits") or contains(@content-desc, "Visits")]',
    SEARCH_INPUT: '//*[@resource-id="search" or @resource-id="searchInput" or contains(@resource-id, ":id/search") or contains(@resource-id, ":id/searchInput")]',
    CLOCK_IN_BUTTON: '//*[@text="Clock In" or @content-desc="Clock In"]',
    CLOCK_OUT_BUTTON: '//*[@text="Clock Out" or @content-desc="Clock Out"]',
    CONFIRM_BUTTON: '//*[@text="Confirm" or @content-desc="Confirm"]',
    TIME_VERIFIED: '//*[@text="Time Verified" or @content-desc="Time Verified"]',
    CHECKBOX: '//android.widget.CheckBox',
    SIGNATURE_ELEMENT: '//*[@resource-id="signature" or contains(@resource-id, ":id/signature")] | //android.view.View[contains(@content-desc, "signature") or contains(@content-desc, "Signature")]',
    SAVE_BUTTON: '//*[@text="Save" or @content-desc="Save"]',
    OK_BUTTON: '//*[@text="OK" or @content-desc="OK"]',
} as const;

const DEFAULT_CONFIG = {
    EMULATOR: {
        androidHome: process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '',
        avdName: process.env.ANDROID_AVD_NAME || process.env.ANDROID_EMULATOR_AVD_NAME || process.env.AVD_NAME || 'Pixel_2_API_30',
    },
    APPIUM_SERVER: {
        hostname: process.env.APPIUM_HOST || '127.0.0.1',
        port: Number(process.env.APPIUM_PORT || 4723),
        path: process.env.APPIUM_PATH || '/',
    },
    ANDROID_DEVICE: {
        deviceName: process.env.ANDROID_DEVICE_ID || process.env.ANDROID_DEVICE_NAME || 'Pixel 6a',
        appPackage: process.env.ANDROID_APP_PACKAGE || process.env.APP_PACKAGE || '',
        appActivity: process.env.ANDROID_APP_ACTIVITY || process.env.APP_ACTIVITY || '',
        appWaitActivity: process.env.ANDROID_APP_WAIT_ACTIVITY || process.env.APP_WAIT_ACTIVITY || '',
        appPath: process.env.ANDROID_APK_PATH || process.env.APP_PATH || '',
    },
    TIMEOUTS: {
        emulatorStartupWait: 60,
        emulatorWait: 1000,
        appiumWait: 30000,
        shortWait: 1000,
        mediumWait: 2000,
        postLoginWait: 3000,
        elementDisplay: 15000,
    },
} as const;

const getVisitCardSelector = (patientName: string): string =>
    `//*[contains(@text, ${JSON.stringify(patientName)})]`;

const logger = new MobileAppLogger(process.env.DEBUG_MODE === 'true');
const execAsync = promisify(exec);

export class MobileApp {
    clickVisit: any;
    findRecentVisit(empName: string, patientName: string, visitStartTime12H: string) {
      throw new Error('Method not implemented.');
    }
    connectDevice(deviceId: string, appPath: string) {
      throw new Error('Method not implemented.');
    }
    private driver!: Browser;
    private appiumProcess?: ChildProcess;
    private config = DEFAULT_CONFIG;

    private async wait(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private async executeCommand(command: string): Promise<string> {
        try {
            const { stdout } = await execAsync(command);
            return stdout;
        } catch {
            return '';
        }
    }

    async startEmulator(): Promise<string> {
        const devices = await this.executeCommand('adb devices');
        const deviceId = this.config.ANDROID_DEVICE.deviceName;
        const connectedDevice = devices
            .split(/\r?\n/)
            .map((line) => line.match(/^([^\s]+)\tdevice$/)?.[1])
            .find(Boolean);
        if (connectedDevice) {
            logger.info('Emulator already running');
            return connectedDevice;
        }

        const emulatorCmd = this.config.EMULATOR.androidHome
            ? `${this.config.EMULATOR.androidHome}\\emulator\\emulator.exe`
            : 'emulator';

        logger.info(`Starting emulator: ${this.config.EMULATOR.avdName}`);

        const proc = spawn(emulatorCmd, ['-avd', this.config.EMULATOR.avdName, '-no-boot-anim', '-no-audio'], {
            detached: true,
            stdio: 'ignore',
        });
        proc.unref();

        // Wait for emulator to be ready
        const maxRetries = this.config.TIMEOUTS.emulatorStartupWait;
        for (let i = 0; i < maxRetries; i++) {
            const dev = await this.executeCommand('adb devices');
            const readyDevice = dev
                .split(/\r?\n/)
                .map((line) => line.match(/^([^\s]+)\tdevice$/)?.[1])
                .find(Boolean);
            if (readyDevice) {
                logger.success('Emulator ready');
                return readyDevice;
            }
            await this.wait(this.config.TIMEOUTS.emulatorWait);
        }

        throw new Error('Emulator startup timeout');
    }

    async startAppium(): Promise<void> {
        const port = this.config.APPIUM_SERVER.port;
        try {
            const response = await fetch(`http://127.0.0.1:${port}/status`);
            if (response.ok) {
                logger.info(`Appium running on port ${port}`);
                return;
            }
        } catch {
            // Start Appium
        }

        logger.info(`Starting Appium on port ${port}`);
        const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
        this.appiumProcess = spawn(npxCommand, ['appium', '--port', String(port)], {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: process.platform === 'win32',
        });

        const deadline = Date.now() + this.config.TIMEOUTS.appiumWait;
        while (Date.now() < deadline) {
            try {
                const response = await fetch(`http://127.0.0.1:${port}/status`);
                if (response.ok) {
                    logger.success(`Appium started on port ${port}`);
                    return;
                }
            } catch {
                // Appium may still be starting.
            }
            await this.wait(500);
        }

        this.appiumProcess.kill();
        throw new Error(`Appium did not become ready on port ${port}`);
    }

    async connect(deviceId?: string, appPath?: string): Promise<void> {
        const config = {
            deviceName: deviceId || this.config.ANDROID_DEVICE.deviceName,
            appPackage: this.config.ANDROID_DEVICE.appPackage,
            appActivity: this.config.ANDROID_DEVICE.appActivity,
            appWaitActivity: this.config.ANDROID_DEVICE.appWaitActivity,
        };

        const resolvedAppPath = appPath || this.config.ANDROID_DEVICE.appPath;
        const capabilities = getAppiumCapabilities(config, resolvedAppPath);

        const hasAppPackage = !!config.appPackage;
        const hasAppActivity = !!config.appActivity;
        const hasAppPath = !!resolvedAppPath;

        if (!hasAppPath && (!hasAppPackage || !hasAppActivity)) {
            throw new Error('Set ANDROID_APK_PATH or both ANDROID_APP_PACKAGE and ANDROID_APP_ACTIVITY before connecting to Appium.');
        }

        this.driver = await remote({
            hostname: this.config.APPIUM_SERVER.hostname,
            port: this.config.APPIUM_SERVER.port,
            path: this.config.APPIUM_SERVER.path,
            capabilities,
        });
        logger.success('Connected to device');
    }

    async handleInitialScreen(): Promise<void> {
        try {
            const lang = await this.driver.$(MOBILE_SELECTORS.LANGUAGE_OR_CONTINUE);
            if (await lang.isExisting()) {
                await lang.click();
                await this.wait(this.config.TIMEOUTS.shortWait);
            }

            const perm = await this.driver.$(MOBILE_SELECTORS.ALLOW_PERMISSION);
            if (await perm.isExisting()) {
                await perm.click();
                await this.wait(this.config.TIMEOUTS.shortWait);
            }
        } catch (error) {
            logger.warning('Error on initial screens', error);
        }
    }

    async login(username: string, password: string): Promise<void> {
        try {
            const userInput = await this.driver.$(MOBILE_SELECTORS.USERNAME_INPUT);
            await userInput.waitForDisplayed({ timeout: this.config.TIMEOUTS.elementDisplay });
            await userInput.clearValue();
            await userInput.setValue(username);

            const passInput = await this.driver.$(MOBILE_SELECTORS.PASSWORD_INPUT);
            await passInput.waitForDisplayed({ timeout: this.config.TIMEOUTS.elementDisplay });
            await passInput.clearValue();
            await passInput.setValue(password);

            await this.driver.hideKeyboard().catch(() => {});

            const signIn = await this.driver.$(MOBILE_SELECTORS.SIGN_IN_BUTTON);
            await signIn.waitForDisplayed({ timeout: this.config.TIMEOUTS.elementDisplay });
            await signIn.click();
            await this.wait(this.config.TIMEOUTS.postLoginWait);
            logger.success('Logged in');
        } catch (error) {
            logger.error('Login failed', error);
            throw error;
        }
    }

    async openVisits(): Promise<void> {
        try {
            const btn = await this.driver.$(MOBILE_SELECTORS.VISITS_BUTTON);
            if (await btn.isExisting()) {
                await btn.waitForDisplayed({ timeout: this.config.TIMEOUTS.elementDisplay });
                await btn.click();
                await this.wait(this.config.TIMEOUTS.mediumWait);
            }
        } catch (error) {
            logger.warning('Open visits failed', error);
        }
    }

    async searchPatient(patientName: string): Promise<void> {
        const searchBox = await this.driver.$('android=new UiSelector().resourceId("searchInput")');
        await searchBox.waitForDisplayed({ timeout: 10000 });
        await searchBox.click();
        await searchBox.clearValue();
        await searchBox.setValue(patientName);
        await this.wait(2000);
        console.log(`🔎 Searching for: ${patientName}`);
    }

    async visitExists(patientName: string): Promise<boolean> {
        const visit = await this.driver.$(`//*[contains(@text, "${patientName}") or contains(@content-desc, "${patientName}")]`);
        return await visit.isExisting();
    }

    async openPatientVisit(patientName: string): Promise<void> {
        const visit = await this.driver.$(`//*[contains(@text, "${patientName}") or contains(@content-desc, "${patientName}")]`);
        await visit.waitForDisplayed({ timeout: 10000 });
        await visit.click();
        await this.wait(2000);
        console.log(`✅ Opened visit for ${patientName}`);
    }

    async clientVerification(): Promise<void> {
        const timeVerified = await this.driver.$('//*[@text="Time Verified" or @content-desc="Time Verified"]');
        if (await timeVerified.isExisting().catch(() => false)) {
            await timeVerified.waitForDisplayed({ timeout: 10000 });
        }

        const checkboxes = await this.driver.$$('android=new UiSelector().className("android.widget.CheckBox")');
        const existingCheckboxes = [] as any[];
        for (const cb of checkboxes) {
            if (await cb.isExisting().catch(() => false)) {
                existingCheckboxes.push(cb);
            }
        }

        if (existingCheckboxes.length >= 2) {
            await existingCheckboxes[0].click();
            await existingCheckboxes[1].click();
        }

        console.log('✅ Client verification completed');
    }

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

function getAppiumCapabilities(
    config: {
        deviceName: string;
        appPackage: string;
        appActivity: string;
        appWaitActivity: string;
    },
    resolvedAppPath: string,
) {
    const capabilities: Record<string, string | boolean> = {
        platformName: 'Android',
        'appium:deviceName': config.deviceName,
        'appium:automationName': 'UiAutomator2',
        'appium:noReset': false,
        'appium:autoGrantPermissions': true,
    };

    if (resolvedAppPath) {
        capabilities['appium:app'] = resolvedAppPath;
    } else {
        capabilities['appium:appPackage'] = config.appPackage;
        capabilities['appium:appActivity'] = config.appActivity;

        if (config.appWaitActivity) {
            capabilities['appium:appWaitActivity'] = config.appWaitActivity;
        }
    }

    return capabilities;
}

