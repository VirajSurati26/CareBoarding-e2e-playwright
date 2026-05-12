import { remote } from 'webdriverio';
import { exec } from 'child_process';

export class MobileApp {
    driver: any;

    constructor() {}

    async startEmulator(): Promise<void> {
        console.log('Starting Android emulator...');
        
        // Check if emulator is already running
        const existingDevices = await this.checkDevices();
        if (existingDevices.includes('emulator-5554')) {
            console.log('Emulator is already running');
            return;
        }
        
        try {
            await this.execCommand('emulator -avd MyEmulator');
            
            console.log('Waiting for emulator to boot...');
            // Wait with periodic checks
            let attempts = 0;
            const maxAttempts = 30; // 30 attempts with 2-second intervals = 60 seconds max
            
            while (attempts < maxAttempts) {
                await this.sleep(2000);
                const devices = await this.checkDevices();
                if (devices.includes('emulator-5554')) {
                    console.log('Emulator is ready');
                    return;
                }
                attempts++;
                console.log(`Waiting for emulator... (${attempts}/${maxAttempts})`);
            }
            
            throw new Error('Emulator failed to start within timeout');
        } catch (error) {
            console.error('Failed to start emulator:', error);
            throw error;
        }
    }

    async startAppium(): Promise<void> {
        console.log('Starting Appium server...');
        await this.execCommand('start cmd /k npx appium --port 4724');
        
        console.log('Waiting for Appium server to be ready...');
        await this.sleep(15000);
    }

    async connectDevice(deviceName: string = 'emulator-5554'): Promise<void> {
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
        console.log('Connected to Mobile');
    }

    async login(username: string, password: string): Promise<void> {
        await this.driver.$('android=new UiSelector().resourceId("com.careboarding:id/username")').setValue(username);
        await this.driver.$('android=new UiSelector().resourceId("com.careboarding:id/password")').setValue(password);
        await this.driver.$('android=new UiSelector().resourceId("com.careboarding:id/loginBtn")').click();
    }

    async checkDevices(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            exec('adb devices', (error, stdout) => {
                if (error) {
                    reject(error);
                    return;
                }
                const devices = stdout.split('\n')
                    .slice(1)
                    .filter(line => line.trim() && line.includes('\tdevice'))
                    .map(line => line.split('\t')[0]);
                resolve(devices);
            });
        });
    }

    async closeDevice(): Promise<void> {
        if (this.driver) {
            await this.driver.deleteSession();
        }
    }

    async goToVisits(): Promise<void> {
        await this.driver.$('android=new UiSelector().text("Visits")').click();
    }

    async searchPatient(name: string): Promise<void> {
        await this.driver.$('android=new UiSelector().resourceId("searchInput")').setValue(name);
    }

    async checkVisitExists(patientName: string): Promise<boolean> {
        try {
            const element = await this.driver.$(`android=new UiSelector().textContains("${patientName}")`);
            return await element.isDisplayed();
        } catch {
            return false;
        }
    }

    private async execCommand(command: string): Promise<void> {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing command: ${command}`);
                    console.error(`Error details: ${error.message}`);
                    if (stderr) console.error(`stderr: ${stderr}`);
                    reject(error);
                } else {
                    console.log(`Command executed successfully: ${command}`);
                    if (stdout) console.log(`Output: ${stdout}`);
                    resolve();
                }
            });
        });
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}