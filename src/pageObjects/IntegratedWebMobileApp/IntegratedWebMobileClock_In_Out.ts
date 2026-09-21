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
    TODAY_SCHEDULE_BUTTON: '//*[contains(@text, "View Today") or contains(@content-desc, "View Today") or contains(@text, "Today\'s Schedule") or contains(@content-desc, "Today\'s Schedule")]',
    VISITS_BUTTON: '//*[contains(@text, "Visits") or contains(@content-desc, "Visits")]',
    SEARCH_INPUT: '//*[@resource-id="search" or @resource-id="searchInput" or contains(@resource-id, ":id/search") or contains(@resource-id, ":id/searchInput")]',
    CLOCK_IN_BUTTON: '//*[@text="Clock In" or @text="CLOCK IN" or @content-desc="Clock In" or @content-desc="CLOCK IN"]',
    CLOCK_OUT_BUTTON: '//*[@text="Clock Out" or @text="CLOCK OUT" or @content-desc="Clock Out" or @content-desc="CLOCK OUT"]',
    CONFIRM_BUTTON: '//*[@text="Confirm" or @content-desc="Confirm"]',
    OK_BUTTON: '//*[@text="OK" or @text="Ok" or @content-desc="OK" or @content-desc="Ok"]',
    TIME_VERIFIED_LABEL: '//*[contains(@text, "Time Verified") or contains(@content-desc, "Time Verified")]',
    SERVICE_VERIFIED_LABEL: '//*[contains(@text, "Service Verified") or contains(@content-desc, "Service Verified")]',
    TIME_VERIFIED: '//*[@text="Time Verified" or @content-desc="Time Verified"]',
    CHECKBOX: '//android.widget.CheckBox',
    SIGNATURE_ELEMENT: '//*[@resource-id="signature" or contains(@resource-id, ":id/signature")] | //android.view.View[contains(@content-desc, "signature") or contains(@content-desc, "Signature")]',
    SAVE_BUTTON: '//*[@text="Save" or @content-desc="Save"]',
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
            if (!username.trim() || !password.trim()) {
                throw new Error('Mobile username and password must be provided. Set MOBILE_USER_USERNAME and MOBILE_USER_PASSWORD in .env.');
            }

            const userInput = await this.driver.$(MOBILE_SELECTORS.USERNAME_INPUT);
            await userInput.waitForDisplayed({ timeout: this.config.TIMEOUTS.elementDisplay });
            await userInput.click();
            await userInput.clearValue();
            await userInput.setValue(username);

            const passInput = await this.driver.$(MOBILE_SELECTORS.PASSWORD_INPUT);
            await passInput.waitForDisplayed({ timeout: this.config.TIMEOUTS.elementDisplay });
            await passInput.click();
            await passInput.clearValue();
            await passInput.setValue(password);

            await this.driver.hideKeyboard().catch(() => {});

            const signIn = await this.driver.$(MOBILE_SELECTORS.SIGN_IN_BUTTON);
            await signIn.waitForDisplayed({ timeout: this.config.TIMEOUTS.elementDisplay });
            await signIn.click();
            await this.wait(this.config.TIMEOUTS.postLoginWait);

            const loginError = await this.driver.$('//*[contains(@content-desc, "Invalid") or contains(@text, "Invalid") or contains(@content-desc, "incorrect") or contains(@text, "incorrect")]');
            if (await loginError.isExisting()) {
                throw new Error('Mobile login was rejected: invalid username or password.');
            }

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
        try {
            const search = await this.driver.$(MOBILE_SELECTORS.SEARCH_INPUT);
            if (await search.isExisting()) {
                await search.waitForDisplayed({ timeout: this.config.TIMEOUTS.elementDisplay });
                await search.click();
                await search.clearValue();
                await search.setValue(patientName);
                await this.wait(this.config.TIMEOUTS.mediumWait);
            }
        } catch (error) {
            logger.warning('Search failed', error);
        }
    }

    async findRecentVisit(empName: string, patientName: string, visitStartTime12H?: string): Promise<boolean> {
        try {
            await this.openTodaysSchedule();
            await this.searchPatient(patientName).catch(() => {});
            return Boolean(await this.findVisitCard(patientName, visitStartTime12H));
        } catch {
            return false;
        }
    }

    async openTodaysSchedule(): Promise<void> {
        const schedule = await this.driver.$(MOBILE_SELECTORS.TODAY_SCHEDULE_BUTTON);
        if (await schedule.isExisting()) {
            await schedule.waitForDisplayed({ timeout: this.config.TIMEOUTS.elementDisplay });
            await schedule.click();
            await this.wait(this.config.TIMEOUTS.mediumWait);
        }
    }

    async openVisit(patientName: string, visitStartTime12H?: string): Promise<void> {
        try {
            const visit = await this.findVisitCard(patientName, visitStartTime12H);
            await visit.click();
            await this.wait(this.config.TIMEOUTS.mediumWait);
            logger.success(`Opened ${patientName}`);
        } catch (error) {
            logger.error(`Failed to open ${patientName}`, error);
            throw error;
        }
    }

    async clockIn(): Promise<void> {
        try {
            const btn = await this.driver.$(MOBILE_SELECTORS.CLOCK_IN_BUTTON);
            await btn.waitForDisplayed({ timeout: this.config.TIMEOUTS.elementDisplay });
            await btn.click();

            const confirm = await this.driver.$(MOBILE_SELECTORS.CONFIRM_BUTTON);
            await confirm.waitForDisplayed({ timeout: this.config.TIMEOUTS.elementDisplay });
            await confirm.click();

            const ok = await this.driver.$(MOBILE_SELECTORS.OK_BUTTON);
            await ok.waitForDisplayed({ timeout: this.config.TIMEOUTS.elementDisplay });
            await ok.click();

            await this.driver.$(MOBILE_SELECTORS.CLOCK_OUT_BUTTON).waitForDisplayed({
                timeout: this.config.TIMEOUTS.elementDisplay,
            });
            logger.success('Clock in done');
        } catch (error) {
            logger.error('Clock in failed', error);
            throw error;
        }
    }

    async selectTodayVisitAndClockIn(patientName: string, visitStartTime12H?: string): Promise<void> {
        const deadline = Date.now() + 60000;
        let visit;

        while (Date.now() < deadline) {
            const todaySchedule = await this.driver.$(MOBILE_SELECTORS.TODAY_SCHEDULE_BUTTON);
            if (await todaySchedule.isDisplayed().catch(() => false)) {
                await todaySchedule.click();
                await this.wait(this.config.TIMEOUTS.mediumWait);
            }

            // The patient identifies the visit reliably; the displayed time can be
            // rounded or formatted differently between the web and mobile apps.
            visit = await this.findVisitCard(patientName);
            if (!visit && visitStartTime12H) {
                visit = await this.findVisitByTime(visitStartTime12H);
            }
            if (visit) {
                break;
            }

            await this.wait(5000);
        }

        if (!visit || !(await visit.isDisplayed().catch(() => false))) {
            throw new Error(`Today's visit was not found for patient: ${patientName}`);
        }

        const location = await visit.getLocation();
        const size = await visit.getSize();
        await this.driver.touchAction({
            action: 'tap',
            x: Math.round(location.x + size.width / 2),
            y: Math.round(location.y + size.height / 2),
        });

        await this.clockIn();
    }

    private async findVisitByTime(startTime: string): Promise<any> {
        const timeText = JSON.stringify(startTime);
        const times = await this.driver.$$(
            `//*[contains(@text, ${timeText}) or contains(@content-desc, ${timeText})]`,
        );

        let lastVisibleTime: any = null;
        for (const time of times) {
            if (await time.isDisplayed().catch(() => false)) {
                lastVisibleTime = time;
            }
        }

        return lastVisibleTime;
    }

    private async findVisitCard(
        patientName: string,
        visitStartTime12H?: string,
    ): Promise<any> {
        const nameParts = patientName.toLowerCase().split(/\s+/).filter(Boolean);
        const nameText = JSON.stringify(patientName);
        const cards = await this.driver.$$(`//*[contains(@text, ${nameText})]`);
        const matches = [];

        for (const card of cards) {
            const text = (await card.getText().catch(() => '')).toLowerCase();
            const hasPatient = nameParts.every((part) => text.includes(part));
            if (await card.isDisplayed().catch(() => false) && hasPatient) {
                matches.push(card);
            }
        }

        return matches[matches.length - 1] || null;
    }

    async clockOut(): Promise<void> {
        try {
            const btn = await this.driver.$(MOBILE_SELECTORS.CLOCK_OUT_BUTTON);
            await btn.waitForDisplayed({ timeout: this.config.TIMEOUTS.elementDisplay });
            await btn.click();

            const confirm = await this.driver.$(MOBILE_SELECTORS.CONFIRM_BUTTON);
            await confirm.waitForDisplayed({ timeout: this.config.TIMEOUTS.elementDisplay });
            await confirm.click();

            await this.driver.$(MOBILE_SELECTORS.TIME_VERIFIED_LABEL).waitForDisplayed({
                timeout: this.config.TIMEOUTS.elementDisplay,
            });
            logger.success('Clock out done');
        } catch (error) {
            logger.error('Clock out failed', error);
            throw error;
        }
    }

    /**
     * Complete client verification (check all checkboxes and verify time)
     */
    async clientVerification(): Promise<void> {
        try {
            logger.info('Starting client verification...');

            // Wait for time verified element
            for (const selector of [MOBILE_SELECTORS.TIME_VERIFIED_LABEL, MOBILE_SELECTORS.SERVICE_VERIFIED_LABEL]) {
                const checkbox = await this.driver.$(selector);
                await checkbox.scrollIntoView();
                if (await checkbox.isDisplayed()) {
                    await checkbox.click();
                }
            }

            logger.success('Client verification completed');
        } catch (error) {
            logger.warning('Error during client verification', error);
        }
    }

    /**
     * Handle patient signature screen
     */
    async patientsSignature(): Promise<void> {
        try {
            const sig = await this.driver.$(MOBILE_SELECTORS.SIGNATURE_ELEMENT);
            if (await sig.isExisting()) {
                await sig.click();
                await this.wait(this.config.TIMEOUTS.shortWait);
            }
            logger.success('Patient signature handled');
        } catch (error) {
            logger.warning('Error handling patient signature', error);
        }
    }

    /**
     * Click the Save button
     */
    async saveButton(): Promise<void> {
        try {
            const saveBtn = await this.driver.$(MOBILE_SELECTORS.SAVE_BUTTON);
            await saveBtn.scrollIntoView();
            await saveBtn.waitForDisplayed({ timeout: this.config.TIMEOUTS.elementDisplay });
            await saveBtn.click();
            await this.wait(this.config.TIMEOUTS.mediumWait);
            logger.success('Save button clicked');
        } catch (error) {
            logger.warning('Error clicking save button', error);
        }
    }

    /**
     * Click the OK button
     */
    async okButton(): Promise<void> {
        try {
            const okBtn = await this.driver.$(MOBILE_SELECTORS.OK_BUTTON);
            if (await okBtn.isExisting()) {
                await okBtn.click();
                await this.wait(this.config.TIMEOUTS.shortWait);
            }
            logger.success('OK button clicked');
        } catch (error) {
            logger.warning('Error clicking OK button', error);
        }
    }

    /**
     * Close app session and cleanup resources
     */
    async close(): Promise<void> {
        try {
            if (this.driver) {
                await this.driver.deleteSession();
                logger.success('Appium session closed');
            }
        } catch (error) {
            logger.warning('Error closing Appium session', error);
        }

        if (this.appiumProcess) {
            this.appiumProcess.kill();
            logger.success('Appium process killed');
        }
    }

    /**
     * Alias for close()
     */
    async closeDevice(): Promise<void> {
        return this.close();
    }

    async connectDevice(deviceId?: string, appPath?: string): Promise<void> {
        return this.connect(deviceId, appPath);
    }

    async handleLanguage(): Promise<void> {
        return this.handleInitialScreen();
    }

    async clickVisit(patientName: string, visitStartTime12H?: string): Promise<void> {
        return this.openVisit(patientName, visitStartTime12H);
    }

    async clickClockIn(): Promise<void> {
        return this.clockIn();
    }

    async clickClockOut(): Promise<void> {
        return this.clockOut();
    }
}
function getAppiumCapabilities(
    config: { deviceName: any; appPackage?: any; appActivity?: any; appWaitActivity?: any },
    appPath?: any,
) {
    return {
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:deviceName': config.deviceName,
        'appium:autoGrantPermissions': true,
        'appium:noReset': false,
        'appium:newCommandTimeout': 300,
        'appium:adbExecTimeout': 120000,
        ...(appPath ? { 'appium:app': appPath } : {}),
        ...(config.appPackage ? { 'appium:appPackage': config.appPackage } : {}),
        ...(config.appActivity ? { 'appium:appActivity': config.appActivity } : {}),
        ...(config.appWaitActivity ? { 'appium:appWaitActivity': config.appWaitActivity } : {}),
    };
}

