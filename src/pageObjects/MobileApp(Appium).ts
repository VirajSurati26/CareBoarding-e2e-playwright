import { remote } from 'webdriverio';
import { exec } from 'child_process';

export class MobileApp {
    driver: any;

    //--------- Emulator and Appium Setup ---------//
    async startEmulator(): Promise<void> {
        const devices = await this.checkDevices();
        if (devices.includes('emulator-5554')) return;
        
        await this.execCommand('emulator -avd MyEmulator');
        
        for (let i = 0; i < 30; i++) {
            await this.sleep(2000);
            const currentDevices = await this.checkDevices();
            if (currentDevices.includes('emulator-5554')) return;
        }
        throw new Error('Emulator failed to start');
    }

    //--------- Appium Server ---------//
    async startAppium(): Promise<void> {
        await this.execCommand('start cmd /k npx appium --port 4724');
        await this.sleep(15000);
    }

    //--------- Device Connection ---------//
    async connectDevice(deviceName = 'emulator-5554'): Promise<void> {
        this.driver = await remote({
            hostname: '127.0.0.1',
            port: 4724,
            path: '/',
            capabilities: {
                platformName: 'Android',
                'appium:deviceName': deviceName,
                'appium:automationName': 'UiAutomator2',
                'appium:appPackage': 'com.careboarding',
                'appium:appActivity': '.MainActivity'
            }
        });
    }

    //--------- Login ---------//
    async login(username: string, password: string): Promise<void> {
        const emailField = await this.driver.$('android=new UiSelector().className("android.widget.EditText").instance(0)');
        const passwordField = await this.driver.$('android=new UiSelector().className("android.widget.EditText").instance(1)');
        const signInButton = await this.driver.$('android=new UiSelector().text("Sign In")');

        await emailField.setValue(username);
        await passwordField.setValue(password);
        await signInButton.click();
        await this.sleep(5000);
    }

    //--------- Navigation ---------//
    async goToVisits(): Promise<void> {
        await this.driver.$('android=new UiSelector().text("Visits")').click();
        await this.sleep(5000);
    }

    //--------- Search ---------//
    async searchPatient(name: string): Promise<void> {
        await this.driver.$('android=new UiSelector().resourceId("searchInput")').setValue(name);
        await this.sleep(2000);
    }

    //--------- Visit Check ---------//
    async checkVisitExists(patientName: string): Promise<boolean> {
        try {
            const element = await this.driver.$(`android=new UiSelector().textContains("${patientName}")`);
            return await element.isDisplayed();
        } catch {
            return false;
        }
    }

    //--------- Device Management ---------//
    async closeDevice(): Promise<void> {
        if (this.driver) await this.driver.deleteSession();
    }

    //--------- Device List ---------//
    async checkDevices(): Promise<string[]> {
        return new Promise((resolve) => {
            exec('adb devices', (error, stdout) => {
                if (error) resolve([]);
                const devices = stdout.split('\n')
                    .slice(1)
                    .filter(line => line.trim() && line.includes('\tdevice'))
                    .map(line => line.split('\t')[0]);
                resolve(devices);
            });
        });
    }

    //--------- Command Execution ---------//
    private async execCommand(command: string): Promise<void> {
        return new Promise((resolve, reject) => {
            exec(command, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    //--------- Sleep ---------//
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}