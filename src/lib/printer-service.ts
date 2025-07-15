// Enhanced Bluetooth thermal printer service with better connectivity and formatting
export interface ReceiptData {
  ticketNumber: string
  busRegistration: string
  driverName: string
  conductorName: string
  busContactNumber?: string
  origin: string
  destination: string
  departureDate: string
  departureTime: string
  passengerName?: string | null
  passengerPhone?: string | null
  seatNumber?: string | null
  price: number
  discount: number
  totalPrice: number
  paymentMethod: string
  issueDate: string
  issueTime: string
  issueLocation: string
  agentName: string
  isQuickMode?: boolean
}

export interface LuggageReceiptData {
  ticketNumber: string
  busRegistration: string
  driverName: string
  conductorName: string
  busContactNumber?: string
  origin: string
  destination: string
  departureDate: string
  departureTime: string
  luggageDescription: string
  luggageOwnerName?: string | null
  luggageOwnerPhone: string
  price: number
  discount: number
  totalPrice: number
  paymentMethod: string
  issueDate: string
  issueTime: string
  issueLocation: string
  agentName: string
}

// Enhanced Bluetooth thermal printer class
class BluetoothThermalPrinter {
  private device: BluetoothDevice | null = null
  private server: BluetoothRemoteGATTServer | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null
  private isConnected = false
  private connectionAttempts = 0
  private maxConnectionAttempts = 3
  private reconnectTimeout: NodeJS.Timeout | null = null
  private keepAliveInterval: NodeJS.Timeout | null = null

  async connect(): Promise<boolean> {
    try {
      if (!navigator.bluetooth) {
        throw new Error("Bluetooth is not supported in this browser")
      }

      console.log("🔵 Requesting Bluetooth device...")

      // Request device with comprehensive filters for thermal printers
      const PRINTER_SERVICE_UUIDS = [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '0000ff00-0000-1000-8000-00805f9b34fb',
        '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
        '0000ffe0-0000-1000-8000-00805f9b34fb',
        '0000ffe1-0000-1000-8000-00805f9b34fb',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        '49535343-1e4d-4bd9-ba61-23c647249616',
        '0000ff12-0000-1000-8000-00805f9b34fb',
        '0000ff02-0000-1000-8000-00805f9b34fb',
        '000018f1-0000-1000-8000-00805f9b34fb',
        '000018f2-0000-1000-8000-00805f9b34fb',
        '00001801-0000-1000-8000-00805f9b34fb',
        '0000180a-0000-1000-8000-00805f9b34fb',
        '0000180f-0000-1000-8000-00805f9b34fb',
        '12345678-1234-1234-1234-123456789abc',
        '87654321-4321-4321-4321-cba987654321',
      ];
      const WRITE_CHARACTERISTIC_UUIDS = [
        '00002af1-0000-1000-8000-00805f9b34fb',
        '0000ff01-0000-1000-8000-00805f9b34fb',
        '49535343-1e4d-4bd9-ba61-23c647249616',
        '49535343-8841-43f4-a8d4-ecbe34729bb3',
        '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
        '0000ffe1-0000-1000-8000-00805f9b34fb',
        '0000ff02-0000-1000-8000-00805f9b34fb',
      ];
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICE_UUIDS,
      })

      if (!this.device) {
        throw new Error("No device selected")
      }

      console.log("🔵 Selected device:", this.device.name)

      // Add disconnect listener with reconnection logic
      this.device.addEventListener("gattserverdisconnected", this.handleDisconnection.bind(this))

      // Connect to GATT server with retry logic
      await this.connectWithRetry()

      // Start keep-alive mechanism
      this.startKeepAlive()

      this.isConnected = true
      this.connectionAttempts = 0
      console.log("✅ Connected to Bluetooth thermal printer:", this.device.name)
      return true
    } catch (error) {
      console.error("❌ Bluetooth connection error:", error)
      this.isConnected = false
      throw error
    }
  }

  private async connectWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= this.maxConnectionAttempts; attempt++) {
      try {
        console.log(`🔵 Connection attempt ${attempt}/${this.maxConnectionAttempts}...`)

        if (this.device?.gatt) {
          this.server = await this.device.gatt.connect()
          if (this.server) {
            await this.findPrinterCharacteristic()
            return // Success
          }
        }
      } catch (error) {
        console.warn(`❌ Connection attempt ${attempt} failed:`, error)
        if (attempt === this.maxConnectionAttempts) {
          throw error
        }
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    }
    throw new Error("Failed to connect after multiple attempts")
  }

  private handleDisconnection(): void {
    console.log("🔴 Printer disconnected")
    this.isConnected = false
    this.stopKeepAlive()

    // Only attempt reconnection if not manually disconnected
    if (this.device && this.connectionAttempts < this.maxConnectionAttempts) {
      console.log("🔄 Attempting automatic reconnection...")
      this.connectionAttempts++

      this.reconnectTimeout = setTimeout(async () => {
        try {
          await this.connectWithRetry()
          this.isConnected = true
          this.startKeepAlive()
          console.log("✅ Automatically reconnected to printer")
        } catch (error) {
          console.error("❌ Automatic reconnection failed:", error)
        }
      }, 2000)
    }
  }

  private startKeepAlive(): void {
    // Send periodic keep-alive signals to maintain connection
    this.keepAliveInterval = setInterval(async () => {
      if (this.isConnected && this.characteristic) {
        try {
          // Send a minimal command to keep connection alive
          const keepAliveCommand = new Uint8Array([0x10, 0x04, 0x01]) // DLE EOT n
          await this.characteristic.writeValue(keepAliveCommand)
        } catch (error) {
          console.warn("Keep-alive failed:", error)
        }
      }
    }, 30000) // Every 30 seconds
  }

  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval)
      this.keepAliveInterval = null
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  private async findPrinterCharacteristic(): Promise<void> {
    if (!this.server) throw new Error("No GATT server")

    const PRINTER_SERVICE_UUIDS = [
      "000018f0-0000-1000-8000-00805f9b34fb",
      "0000ff00-0000-1000-8000-00805f9b34fb",
      "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
      "0000ffe0-0000-1000-8000-00805f9b34fb",
      "0000ffe1-0000-1000-8000-00805f9b34fb",
      "49535343-fe7d-4ae5-8fa9-9fafd205e455",
      "49535343-1e4d-4bd9-ba61-23c647249616",
      "0000ff12-0000-1000-8000-00805f9b34fb",
      "0000ff02-0000-1000-8000-00805f9b34fb",
      "000018f1-0000-1000-8000-00805f9b34fb",
      "000018f2-0000-1000-8000-00805f9b34fb",
      "00001801-0000-1000-8000-00805f9b34fb",
      "0000180a-0000-1000-8000-00805f9b34fb",
      "0000180f-0000-1000-8000-00805f9b34fb",
      "12345678-1234-1234-1234-123456789abc",
      "87654321-4321-4321-4321-cba987654321",
    ]
    const WRITE_CHARACTERISTIC_UUIDS = [
      "00002af1-0000-1000-8000-00805f9b34fb",
      "0000ff01-0000-1000-8000-00805f9b34fb",
      "49535343-1e4d-4bd9-ba61-23c647249616",
      "49535343-8841-43f4-a8d4-ecbe34729bb3",
      "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
      "0000ffe1-0000-1000-8000-00805f9b34fb",
      "0000ff02-0000-1000-8000-00805f9b34fb",
    ]

    // Try to find working service and characteristic combination
    for (const serviceUUID of PRINTER_SERVICE_UUIDS) {
      try {
        console.log(`🔍 Trying service: ${serviceUUID}`)
        const service = await this.server.getPrimaryService(serviceUUID)

        for (const charUUID of WRITE_CHARACTERISTIC_UUIDS) {
          try {
            this.characteristic = await service.getCharacteristic(charUUID)
            console.log(`✅ Found working characteristic: ${charUUID}`)
            return
          } catch (e) {
            continue
          }
        }
      } catch (e) {
        continue
      }
    }

    throw new Error("Could not find compatible printer service/characteristic")
  }

  async ensureConnection(): Promise<void> {
    if (!this.isConnected || !this.server?.connected) {
      console.log("🔄 Reconnecting to printer...")
      if (this.device?.gatt) {
        await this.connectWithRetry()
        this.isConnected = true
        this.startKeepAlive()
      } else {
        throw new Error("Device not available for reconnection")
      }
    }
  }

  async writeData(data: Uint8Array): Promise<void> {
    await this.ensureConnection()

    if (!this.characteristic) {
      throw new Error("Printer characteristic not available")
    }

    try {
      // Send data in smaller chunks with delays for better reliability
      const chunkSize = 20
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize)
        await this.characteristic.writeValue(chunk)
        // Small delay between chunks for stability
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    } catch (error) {
      console.error("❌ Write error:", error)
      // Try to reconnect and retry once
      try {
        await this.ensureConnection()
        const chunkSize = 20
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize)
          await this.characteristic.writeValue(chunk)
          await new Promise((resolve) => setTimeout(resolve, 50))
        }
      } catch (retryError) {
        throw new Error("Failed to send data to printer after retry")
      }
    }
  }

  async printReceipt(data: ReceiptData): Promise<void> {
    try {
      await this.ensureConnection()

      console.log("🖨️ Formatting receipt for thermal printer...")

      // Create compact receipt text with proper ESC/POS commands
      const receiptCommands = this.formatThermalReceipt(data)

      // Send to printer
      await this.writeData(receiptCommands)

      console.log("✅ Receipt printed successfully")
    } catch (error) {
      console.error("❌ Print error:", error)
      throw error
    }
  }

  async printLuggageReceipt(data: LuggageReceiptData): Promise<void> {
    try {
      await this.ensureConnection()

      console.log("🖨️ Formatting luggage receipt for thermal printer...")

      // Create compact luggage receipt text
      const receiptCommands = this.formatThermalLuggageReceipt(data)

      // Send to printer
      await this.writeData(receiptCommands)

      console.log("✅ Luggage receipt printed successfully")
    } catch (error) {
      console.error("❌ Luggage print error:", error)
      throw error
    }
  }

  private formatThermalReceipt(data: ReceiptData): Uint8Array {
    const commands: number[] = []

    // Initialize printer
    commands.push(...[0x1b, 0x40]) // ESC @ - Initialize

    // Set character set and encoding
    commands.push(...[0x1b, 0x74, 0x00]) // Set character set

    // Center align and print header
    commands.push(...[0x1b, 0x61, 0x01]) // Center align
    commands.push(...[0x1b, 0x21, 0x30]) // Double height and width
    commands.push(...this.stringToBytes("TIMBOON BUS\n"))
    commands.push(...[0x1b, 0x21, 0x00]) // Normal size
    commands.push(...this.stringToBytes("PASSENGER TICKET\n"))
    commands.push(...this.stringToBytes("================================\n"))

    // Left align for details
    commands.push(...[0x1b, 0x61, 0x00]) // Left align

    // Ticket details
    commands.push(...this.stringToBytes(`Ticket: ${data.ticketNumber}\n`))
    commands.push(...this.stringToBytes(`Date: ${data.issueDate} ${data.issueTime}\n`))
    commands.push(...this.stringToBytes("--------------------------------\n"))

    // Trip details
    commands.push(...this.stringToBytes("TRIP DETAILS\n"))
    commands.push(...this.stringToBytes(`Bus: ${data.busRegistration}\n`))
    commands.push(...this.stringToBytes(`${data.origin} -> ${data.destination}\n`))
    commands.push(...this.stringToBytes(`Departure: ${data.departureDate}\n`))

    if (data.driverName) {
      commands.push(...this.stringToBytes(`Driver: ${data.driverName}\n`))
    }
    if (data.conductorName) {
      commands.push(...this.stringToBytes(`Conductor: ${data.conductorName}\n`))
    }
    if (data.busContactNumber) {
      commands.push(...this.stringToBytes(`Contact: ${data.busContactNumber}\n`))
    }

    commands.push(...this.stringToBytes("--------------------------------\n"))

    // Passenger details (only if not quick mode)
    if (!data.isQuickMode && (data.passengerName || data.passengerPhone || data.seatNumber)) {
      commands.push(...this.stringToBytes("PASSENGER\n"))
      if (data.passengerName) {
        commands.push(...this.stringToBytes(`Name: ${data.passengerName}\n`))
      }
      if (data.passengerPhone) {
        commands.push(...this.stringToBytes(`Phone: ${data.passengerPhone}\n`))
      }
      if (data.seatNumber) {
        commands.push(...this.stringToBytes(`Seat: ${data.seatNumber}\n`))
      }
      commands.push(...this.stringToBytes("--------------------------------\n"))
    }

    // Payment details
    commands.push(...this.stringToBytes("PAYMENT\n"))
    commands.push(...this.stringToBytes(`Price: $${data.price.toFixed(2)}\n`))

    // Show discount if greater than 0
    if (data.discount > 0) {
      commands.push(...this.stringToBytes(`Discount: $${data.discount.toFixed(2)}\n`))
    }

    // Bold for total
    commands.push(...[0x1b, 0x45, 0x01]) // Bold on
    commands.push(...this.stringToBytes(`TOTAL: $${data.totalPrice.toFixed(2)}\n`))
    commands.push(...[0x1b, 0x45, 0x00]) // Bold off

    commands.push(...this.stringToBytes(`Method: ${data.paymentMethod}\n`))
    commands.push(...this.stringToBytes("--------------------------------\n"))

    // Footer
    commands.push(...this.stringToBytes(`Location: ${data.issueLocation}\n`))
    commands.push(...this.stringToBytes(`Agent: ${data.agentName}\n`))
    commands.push(...this.stringToBytes("================================\n"))

    // Center align for thank you message
    commands.push(...[0x1b, 0x61, 0x01]) // Center align
    commands.push(...this.stringToBytes("Thank you for traveling\n"))
    commands.push(...this.stringToBytes("with TIMBOON BUS!\n"))
    commands.push(...this.stringToBytes("\n\n"))

    // Cut paper
    commands.push(...[0x1d, 0x56, 0x00]) // Cut

    return new Uint8Array(commands)
  }

  private formatThermalLuggageReceipt(data: LuggageReceiptData): Uint8Array {
    const commands: number[] = []

    // Initialize printer
    commands.push(...[0x1b, 0x40]) // ESC @ - Initialize

    // Center align and print header
    commands.push(...[0x1b, 0x61, 0x01]) // Center align
    commands.push(...[0x1b, 0x21, 0x30]) // Double height and width
    commands.push(...this.stringToBytes("TIMBOON BUS\n"))
    commands.push(...[0x1b, 0x21, 0x00]) // Normal size
    commands.push(...this.stringToBytes("LUGGAGE TICKET\n"))
    commands.push(...this.stringToBytes("================================\n"))

    // Left align for details
    commands.push(...[0x1b, 0x61, 0x00]) // Left align

    // Ticket details
    commands.push(...this.stringToBytes(`Ticket: ${data.ticketNumber}\n`))
    commands.push(...this.stringToBytes(`Date: ${data.issueDate} ${data.issueTime}\n`))
    commands.push(...this.stringToBytes("--------------------------------\n"))

    // Trip details
    commands.push(...this.stringToBytes("TRIP DETAILS\n"))
    commands.push(...this.stringToBytes(`Bus: ${data.busRegistration}\n`))
    commands.push(...this.stringToBytes(`${data.origin} -> ${data.destination}\n`))
    commands.push(...this.stringToBytes(`Departure: ${data.departureDate}\n`))

    if (data.driverName) {
      commands.push(...this.stringToBytes(`Driver: ${data.driverName}\n`))
    }
    if (data.conductorName) {
      commands.push(...this.stringToBytes(`Conductor: ${data.conductorName}\n`))
    }
    if (data.busContactNumber) {
      commands.push(...this.stringToBytes(`Contact: ${data.busContactNumber}\n`))
    }

    commands.push(...this.stringToBytes("--------------------------------\n"))

    // Luggage details
    commands.push(...this.stringToBytes("LUGGAGE\n"))
    commands.push(...this.stringToBytes(`Description: ${data.luggageDescription}\n`))
    if (data.luggageOwnerName) {
      commands.push(...this.stringToBytes(`Owner: ${data.luggageOwnerName}\n`))
    }
    commands.push(...this.stringToBytes(`Phone: ${data.luggageOwnerPhone}\n`))
    commands.push(...this.stringToBytes("--------------------------------\n"))

    // Payment details
    commands.push(...this.stringToBytes("PAYMENT\n"))
    commands.push(...this.stringToBytes(`Fee: $${data.price.toFixed(2)}\n`))

    // Show discount if greater than 0
    if (data.discount > 0) {
      commands.push(...this.stringToBytes(`Discount: $${data.discount.toFixed(2)}\n`))
    }

    // Bold for total
    commands.push(...[0x1b, 0x45, 0x01]) // Bold on
    commands.push(...this.stringToBytes(`TOTAL: $${data.totalPrice.toFixed(2)}\n`))
    commands.push(...[0x1b, 0x45, 0x00]) // Bold off

    commands.push(...this.stringToBytes(`Method: ${data.paymentMethod}\n`))
    commands.push(...this.stringToBytes("--------------------------------\n"))

    // Footer
    commands.push(...this.stringToBytes(`Location: ${data.issueLocation}\n`))
    commands.push(...this.stringToBytes(`Agent: ${data.agentName}\n`))
    commands.push(...this.stringToBytes("================================\n"))

    // Center align for important message
    commands.push(...[0x1b, 0x61, 0x01]) // Center align
    commands.push(...[0x1b, 0x45, 0x01]) // Bold on
    commands.push(...this.stringToBytes("KEEP THIS RECEIPT\n"))
    commands.push(...this.stringToBytes("Present for luggage claim\n"))
    commands.push(...[0x1b, 0x45, 0x00]) // Bold off
    commands.push(...this.stringToBytes("\n"))
    commands.push(...this.stringToBytes("TIMBOON BUS COMPANY\n"))
    commands.push(...this.stringToBytes("\n\n"))

    // Cut paper
    commands.push(...[0x1d, 0x56, 0x00]) // Cut

    return new Uint8Array(commands)
  }

  private stringToBytes(str: string): number[] {
    return Array.from(new TextEncoder().encode(str))
  }

  async disconnect(): Promise<void> {
    try {
      // Stop automatic reconnection
      this.connectionAttempts = this.maxConnectionAttempts
      this.stopKeepAlive()

      // Remove event listeners
      if (this.device) {
        this.device.removeEventListener("gattserverdisconnected", this.handleDisconnection.bind(this))
      }

      if (this.server) {
        this.server.disconnect()
      }

      this.device = null
      this.server = null
      this.characteristic = null
      this.isConnected = false
      console.log("🔴 Manually disconnected from Bluetooth printer")
    } catch (error) {
      console.error("❌ Disconnect error:", error)
    }
  }

  isDeviceConnected(): boolean {
    return this.isConnected && this.server?.connected === true
  }

  getDeviceName(): string | null {
    return this.device?.name || null
  }
}

// Global printer instance
let printerInstance: BluetoothThermalPrinter | null = null

// Get or create printer instance
function getPrinterInstance(): BluetoothThermalPrinter {
  if (!printerInstance) {
    printerInstance = new BluetoothThermalPrinter()
  }
  return printerInstance
}

// Public API functions
export async function connectThermalPrinter(): Promise<boolean> {
  try {
    console.log("🔵 Connecting to thermal printer...")
    const printer = getPrinterInstance()
    return await printer.connect()
  } catch (error) {
    console.error("❌ Failed to connect to thermal printer:", error)
    throw error
  }
}

export async function disconnectThermalPrinter(): Promise<void> {
  try {
    const printer = getPrinterInstance()
    await printer.disconnect()
  } catch (error) {
    console.error("❌ Failed to disconnect thermal printer:", error)
    throw error
  }
}

export async function printThermalReceipt(data: ReceiptData): Promise<void> {
  try {
    console.log("🖨️ Printing thermal receipt...")
    const printer = getPrinterInstance()
    await printer.printReceipt(data)
  } catch (error) {
    console.error("❌ Failed to print thermal receipt:", error)
    throw error
  }
}

export async function printLuggageReceipt(data: LuggageReceiptData, printerType: string): Promise<void> {
  try {
    console.log(`🖨️ Printing luggage receipt (${printerType})...`)
    if (printerType === "thermal") {
      const printer = getPrinterInstance()
      await printer.printLuggageReceipt(data)
    } else {
      await printDesktopLuggageReceipt(data)
    }
  } catch (error) {
    console.error("❌ Failed to print luggage receipt:", error)
    throw error
  }
}

export function isThermalPrinterConnected(): boolean {
  const printer = getPrinterInstance()
  return printer.isDeviceConnected()
}

export function getThermalPrinterName(): string | null {
  const printer = getPrinterInstance()
  return printer.getDeviceName()
}

// Desktop printer service for fallback
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
      
      ${
        !data.isQuickMode && (data.passengerName || data.passengerPhone || data.seatNumber)
          ? `
      <div class="line"></div>
      <div class="center bold">PASSENGER</div>
      ${
        data.passengerName
          ? `
      <div class="row">
        <span>Name:</span>
        <span>${data.passengerName}</span>
      </div>`
          : ""
      }
      ${
        data.passengerPhone
          ? `
      <div class="row">
        <span>Phone:</span>
        <span>${data.passengerPhone}</span>
      </div>`
          : ""
      }
      ${
        data.seatNumber
          ? `
      <div class="row">
        <span>Seat:</span>
        <span>${data.seatNumber}</span>
      </div>`
          : ""
      }`
          : ""
      }
      
      <div class="line"></div>
      
      <div class="center bold">PAYMENT</div>
      <div class="row">
        <span>Price:</span>
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