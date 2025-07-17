import { TextEncoder } from 'text-encoding';

// --- BLUETOOTH PRINTER SERVICE (from user) ---
const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ff12-0000-1000-8000-00805f9b34fb',
  '00001801-0000-1000-8000-00805f9b34fb',
];
const WRITE_CHARACTERISTIC_UUIDS = [
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
  '49535343-1e4d-4bd9-ba61-23c647249616',
  '0000ff02-0000-1000-8000-00805f9b34fb',
];

export interface ReceiptData {
  ticketNumber: string;
  busRegistration: string;
  pickupPoint: string;
  destination: string;
  price: string;
  discount: string;
  paymentMethod: string;
  date: string;
  passengerName: string;
}

export interface LuggageReceiptData {
  ticketNumber: string;
  busRegistration: string;
  origin: string;
  destination: string;
  departureDate: string;
  issueDate: string;
  issueTime: string;
  driverName?: string;
  conductorName?: string;
  busContactNumber?: string;
  luggageDescription: string;
  luggageOwnerName?: string;
  luggageOwnerPhone?: string;
  price: number;
  discount: number;
  totalPrice: number;
  paymentMethod: string;
  issueLocation: string;
  agentName: string;
}

class BluetoothPrinterService {
  private device: BluetoothDevice | null = null;
  private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private encoder = new TextEncoder();

  public isConnected(): boolean {
    return this.device?.gatt?.connected ?? false;
  }

  public getPrinterName(): string | null {
    return this.device?.name ?? null;
  }

  public async connectPrinter(): Promise<string> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth is not supported in this browser.');
    }
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: PRINTER_SERVICE_UUIDS.map((uuid) => ({ services: [uuid] })),
        optionalServices: PRINTER_SERVICE_UUIDS,
      });
      if (!this.device || !this.device.gatt) {
        throw new Error('No device selected or GATT server not available.');
      }
      const server = await this.device.gatt.connect();
      for (const serviceUuid of PRINTER_SERVICE_UUIDS) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          for (const charUuid of WRITE_CHARACTERISTIC_UUIDS) {
            try {
              const characteristic = await service.getCharacteristic(charUuid);
              this.writeCharacteristic = characteristic;
              return this.device.name || 'Unknown Printer';
            } catch (charError) {
              // continue
            }
          }
        } catch (serviceError) {
          // continue
        }
      }
      throw new Error('No suitable printer service or write characteristic found.');
    } catch (error) {
      this.disconnect();
      throw error;
    }
  }

  public async printText(text: string): Promise<void> {
    if (!this.writeCharacteristic) {
      throw new Error('Printer not connected or write characteristic not found.');
    }
    try {
      const data = this.encoder.encode(text + '\n');
      const chunkSize = 20;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await this.writeCharacteristic.writeValue(chunk);
      }
    } catch (error) {
      throw error;
    }
  }

  public disconnect(): void {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.writeCharacteristic = null;
  }
}

// Singleton instance
let printerInstance: BluetoothPrinterService | null = null;
function getPrinterInstance(): BluetoothPrinterService {
  if (!printerInstance) printerInstance = new BluetoothPrinterService();
  return printerInstance;
}

// --- PUBLIC API ---
export async function connectThermalPrinter(): Promise<string> {
  return await getPrinterInstance().connectPrinter();
}

export async function disconnectThermalPrinter(): Promise<void> {
  getPrinterInstance().disconnect();
}

export async function printThermalReceipt(data: ReceiptData & { driverName?: string; conductorName?: string; busPhoneNumber?: string }): Promise<void> {
  // Format a simple ticket for now (customize as needed)
  let text = `TIMBOON BUS\nPASSENGER TICKET\n==============================\nTicket: ${data.ticketNumber}\nDate: ${data.date}\n------------------------------\nBus: ${data.busRegistration}\n${data.pickupPoint} -> ${data.destination}\n------------------------------\nPassenger: ${data.passengerName}\n------------------------------\nPrice: $${data.price}\nDiscount: $${data.discount}\nTOTAL: $${(parseFloat(data.price) - parseFloat(data.discount)).toFixed(2)}\nMethod: ${data.paymentMethod}\n`;
  // Add driver, conductor, phone if present
  if (data.driverName || data.conductorName || data.busPhoneNumber) {
    text += '------------------------------\n';
    if (data.driverName) text += `Driver: ${data.driverName}\n`;
    if (data.conductorName) text += `Conductor: ${data.conductorName}\n`;
    if (data.busPhoneNumber) text += `Bus Phone: ${data.busPhoneNumber}\n`;
  }
  text += '==============================\nThank you for traveling!\n';
  await getPrinterInstance().printText(text);
}

export async function printThermalLuggageReceipt(data: LuggageReceiptData): Promise<void> {
  // Format a simple luggage ticket for Bluetooth printer
  const text = `TIMBOON BUS\nLUGGAGE TICKET\n==============================\nTicket: ${data.ticketNumber}\nDate: ${data.issueDate} ${data.issueTime}\n------------------------------\nBus: ${data.busRegistration}\n${data.origin} -> ${data.destination}\nDeparture: ${data.departureDate}\n------------------------------\nLuggage: ${data.luggageDescription}\nOwner: ${data.luggageOwnerName || '-'}\nContact: ${data.luggageOwnerPhone || '-'}\n------------------------------\nFee: $${data.price.toFixed(2)}\nDiscount: $${data.discount.toFixed(2)}\nTOTAL: $${data.totalPrice.toFixed(2)}\nMethod: ${data.paymentMethod}\n------------------------------\nLocation: ${data.issueLocation}\nAgent: ${data.agentName}\n==============================\nKEEP THIS RECEIPT FOR LUGGAGE CLAIM\nPresent this ticket when collecting your luggage\nThank you for traveling!\n`;
  await getPrinterInstance().printText(text);
}

// --- DESKTOP FALLBACK (unchanged) ---
export async function printDesktopReceipt(data: ReceiptData): Promise<void> {
  try {
    const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Timboon Bus Ticket - ${data.ticketNumber}</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 12px; 
          line-height: 1.3; 
          margin: 0; 
          padding: 10px; 
          width: 300px; 
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-bottom: 1px dashed #000; margin: 5px 0; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        @media print {
          body { margin: 0; padding: 5px; }
        }
      </style>
    </head>
    <body>
      <div class="center bold">
        TIMBOON BUS LINES<br>
        PASSENGER TICKET
      </div>
      <div class="line"></div>
      
      <div class="row">
        <span>Ticket:</span>
        <span>${data.ticketNumber}</span>
      </div>
      <div class="row">
        <span>Date:</span>
        <span>${data.date}</span>
      </div>
      
      <div class="line"></div>
      
      <div class="center bold">TRIP DETAILS</div>
      <div class="row">
        <span>Bus:</span>
        <span>${data.busRegistration}</span>
      </div>
      <div class="row">
        <span>Route:</span>
        <span>${data.pickupPoint} → ${data.destination}</span>
      </div>
      <div class="row">
        <span>Departure:</span>
        <span>${data.date}</span>
      </div>
      ${
        data.passengerName
          ? `
      <div class="row">
        <span>Passenger:</span>
        <span>${data.passengerName}</span>
      </div>`
          : ""
      }
      
      <div class="line"></div>
      
      <div class="center bold">PAYMENT</div>
      <div class="row">
        <span>Price:</span>
        <span>$${data.price}</span>
      </div>
      ${
        data.discount > 0
          ? `
      <div class="row">
        <span>Discount:</span>
        <span>$${data.discount}</span>
      </div>`
          : ""
      }
      <div class="row bold">
        <span>TOTAL:</span>
        <span>$${(parseFloat(data.price) - parseFloat(data.discount)).toFixed(2)}</span>
      </div>
      <div class="row">
        <span>Method:</span>
        <span>${data.paymentMethod}</span>
      </div>
      
      <div class="line"></div>
      
      <div class="center">
        Thank you for traveling<br>
        with <strong>TIMBOON BUS!</strong>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => window.close(), 1000);
        }
      </script>
    </body>
    </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(receiptHTML)
      printWindow.document.close()
    } else {
      throw new Error("Failed to open print window.")
    }
  } catch (error) {
    console.error("❌ Desktop printing error:", error)
    throw new Error("Failed to print desktop receipt.")
  }
}

// Desktop luggage receipt
async function printDesktopLuggageReceipt(data: LuggageReceiptData): Promise<void> {
  try {
    const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Timboon Bus Luggage Ticket - ${data.ticketNumber}</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 12px; 
          line-height: 1.3; 
          margin: 0; 
          padding: 10px; 
          width: 300px; 
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-bottom: 1px dashed #000; margin: 5px 0; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        .luggage-box { 
          border: 2px solid #e74c3c; 
          padding: 8px; 
          margin: 8px 0; 
          border-radius: 3px;
          background-color: #fdf2f2;
        }
        .important {
          background-color: #fff3cd;
          border: 2px solid #ffc107;
          padding: 8px;
          border-radius: 3px;
          text-align: center;
          font-weight: bold;
          color: #856404;
          margin: 8px 0;
        }
        @media print {
          body { margin: 0; padding: 5px; }
        }
      </style>
    </head>
    <body>
      <div class="center bold">
        TIMBOON BUS LINES<br>
        LUGGAGE TICKET
      </div>
      <div class="line"></div>
      
      <div class="row">
        <span>Ticket:</span>
        <span>${data.ticketNumber}</span>
      </div>
      <div class="row">
        <span>Date:</span>
        <span>${data.issueDate} ${data.issueTime}</span>
      </div>
      
      <div class="line"></div>
      
      <div class="center bold">TRIP DETAILS</div>
      <div class="row">
        <span>Bus:</span>
        <span>${data.busRegistration}</span>
      </div>
      <div class="row">
        <span>Route:</span>
        <span>${data.origin} → ${data.destination}</span>
      </div>
      <div class="row">
        <span>Departure:</span>
        <span>${data.departureDate}</span>
      </div>
      ${
        data.driverName
          ? `
      <div class="row">
        <span>Driver:</span>
        <span>${data.driverName}</span>
      </div>`
          : ""
      }
      ${
        data.conductorName
          ? `
      <div class="row">
        <span>Conductor:</span>
        <span>${data.conductorName}</span>
      </div>`
          : ""
      }
      ${
        data.busContactNumber
          ? `
      <div class="row">
        <span>Contact:</span>
        <span>${data.busContactNumber}</span>
      </div>`
          : ""
      }
      
      <div class="luggage-box">
        <div class="center bold">LUGGAGE INFORMATION</div>
        <div class="row">
          <span>Description:</span>
          <span>${data.luggageDescription}</span>
        </div>
        ${
          data.luggageOwnerName
            ? `
        <div class="row">
          <span>Owner:</span>
          <span>${data.luggageOwnerName}</span>
        </div>`
            : ""
        }
        <div class="row">
          <span>Contact:</span>
          <span>${data.luggageOwnerPhone}</span>
        </div>
      </div>
      
      <div class="line"></div>
      
      <div class="center bold">PAYMENT</div>
      <div class="row">
        <span>Fee:</span>
        <span>$${data.price.toFixed(2)}</span>
      </div>
      ${
        data.discount > 0
          ? `
      <div class="row">
        <span>Discount:</span>
        <span>$${data.discount.toFixed(2)}</span>
      </div>`
          : ""
      }
      <div class="row bold">
        <span>TOTAL:</span>
        <span>$${data.totalPrice.toFixed(2)}</span>
      </div>
      <div class="row">
        <span>Method:</span>
        <span>${data.paymentMethod}</span>
      </div>
      
      <div class="line"></div>
      
      <div class="row">
        <span>Location:</span>
        <span>${data.issueLocation}</span>
      </div>
      <div class="row">
        <span>Agent:</span>
        <span>${data.agentName}</span>
      </div>
      
      <div class="important">
        KEEP THIS RECEIPT FOR LUGGAGE CLAIM<br>
        Present this ticket when collecting your luggage
      </div>
      
      <div class="center">
        Thank you for traveling<br>
        with <strong>TIMBOON BUS COMPANY</strong>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => window.close(), 1000);
        }
      </script>
    </body>
    </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(receiptHTML)
      printWindow.document.close()
    } else {
      throw new Error("Failed to open print window.")
    }
  } catch (error) {
    console.error("❌ Desktop luggage printing error:", error)
    throw new Error("Failed to print desktop luggage receipt.")
  }
} 