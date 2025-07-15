"use client"

// Enhanced Bluetooth Thermal Printer Service with Improved Device Discovery
// Supports ESC/POS commands for 58mm and 80mm thermal printers

export interface BluetoothPrinterDevice {
  id: string
  name: string
  rssi?: number
  serviceUUIDs: string[]
  manufacturerData?: DataView
  isConnected: boolean
  deviceType: "thermal_printer" | "pos_printer" | "unknown"
  brand?: string
}

export interface PrintJob {
  id: string
  content: string
  status: "pending" | "printing" | "completed" | "failed"
  timestamp: string
  retryCount: number
  deviceId?: string
}

interface PrinterStatus {
  connected: boolean
  deviceName: string | null
  batteryLevel: number
  paperStatus: "ok" | "low" | "empty"
  connectionStrength: "excellent" | "good" | "poor"
  lastError: string | null
}

export interface TicketData {
  ticketNumber: string
  busRegistration: string
  driverName: string
  conductorName: string
  origin: string
  destination: string
  passengerName?: string
  passengerPhone?: string
  seatNumber?: string
  luggageDescription?: string
  luggageOwnerName?: string
  luggageOwnerPhone?: string
  price: number
  discount: number
  totalPrice: number
  paymentMethod: string
  issueDate: string
  issueTime: string
  issueLocation: string
  agentName: string
}

export interface TripSummaryData {
  tripId: string
  busRegistration: string
  driverName: string
  conductorName: string
  mainRoute: string
  startTime: string
  endTime: string
  duration: string
  stats: {
    totalTickets: number
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    cashOnHand: number
  }
  breakdown: {
    passengerTickets: number
    luggageTickets: number
    averageTicketPrice: number
  }
  route: {
    origin: string
    destination: string
    fullRoute: string
  }
  crew: {
    driver: string
    conductor: string
    busPhone: string
  }
  financial: {
    grossRevenue: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
    cashToDeposit: number
    expenseReceipts: number
  }
  generatedAt: string
  generatedBy: string
}

export interface ManifestData {
  busRegistration: string
  driverName: string
  conductorName: string
  tripId: string | null
  startTime: string | null
  passengerTickets: any[]
  luggageTickets: any[]
  totalPassengers: number
  totalLuggage: number
  totalRevenue: number
  totalExpenses: number
  printTime: string
}

type ConnectionListener = (status: PrinterStatus) => void

class ThermalPrinter {
  private static instance: ThermalPrinter | null = null
  private device: BluetoothDevice | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null
  private isConnected = false
  private isScanning = false
  private printQueue: PrintJob[] = []
  private connectionHealthInterval: NodeJS.Timeout | null = null
  private listeners: ((status: PrinterStatus) => void)[] = []

  // Enhanced service UUIDs for better device discovery
  private readonly PRINTER_SERVICE_UUIDS = [
    // Most common thermal printer services
    "0000ff00-0000-1000-8000-00805f9b34fb", // Common Chinese thermal printer
    "0000ffe0-0000-1000-8000-00805f9b34fb", // HM-10 BLE module service
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART Service
    "49535343-fe7d-4ae5-8fa9-9fafd205e455", // ESC/POS service
    "000018f0-0000-1000-8000-00805f9b34fb", // Standard thermal printer
    "0000ff12-0000-1000-8000-00805f9b34fb", // Zjiang thermal printer
    "000018f1-0000-1000-8000-00805f9b34fb", // HPRT thermal printer
  ]

  // Common characteristic UUIDs
  private readonly WRITE_CHARACTERISTIC_UUIDS = [
    "0000ffe1-0000-1000-8000-00805f9b34fb", // HM-10 characteristic
    "6e400002-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART TX
    "49535343-1e4d-4bd9-ba61-23c647249616", // ESC/POS write
    "0000ff02-0000-1000-8000-00805f9b34fb", // Common write characteristic
  ]

  private constructor() {
    // Check if Web Bluetooth is supported
    if (typeof navigator === "undefined" || !navigator.bluetooth) {
      console.warn("⚠️ Web Bluetooth is not supported in this environment")
    }
  }

  static getInstance(): ThermalPrinter {
    if (!ThermalPrinter.instance) {
      ThermalPrinter.instance = new ThermalPrinter()
    }
    return ThermalPrinter.instance
  }

  // Add connection status listener
  addConnectionListener(callback: (status: PrinterStatus) => void): void {
    this.listeners.push(callback)
  }

  // Remove connection status listener
  removeConnectionListener(callback: (status: PrinterStatus) => void): void {
    this.listeners = this.listeners.filter((l) => l !== callback)
  }

  // Notify all listeners of status changes
  private notifyListeners(): void {
    const status = this.getConnectionStatus()
    this.listeners.forEach((callback) => {
      try {
        callback(status)
      } catch (error) {
        console.error("Error in connection listener:", error)
      }
    })
  }

  // Enhanced device discovery with multiple strategies
  async connect(): Promise<boolean> {
    if (!navigator.bluetooth) {
      throw new Error("Web Bluetooth is not supported")
    }

    try {
      this.isScanning = true
      console.log("🔍 Starting enhanced printer discovery...")

      // Strategy 1: Try to connect to any device (most permissive)
      let device: BluetoothDevice | null = null

      try {
        console.log("📱 Opening device selector...")
        device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: this.PRINTER_SERVICE_UUIDS,
        })
        console.log("✅ Device selected:", device.name || "Unknown Device")
      } catch (error) {
        console.log("❌ User cancelled device selection or no devices found")
        return false
      }

      if (!device) {
        console.log("❌ No device selected")
        return false
      }

      // Try to connect to the selected device
      return await this.connectToDevice(device)
    } catch (error) {
      console.error("❌ Connection error:", error)
      this.handleDisconnection()
      return false
    } finally {
      this.isScanning = false
    }
  }

  // Connect to a specific device
  private async connectToDevice(device: BluetoothDevice): Promise<boolean> {
    try {
      console.log(`🔌 Connecting to: ${device.name || "Unknown Device"}`)

      if (!device.gatt) {
        throw new Error("Device does not support GATT")
      }

      // Connect to GATT server
      console.log("🔌 Connecting to GATT server...")
      const server = await device.gatt.connect()
      console.log("✅ GATT server connected")

      // Find a suitable service and characteristic for printing
      const { service, characteristic } = await this.findPrintingCharacteristic(server)

      this.device = device
      this.characteristic = characteristic
      this.isConnected = true

      // Set up disconnect handler
      device.addEventListener("gattserverdisconnected", () => {
        console.log("🔌 Printer disconnected")
        this.handleDisconnection()
      })

      // Start connection health monitoring
      this.startConnectionHealthMonitoring()

      console.log(`✅ Successfully connected to printer: ${device.name || "Unknown Device"}`)
      this.notifyListeners()
      return true
    } catch (error) {
      console.error("❌ Failed to connect to device:", error)
      this.handleDisconnection()
      throw error
    }
  }

  // Find suitable characteristic for printing with multiple fallbacks
  private async findPrintingCharacteristic(server: BluetoothRemoteGATTServer): Promise<{
    service: BluetoothRemoteGATTService
    characteristic: BluetoothRemoteGATTCharacteristic
  }> {
    console.log("🔍 Searching for printing characteristics...")

    try {
      const services = await server.getPrimaryServices()
      console.log(`📡 Found ${services.length} services`)

      // Try each service to find a writable characteristic
      for (const service of services) {
        try {
          console.log(`🔍 Checking service: ${service.uuid}`)
          const characteristics = await service.getCharacteristics()
          console.log(`📝 Found ${characteristics.length} characteristics in service`)

          for (const characteristic of characteristics) {
            console.log(`🔍 Checking characteristic: ${characteristic.uuid}`)
            console.log(`📝 Properties:`, {
              write: characteristic.properties.write,
              writeWithoutResponse: characteristic.properties.writeWithoutResponse,
              notify: characteristic.properties.notify,
            })

            // Look for writable characteristics
            if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
              console.log(`✅ Found writable characteristic: ${characteristic.uuid}`)
              return { service, characteristic }
            }
          }
        } catch (error) {
          console.log(`⚠️ Could not access service ${service.uuid}:", error)
          continue
        }
      }

      // If no writable characteristic found, try known UUIDs directly
      console.log("🔍 Trying known characteristic UUIDs...")
      for (const serviceUuid of this.PRINTER_SERVICE_UUIDS) {
        try {
          const service = await server.getPrimaryService(serviceUuid)
          for (const charUuid of this.WRITE_CHARACTERISTIC_UUIDS) {
            try {
              const characteristic = await service.getCharacteristic(charUuid)
              if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
                console.log(`✅ Found known characteristic: ${charUuid}`)
                return { service, characteristic }
              }
            } catch (error) {
              continue
            }
          }
        } catch (error) {
          continue
        }
      }

      throw new Error("No suitable printing characteristic found")
    } catch (error) {
      console.error("❌ Error finding printing characteristic:", error)
      throw error
    }
  }

  // Enhanced printing with chunked data transmission
  async printPassengerTicket(data: TicketData): Promise<boolean> {
    const content = this.formatPassengerTicket(data)
    return this.print(content)
  }

  async printLuggageTicket(data: TicketData): Promise<boolean> {
    const content = this.formatLuggageTicket(data)
    return this.print(content)
  }

  async printTripSummary(data: TripSummaryData): Promise<boolean> {
    const content = this.formatTripSummary(data)
    return this.print(content)
  }

  async printManifest(data: ManifestData): Promise<boolean> {
    const content = this.formatManifest(data)
    return this.print(content)
  }

  // Core print function
  private async print(content: string): Promise<boolean> {
    if (!this.isConnected || !this.characteristic) {
      throw new Error("Printer not connected")
    }

    const jobId = `print_${Date.now()}`
    const printJob: PrintJob = {
      id: jobId,
      content,
      status: "pending",
      timestamp: new Date().toISOString(),
      retryCount: 0,
      deviceId: this.device?.id,
    }

    this.printQueue.push(printJob)

    try {
      console.log(`🖨️ Starting print job: ${jobId}`)
      printJob.status = "printing"

      // Generate ESC/POS commands
      const escPosData = this.generateESCPOSCommands(content)

      // Send data in chunks for better reliability
      const chunkSize = 20 // Small chunks for Bluetooth reliability
      const chunks = []

      for (let i = 0; i < escPosData.length; i += chunkSize) {
        chunks.push(escPosData.slice(i, i + chunkSize))
      }

      console.log(`📦 Sending ${chunks.length} chunks to printer`)

      // Send chunks with small delays
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]

        try {
          // Try writeWithoutResponse first (faster)
          if (this.characteristic.properties.writeWithoutResponse) {
            await this.characteristic.writeValueWithoutResponse(chunk)
          } else {
            await this.characteristic.writeValue(chunk)
          }

          // Small delay between chunks
          if (i < chunks.length - 1) {
            await this.delay(50)
          }
        } catch (error) {
          console.error(`❌ Error sending chunk ${i + 1}/${chunks.length}:`, error)
          throw error
        }
      }

      // Send final commands (cut paper, etc.)
      const finalCommands = new Uint8Array([
        0x1d,
        0x56,
        0x42,
        0x00, // Cut paper
        0x1b,
        0x40, // Initialize printer
      ])

      await this.characteristic.writeValue(finalCommands)

      printJob.status = "completed"
      console.log(`✅ Print job completed: ${jobId}`)

      return true
    } catch (error) {
      console.error(`❌ Print job failed: ${jobId}`, error)
      printJob.status = "failed"
      printJob.retryCount++

      // Retry logic
      if (printJob.retryCount < 3) {
        console.log(`🔄 Retrying print job: ${jobId} (attempt ${printJob.retryCount + 1})`)
        await this.delay(1000)
        return this.print(content)
      }

      throw error
    }
  }

  // Format passenger ticket
  private formatPassengerTicket(data: TicketData): string {
    return `
TIMBOON BUS SERVICES
====================
PASSENGER TICKET
====================
Ticket: ${data.ticketNumber}
Bus: ${data.busRegistration}
Route: ${data.origin} → ${data.destination}

Passenger: ${data.passengerName || "N/A"}
${data.seatNumber ? `Seat: ${data.seatNumber}` : ""}
${data.passengerPhone ? `Phone: ${data.passengerPhone}` : ""}

Price: $${data.price.toFixed(2)}
${data.discount > 0 ? `Discount: $${data.discount.toFixed(2)}` : ""}
Total: $${data.totalPrice.toFixed(2)}
Payment: ${data.paymentMethod}

Issued: ${data.issueDate} ${data.issueTime}
Agent: ${data.agentName}
Location: ${data.issueLocation}

Driver: ${data.driverName}
Conductor: ${data.conductorName}

====================
Thank you for traveling
with Timboon Bus Services
====================
    `.trim()
  }

  // Format luggage ticket
  private formatLuggageTicket(data: TicketData): string {
    return `
TIMBOON BUS SERVICES
====================
LUGGAGE TICKET
====================
Ticket: ${data.ticketNumber}
Bus: ${data.busRegistration}
Route: ${data.origin} → ${data.destination}

Item: ${data.luggageDescription || "N/A"}
Owner: ${data.luggageOwnerName || "N/A"}
${data.luggageOwnerPhone ? `Phone: ${data.luggageOwnerPhone}` : ""}

Price: $${data.price.toFixed(2)}
${data.discount > 0 ? `Discount: $${data.discount.toFixed(2)}` : ""}
Total: $${data.totalPrice.toFixed(2)}
Payment: ${data.paymentMethod}

Issued: ${data.issueDate} ${data.issueTime}
Agent: ${data.agentName}
Location: ${data.issueLocation}

Driver: ${data.driverName}
Conductor: ${data.conductorName}

====================
Thank you for using
Timboon Bus Services
====================
    `.trim()
  }

  // Format trip summary
  private formatTripSummary(data: TripSummaryData): string {
    return `
TIMBOON BUS SERVICES
====================
TRIP SUMMARY REPORT
====================
Trip ID: ${data.tripId}
Bus: ${data.busRegistration}
Route: ${data.mainRoute}
Duration: ${data.duration}

Driver: ${data.driverName}
Conductor: ${data.conductorName}

====================
FINANCIAL SUMMARY
====================
Total Tickets: ${data.stats.totalTickets}
Passenger Tickets: ${data.breakdown.passengerTickets}
Luggage Tickets: ${data.breakdown.luggageTickets}

Gross Revenue: $${data.stats.totalRevenue.toFixed(2)}
Total Expenses: $${data.stats.totalExpenses.toFixed(2)}
Net Profit: $${data.stats.netProfit.toFixed(2)}
Profit Margin: ${data.financial.profitMargin.toFixed(1)}%

Average per Ticket: $${data.breakdown.averageTicketPrice.toFixed(2)}

====================
CASH RECONCILIATION
====================
Cash to Deposit: $${data.financial.cashToDeposit.toFixed(2)}
Expense Receipts: $${data.financial.expenseReceipts.toFixed(2)}

====================
SIGNATURES
====================
Driver: ________________
Date: __________________

Conductor: ________________
Date: __________________

Generated: ${new Date(data.generatedAt).toLocaleString()}
By: ${data.generatedBy}

====================
TIMBOON BUS SERVICES
====================
    `.trim()
  }

  // Format manifest
  private formatManifest(data: ManifestData): string {
    let manifest = `
TIMBOON BUS SERVICES
====================
TRIP MANIFEST
====================
Bus: ${data.busRegistration}
Driver: ${data.driverName}
Conductor: ${data.conductorName}
Trip ID: ${data.tripId || "N/A"}

Start Time: ${data.startTime ? new Date(data.startTime).toLocaleString() : "N/A"}
Print Time: ${new Date(data.printTime).toLocaleString()}

====================
PASSENGER MANIFEST
====================
Total Passengers: ${data.totalPassengers}

`

    data.passengerTickets.forEach((ticket, index) => {
      manifest += `${index + 1}. ${ticket.ticketNumber}
   ${ticket.origin} → ${ticket.destination}
   ${ticket.passengerName || "Passenger"} - $${ticket.totalPrice.toFixed(2)}
   ${new Date(ticket.timestamp).toLocaleTimeString()}

`
    })

    manifest += `====================
LUGGAGE MANIFEST
====================
Total Luggage: ${data.totalLuggage}

`

    data.luggageTickets.forEach((ticket, index) => {
      manifest += `${index + 1}. ${ticket.ticketNumber}
   ${ticket.description}
   ${ticket.origin} → ${ticket.destination}
   Owner: ${ticket.ownerName || "N/A"} - $${ticket.totalPrice.toFixed(2)}
   ${new Date(ticket.timestamp).toLocaleTimeString()}

`
    })

    manifest += `====================
SUMMARY
====================
Total Revenue: $${data.totalRevenue.toFixed(2)}
Total Expenses: $${data.totalExpenses.toFixed(2)}
Net Profit: $${(data.totalRevenue - data.totalExpenses).toFixed(2)}

====================
TIMBOON BUS SERVICES
====================`

    return manifest.trim()
  }

  // Generate ESC/POS commands for thermal printing
  private generateESCPOSCommands(content: string): Uint8Array {
    const commands: number[] = []

    // Initialize printer
    commands.push(0x1b, 0x40)

    // Set character encoding to UTF-8
    commands.push(0x1b, 0x74, 0x06)

    // Set line spacing
    commands.push(0x1b, 0x33, 0x20)

    // Center alignment for header
    commands.push(0x1b, 0x61, 0x01)

    // Add content
    const encoder = new TextEncoder()
    const contentBytes = encoder.encode(content)
    commands.push(...Array.from(contentBytes))

    // Reset formatting
    commands.push(0x1b, 0x61, 0x00) // Left align

    // Feed paper
    commands.push(0x0a, 0x0a, 0x0a)

    return new Uint8Array(commands)
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    const testContent = `
TIMBOON BUS SERVICES
====================
CONNECTION TEST
====================
${new Date().toLocaleString()}
====================
✅ Printer Connected
✅ Communication OK
====================
    `.trim()

    return this.print(testContent)
  }

  // Connection health monitoring
  private startConnectionHealthMonitoring(): void {
    if (this.connectionHealthInterval) {
      clearInterval(this.connectionHealthInterval)
    }

    this.connectionHealthInterval = setInterval(() => {
      if (this.device && this.device.gatt) {
        if (!this.device.gatt.connected) {
          console.log("⚠️ Connection lost - handling disconnection")
          this.handleDisconnection()
        }
      }
    }, 10000) // Check every 10 seconds
  }

  // Handle disconnection
  private handleDisconnection(): void {
    this.isConnected = false
    this.device = null
    this.characteristic = null

    if (this.connectionHealthInterval) {
      clearInterval(this.connectionHealthInterval)
      this.connectionHealthInterval = null
    }

    // Mark any pending print jobs as failed
    this.printQueue.forEach((job) => {
      if (job.status === "printing" || job.status === "pending") {
        job.status = "failed"
      }
    })

    this.notifyListeners()
  }

  // Disconnect from printer
  async disconnect(): Promise<void> {
    try {
      if (this.device && this.device.gatt && this.device.gatt.connected) {
        this.device.gatt.disconnect()
      }
    } catch (error) {
      console.error("❌ Error during disconnect:", error)
    } finally {
      this.handleDisconnection()
      console.log("🔌 Disconnected from printer")
    }
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Get connection status
  getConnectionStatus(): PrinterStatus {
    return {
      connected: this.isConnected,
      deviceName: this.device?.name || null,
      batteryLevel: 100, // Mock value
      paperStatus: "ok", // Mock value
      connectionStrength: this.isConnected ? "excellent" : "poor",
      lastError: null,
    }
  }

  // Get print queue status
  getPrintQueue(): PrintJob[] {
    return [...this.printQueue]
  }

  // Clear print queue
  clearPrintQueue(): void {
    this.printQueue = []
    console.log("🗑️ Print queue cleared")
  }
}

// Export singleton instance
export const getThermalPrinter = (): ThermalPrinter => ThermalPrinter.getInstance() 