// Enhanced Bluetooth thermal printer service with comprehensive device discovery
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

export class EnhancedThermalPrinter {
  private static instance: EnhancedThermalPrinter | null = null
  private device: BluetoothDevice | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null
  private isConnected = false
  private isScanning = false
  private printQueue: PrintJob[] = []
  private connectionHealthInterval: NodeJS.Timeout | null = null

  // Comprehensive list of thermal printer service UUIDs
  private readonly PRINTER_SERVICE_UUIDS = [
    // Standard thermal printer services
    "000018f0-0000-1000-8000-00805f9b34fb", // Standard thermal printer
    "0000ff00-0000-1000-8000-00805f9b34fb", // Common Chinese thermal printer
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART Service (common in BLE printers)

    // HM-10 BLE module services (very common in thermal printers)
    "0000ffe0-0000-1000-8000-00805f9b34fb", // HM-10 service
    "0000ffe1-0000-1000-8000-00805f9b34fb", // HM-10 characteristic

    // ESC/POS printer services
    "49535343-fe7d-4ae5-8fa9-9fafd205e455", // ESC/POS service
    "49535343-1e4d-4bd9-ba61-23c647249616", // ESC/POS write characteristic

    // Zjiang printer services
    "0000ff12-0000-1000-8000-00805f9b34fb", // Zjiang thermal printer
    "0000ff02-0000-1000-8000-00805f9b34fb", // Zjiang service 2

    // HPRT printer services
    "000018f1-0000-1000-8000-00805f9b34fb", // HPRT thermal printer
    "000018f2-0000-1000-8000-00805f9b34fb", // HPRT service 2

    // Generic printer services
    "00001801-0000-1000-8000-00805f9b34fb", // Generic Attribute Service
    "0000180a-0000-1000-8000-00805f9b34fb", // Device Information Service
    "0000180f-0000-1000-8000-00805f9b34fb", // Battery Service (many printers have this)

    // Custom printer services
    "12345678-1234-1234-1234-123456789abc", // Custom service 1
    "87654321-4321-4321-4321-cba987654321", // Custom service 2
  ]

  // Thermal printer name patterns
  private readonly PRINTER_NAME_PATTERNS = [
    /mtp/i, // MTP printers
    /pos/i, // POS printers
    /thermal/i, // Thermal printers
    /printer/i, // Generic printer
    /esc/i, // ESC/POS printers
    /zj/i, // Zjiang printers
    /hprt/i, // HPRT printers
    /xprinter/i, // Xprinter brand
    /goojprt/i, // GOOJPRT brand
    /munbyn/i, // MUNBYN brand
    /idprt/i, // iDPRT brand
    /epson/i, // EPSON printers
    /star/i, // STAR printers
    /citizen/i, // CITIZEN printers
    /bixolon/i, // BIXOLON printers
    /custom/i, // Custom printers
    /bt.*print/i, // Bluetooth printer variations
    /print.*bt/i, // Printer Bluetooth variations
  ]

  private constructor() {
    // Check if Web Bluetooth is supported
    if (typeof navigator === "undefined" || !navigator.bluetooth) {
      console.warn("⚠️ Web Bluetooth is not supported in this environment")
    }
  }

  static getInstance(): EnhancedThermalPrinter {
    if (!EnhancedThermalPrinter.instance) {
      EnhancedThermalPrinter.instance = new EnhancedThermalPrinter()
    }
    return EnhancedThermalPrinter.instance
  }

  // Comprehensive printer discovery
  async discoverPrinters(): Promise<BluetoothPrinterDevice[]> {
    if (!navigator.bluetooth) {
      throw new Error("Web Bluetooth is not supported")
    }

    console.log("🔍 Starting comprehensive printer discovery...")
    this.isScanning = true

    try {
      const discoveredDevices: BluetoothPrinterDevice[] = []

      // Method 1: Request devices with specific service filters
      for (const serviceUUID of this.PRINTER_SERVICE_UUIDS) {
        try {
          console.log(`🔍 Scanning for service: ${serviceUUID}`)

          const devices = await navigator.bluetooth.requestDevice({
            filters: [{ services: [serviceUUID] }],
            optionalServices: this.PRINTER_SERVICE_UUIDS,
          })

          if (devices) {
            const printerDevice = await this.analyzeDevice(devices)
            if (printerDevice && !discoveredDevices.find((d) => d.id === printerDevice.id)) {
              discoveredDevices.push(printerDevice)
              console.log(`✅ Found printer: ${printerDevice.name} (${printerDevice.brand || "Unknown brand"})`)
            }
          }
        } catch (error) {
          // Continue with next service UUID
          console.log(`⏭️ No devices found for service ${serviceUUID}`)
        }
      }

      // Method 2: Request devices by name patterns
      for (const pattern of this.PRINTER_NAME_PATTERNS) {
        try {
          console.log(`🔍 Scanning for name pattern: ${pattern}`)

          const devices = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: pattern.source.replace(/[^a-zA-Z0-9]/g, "") }],
            optionalServices: this.PRINTER_SERVICE_UUIDS,
          })

          if (devices) {
            const printerDevice = await this.analyzeDevice(devices)
            if (printerDevice && !discoveredDevices.find((d) => d.id === printerDevice.id)) {
              discoveredDevices.push(printerDevice)
              console.log(`✅ Found printer by name: ${printerDevice.name}`)
            }
          }
        } catch (error) {
          // Continue with next pattern
        }
      }

      // Method 3: Accept any device (let user choose)
      if (discoveredDevices.length === 0) {
        try {
          console.log("🔍 Opening device selector for manual selection...")

          const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: this.PRINTER_SERVICE_UUIDS,
          })

          if (device) {
            const printerDevice = await this.analyzeDevice(device)
            if (printerDevice) {
              discoveredDevices.push(printerDevice)
              console.log(`✅ User selected device: ${printerDevice.name}`)
            }
          }
        } catch (error) {
          console.log("❌ User cancelled device selection")
        }
      }

      console.log(`🔍 Discovery complete. Found ${discoveredDevices.length} potential printers`)
      return discoveredDevices
    } catch (error) {
      console.error("❌ Error during printer discovery:", error)
      throw error
    } finally {
      this.isScanning = false
    }
  }

  // Analyze a Bluetooth device to determine if it's a thermal printer
  private async analyzeDevice(device: BluetoothDevice): Promise<BluetoothPrinterDevice | null> {
    try {
      const deviceInfo: BluetoothPrinterDevice = {
        id: device.id,
        name: device.name || "Unknown Device",
        serviceUUIDs: [],
        isConnected: device.gatt?.connected || false,
        deviceType: "unknown",
        brand: this.identifyBrand(device.name || ""),
      }

      // Check if device name matches printer patterns
      const nameMatchesPrinter = this.PRINTER_NAME_PATTERNS.some((pattern) => pattern.test(device.name || ""))

      if (nameMatchesPrinter) {
        deviceInfo.deviceType = "thermal_printer"
      }

      // Try to get service information
      if (device.gatt) {
        try {
          if (!device.gatt.connected) {
            await device.gatt.connect()
          }

          const services = await device.gatt.getPrimaryServices()
          deviceInfo.serviceUUIDs = services.map((service) => service.uuid)

          // Check if any services match printer services
          const hasKnownPrinterService = deviceInfo.serviceUUIDs.some((uuid) =>
            this.PRINTER_SERVICE_UUIDS.includes(uuid),
          )

          if (hasKnownPrinterService) {
            deviceInfo.deviceType = "pos_printer"
          }

          // Disconnect after analysis
          device.gatt.disconnect()
        } catch (error) {
          console.log(`⚠️ Could not analyze services for ${device.name}:", error)
        }
      }

      // Only return devices that are likely printers
      if (deviceInfo.deviceType !== "unknown" || nameMatchesPrinter) {
        return deviceInfo
      }

      return null
    } catch (error) {
      console.error("❌ Error analyzing device:", error)
      return null
    }
  }

  // Identify printer brand from device name
  private identifyBrand(deviceName: string): string | undefined {
    const name = deviceName.toLowerCase()

    if (name.includes("zj") || name.includes("zjiang")) return "Zjiang"
    if (name.includes("hprt")) return "HPRT"
    if (name.includes("xprinter")) return "Xprinter"
    if (name.includes("goojprt")) return "GOOJPRT"
    if (name.includes("munbyn")) return "MUNBYN"
    if (name.includes("idprt")) return "iDPRT"
    if (name.includes("epson")) return "EPSON"
    if (name.includes("star")) return "STAR"
    if (name.includes("citizen")) return "CITIZEN"
    if (name.includes("bixolon")) return "BIXOLON"
    if (name.includes("custom")) return "Custom"
    if (name.includes("mtp")) return "MTP"

    return undefined
  }

  // Connect to a specific printer device
  async connectToPrinter(deviceId: string): Promise<boolean> {
    try {
      console.log(`🔌 Connecting to printer: ${deviceId}`)

      // If already connected to a different device, disconnect first
      if (this.device && this.device.id !== deviceId) {
        await this.disconnect()
      }

      // Get the device (this will require user interaction if not already paired)
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ deviceId }],
        optionalServices: this.PRINTER_SERVICE_UUIDS,
      })

      if (!device.gatt) {
        throw new Error("Device does not support GATT")
      }

      console.log(`🔌 Connecting to GATT server...`)
      const server = await device.gatt.connect()

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

      console.log(`✅ Successfully connected to printer: ${device.name}`)
      return true
    } catch (error) {
      console.error("❌ Failed to connect to printer:", error)
      this.handleDisconnection()
      throw error
    }
  }

  // Find suitable characteristic for printing
  private async findPrintingCharacteristic(server: BluetoothRemoteGATTServer): Promise<{
    service: BluetoothRemoteGATTService
    characteristic: BluetoothRemoteGATTCharacteristic
  }> {
    const services = await server.getPrimaryServices()

    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics()

        for (const characteristic of characteristics) {
          // Look for writable characteristics
          if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
            console.log(`✅ Found writable characteristic: ${characteristic.uuid}`)
            return { service, characteristic }
          }
        }
      } catch (error) {
        console.log(`⚠️ Could not get characteristics for service ${service.uuid}`)
      }
    }

    throw new Error("No suitable printing characteristic found")
  }

  // Enhanced printing with chunked data transmission
  async print(content: string): Promise<boolean> {
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

    // Bold text for header
    commands.push(0x1b, 0x45, 0x01)

    // Add content
    const encoder = new TextEncoder()
    const contentBytes = encoder.encode(content)
    commands.push(...Array.from(contentBytes))

    // Reset formatting
    commands.push(0x1b, 0x45, 0x00) // Cancel bold
    commands.push(0x1b, 0x61, 0x00) // Left align

    // Feed paper
    commands.push(0x0a, 0x0a, 0x0a)

    return new Uint8Array(commands)
  }

  // Connection health monitoring
  private startConnectionHealthMonitoring(): void {
    if (this.connectionHealthInterval) {
      clearInterval(this.connectionHealthInterval)
    }

    this.connectionHealthInterval = setInterval(() => {
      if (this.device && this.device.gatt) {
        if (!this.device.gatt.connected) {
          console.log("⚠️ Connection lost - attempting reconnection")
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
  getConnectionStatus(): {
    isConnected: boolean
    deviceName?: string
    deviceId?: string
    isScanning: boolean
    queueLength: number
  } {
    return {
      isConnected: this.isConnected,
      deviceName: this.device?.name,
      deviceId: this.device?.id,
      isScanning: this.isScanning,
      queueLength: this.printQueue.length,
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

  // Test printer connection
  async testPrint(): Promise<boolean> {
    const testContent = `
TIMBOON BUS SERVICES
====================
Connection Test
${new Date().toLocaleString()}
====================
✅ Printer Connected
    `

    return this.print(testContent)
  }
}

// Export singleton instance
export const enhancedThermalPrinter = EnhancedThermalPrinter.getInstance() 