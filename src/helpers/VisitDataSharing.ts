export interface VisitData {
  patientName: string;
  employeeName: string;
  startTime: string;
  endTime: string;
  date: string;
  serviceCode: string;
  poc: string;
  payRate: string;
  visitId?: string;
}

export class VisitDataSharing {
  private static visitData: VisitData | null = null;

  //-------Store visit data created on web for mobile verification ---------------------
  static setVisitData(data: VisitData): void {
    this.visitData = { ...data };
    console.log('Visit data stored for mobile verification:', this.visitData);
  }

  //------------Get visit data for mobile verification--------------
  static getVisitData(): VisitData | null {
    return this.visitData;
  }

  //----------Clear visit data (useful for cleanup between tests)------------------

  static clearVisitData(): void {
    this.visitData = null;
    console.log('Visit data cleared');
  }

  //------------Generate time slot string for mobile verification ---------------------
  static getTimeSlotString(startTime: string): string {
    return startTime.split(':')[0] + ':00';
  }

  //------------Validate that required visit data is present ---------------------

  static validateVisitData(): boolean {
    if (!this.visitData) return false;
    
    const required = ['patientName', 'employeeName', 'startTime'];
    return required.every(field => this.visitData![field as keyof VisitData]);
  }

  //------------Get formatted date for mobile verification -------------------
  
  static getFormattedDate(): string {
    if (!this.visitData?.date) {
      return new Date().toLocaleDateString();
    }
    return this.visitData.date;
  }
}
