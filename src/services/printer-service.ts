"use client"

// Printer service for mobile thermal printers
// This would connect to actual printer hardware in a production app

export interface PrinterOptions {
  width: number // Width in mm (usually 58mm or 80mm for thermal printers)
  characterWidth: number // Number of characters per line
  encoding?: string // Character encoding
  driver?: string // Printer driver name
}

export interface TicketData {
  id: string
  companyName: string
  companyLogo?: string
  origin: string
  destination: string
  departureDate: string
  departureTime: string
  passengerName: string
  seatNumber: string
  busId: string
  busRegistration: string
  price: string
  discount: string
  total: string
  paymentMethod: string
  issueLocation: string
  issueDate: string
  issueTime: string
  agentName: string
  qrData?: string
}

// Add this interface for trip info data
export interface TripInfoData {
  id: string
  companyName: string
  origin: string
  destination: string
  departureDate: string
  departureTime: string
  busId: string
  busRegistration: string
  busType: string
  driver: string
  conductor: string
  price: string
  issueDate: string
  issueTime: string
  agentName: string
}

// Add interface for trip summary data
export interface TripSummaryData {
  tripId: string
  busRegistration: string
  driverName: string
  conductorName: string
  mainRoute: string
  startTime: string
  endTime: string
  duration: number
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

class PrinterService {
  private defaultOptions: PrinterOptions = {
    width: 58, // 58mm is standard for many mobile thermal printers
    characterWidth: 28, // Reduced from 32 to 28 for more compact output
    encoding: "utf8",
    driver: "ESC/POS", // Common thermal printer command language
  }

  constructor(private options: PrinterOptions = {}) {
    this.options = { ...this.defaultOptions, ...options }
  }

  // Format text to fit printer width
  private formatText(text: string, align: "left" | "center" | "right" = "left"): string {
    const width = this.options.characterWidth

    if (text.length > width) {
      // Truncate or wrap text if needed
      return text.substring(0, width)
    }

    if (align === "center") {
      const padding = Math.floor((width - text.length) / 2)
      return " ".repeat(padding) + text
    } else if (align === "right") {
      const padding = width - text.length
      return " ".repeat(padding) + text
    }

    return text
  }

  // Create a divider line
  private divider(): string {
    return "-".repeat(this.options.characterWidth)
  }

  // Format a ticket for printing
  formatTicket(data: TicketData): string {
    let output = ""
    const w = this.options.characterWidth

    // Company header - more compact
    output += this.formatText(data.companyName.toUpperCase(), "center") + "\n"
    output += this.formatText("TICKET #: " + data.id, "center") + "\n"
    output += "-".repeat(w) + "\n"

    // Route information - single line format where possible
    output += this.formatText("FROM: " + data.origin, "left") + "\n"
    output += this.formatText("TO: " + data.destination, "left") + "\n"
    output += this.formatText(data.departureDate + " " + data.departureTime, "center") + "\n"
    output += "-".repeat(w) + "\n"

    // Passenger information - compact
    if (data.passengerName) {
      output += this.formatText("PAX: " + data.passengerName, "left") + "\n"
    }
    if (data.seatNumber) {
      output += this.formatText("SEAT: " + data.seatNumber, "left") + "\n"
    }
    output += "-".repeat(w) + "\n"

    // Bus information - compact
    output += this.formatText("BUS: " + data.busRegistration, "left") + "\n"
    if (data.busId !== data.busRegistration) {
      output += this.formatText("ID: " + data.busId, "left") + "\n"
    }
    output += "-".repeat(w) + "\n"

    // Payment information - compact
    output += this.formatText("PRICE: " + data.price, "left") + "\n"
    if (data.discount && data.discount !== "$0.00") {
      output += this.formatText("DISC: " + data.discount, "left") + "\n"
    }
    output += this.formatText("TOTAL: " + data.total, "left") + "\n"
    output += this.formatText("PAY: " + data.paymentMethod, "left") + "\n"
    output += "-".repeat(w) + "\n"

    // Issue information - compact
    output += this.formatText("LOC: " + data.issueLocation, "left") + "\n"
    output += this.formatText(data.issueDate + " " + data.issueTime, "left") + "\n"
    output += this.formatText("BY: " + data.agentName, "left") + "\n"
    output += "-".repeat(w) + "\n"

    // Footer - compact
    output += this.formatText("Thank you!", "center") + "\n"
    output += this.formatText("TIMBOON BUS CO.", "center") + "\n"

    return output
  }

  // Format trip summary for printing
  formatTripSummary(data: TripSummaryData): string {
    let output = ""
    const w = this.options.characterWidth

    // Header
    output += this.formatText("TIMBOON BUS COMPANY", "center") + "\n"
    output += this.formatText("TRIP SUMMARY REPORT", "center") + "\n"
    output += this.formatText(new Date().toLocaleDateString(), "center") + "\n"
    output += this.formatText(new Date().toLocaleTimeString(), "center") + "\n"
    output += "=".repeat(w) + "\n\n"

    // Trip Information
    output += this.formatText("TRIP INFORMATION:", "left") + "\n"
    output += this.formatText(`Trip ID: ${data.tripId.substring(0, 20)}`, "left") + "\n"
    output += this.formatText(`Bus: ${data.busRegistration}`, "left") + "\n"
    output += this.formatText(`Route: ${data.mainRoute}`, "left") + "\n"
    output += this.formatText(`Driver: ${data.driverName}`, "left") + "\n"
    output += this.formatText(`Conductor: ${data.conductorName}`, "left") + "\n\n"

    // Trip Duration
    output += this.formatText("TRIP DURATION:", "left") + "\n"
    output += this.formatText(`Start: ${new Date(data.startTime).toLocaleTimeString()}`, "left") + "\n"
    output += this.formatText(`End: ${new Date(data.endTime).toLocaleTimeString()}`, "left") + "\n"
    output += this.formatText(`Duration: ${data.duration} minutes`, "left") + "\n\n"

    output += "=".repeat(w) + "\n"
    output += this.formatText("FINANCIAL SUMMARY:", "center") + "\n"
    output += "=".repeat(w) + "\n\n"

    // Revenue
    output += this.formatText("REVENUE:", "left") + "\n"
    output += this.formatText(`Total Tickets: ${data.stats.totalTickets}`, "left") + "\n"
    output += this.formatText(`Gross Revenue: $${data.stats.totalRevenue.toFixed(2)}`, "left") + "\n"
    output += this.formatText(`Avg per Ticket: $${data.breakdown.averageTicketPrice.toFixed(2)}`, "left") + "\n\n"

    // Expenses
    output += this.formatText("EXPENSES:", "left") + "\n"
    output += this.formatText(`Total Expenses: $${data.stats.totalExpenses.toFixed(2)}`, "left") + "\n\n"

    // Net Result
    output += this.formatText("NET RESULT:", "left") + "\n"
    output += this.formatText(`Net Profit: $${data.stats.netProfit.toFixed(2)}`, "left") + "\n"
    output += this.formatText(`Profit Margin: ${data.financial.profitMargin.toFixed(1)}%`, "left") + "\n\n"

    output += "=".repeat(w) + "\n"
    output += this.formatText("CASH RECONCILIATION:", "center") + "\n"
    output += "=".repeat(w) + "\n\n"

    // Cash on Hand
    output += this.formatText("CASH ON HAND:", "left") + "\n"
    output += this.formatText(`Revenue: $${data.financial.grossRevenue.toFixed(2)}`, "left") + "\n"
    output += this.formatText(`Less Expenses: $${data.financial.totalExpenses.toFixed(2)}`, "left") + "\n"
    output += this.formatText(`CASH TO DEPOSIT: $${data.financial.cashToDeposit.toFixed(2)}`, "left") + "\n\n"

    output += this.formatText("RECEIPTS TO SUBMIT:", "left") + "\n"
    output += this.formatText(`Expense Receipts: $${data.financial.expenseReceipts.toFixed(2)}`, "left") + "\n\n"

    output += "=".repeat(w) + "\n"
    output += this.formatText("ROUTE PERFORMANCE:", "center") + "\n"
    output += "=".repeat(w) + "\n\n"

    output += this.formatText(`Route: ${data.route.origin} → ${data.route.destination}`, "left") + "\n"
    const ticketsPerHour = data.duration > 0 ? (data.stats.totalTickets / (data.duration / 60)).toFixed(1) : "0"
    const revenuePerHour = data.duration > 0 ? (data.stats.totalRevenue / (data.duration / 60)).toFixed(2) : "0.00"
    output += this.formatText(`Tickets/Hour: ${ticketsPerHour}`, "left") + "\n"
    output += this.formatText(`Revenue/Hour: $${revenuePerHour}`, "left") + "\n\n"

    output += "=".repeat(w) + "\n\n"

    // Signature section
    output += this.formatText("CREW SIGNATURE:", "left") + "\n"
    output += this.formatText("Driver: ________________", "left") + "\n"
    output += this.formatText("Date: ___________________", "left") + "\n\n"
    output += this.formatText("Conductor: ________________", "left") + "\n"
    output += this.formatText("Date: ___________________", "left") + "\n\n"

    output += "=".repeat(w) + "\n"
    output += this.formatText(`Generated by: ${data.generatedBy}`, "left") + "\n"
    output += this.formatText(`Time: ${new Date(data.generatedAt).toLocaleString()}`, "left") + "\n\n"

    output += this.formatText("Thank you for using", "center") + "\n"
    output += this.formatText("TIMBOON BUS COMPANY", "center") + "\n"
    output += "=".repeat(w) + "\n"

    return output
  }

  // Print ticket to connected printer
  async printTicket(data: TicketData): Promise<boolean> {
    try {
      const formattedTicket = this.formatTicket(data)

      // In a real implementation, this would send the formatted ticket to the printer
      // using a library like node-thermal-printer, react-native-bluetooth-escpos-printer,
      // or a web Bluetooth API

      console.log("Printing ticket:")
      console.log(formattedTicket)

      // Simulate printing delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return true
    } catch (error) {
      console.error("Printing error:", error)
      return false
    }
  }

  // Print trip summary to connected printer
  async printTripSummary(data: TripSummaryData): Promise<boolean> {
    try {
      const formattedSummary = this.formatTripSummary(data)

      // In a real implementation, this would send the formatted summary to the printer
      console.log("Printing trip summary:")
      console.log(formattedSummary)

      // Simulate printing delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      return true
    } catch (error) {
      console.error("Trip summary printing error:", error)
      return false
    }
  }

  // Print any text to connected printer
  async printText(text: string): Promise<boolean> {
    try {
      console.log("Printing text:")
      console.log(text)

      // Simulate printing delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      return true
    } catch (error) {
      console.error("Text printing error:", error)
      return false
    }
  }

  // Generate a graphical representation of the ticket (for preview)
  generateTicketHTML(data: TicketData): string {
    // This would generate an HTML representation of the ticket for preview
    // In a real app, this would create a styled HTML version that matches the printed output

    return `
      <div style="font-family: monospace; width: 300px; padding: 10px; border: 1px solid #ccc;">
        <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">${data.companyName.toUpperCase()}</div>
        <div style="text-align: center; margin-bottom: 10px;">TICKET #: ${data.id}</div>
        <hr/>
        <div>FROM: ${data.origin}</div>
        <div>TO: ${data.destination}</div>
        <div>DATE: ${data.departureDate}</div>
        <div>TIME: ${data.departureTime}</div>
        <hr/>
        <div>PASSENGER: ${data.passengerName}</div>
        <div>SEAT: ${data.seatNumber}</div>
        <hr/>
        <div>BUS: ${data.busId}</div>
        <div>REG: ${data.busRegistration}</div>
        <hr/>
        <div>PRICE: ${data.price}</div>
        ${data.discount && data.discount !== "$0.00" ? `<div>DISCOUNT: ${data.discount}</div>` : ""}
        <div>TOTAL: ${data.total}</div>
        <div>PAYMENT: ${data.paymentMethod}</div>
        <hr/>
        <div>ISSUED AT: ${data.issueLocation}</div>
        <div>DATE: ${data.issueDate} ${data.issueTime}</div>
        <div>AGENT: ${data.agentName}</div>
        <div style="text-align: center; margin-top: 10px;">Thank you for traveling with</div>
        <div style="text-align: center; font-weight: bold;">TIMBOON BUS COMPANY</div>
      </div>
    `
  }

  // Check if printer is connected
  async isPrinterConnected(): Promise<boolean> {
    // In a real implementation, this would check if a printer is available
    // For this demo, always return true
    return true
  }

  // Print ticket to desktop printer using browser's print functionality
  async printToDesktopPrinter(data: TicketData): Promise<boolean> {
    try {
      // Create a new window for printing
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        throw new Error("Could not open print window")
      }

      // Generate HTML for the ticket
      const ticketHTML = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Bus Ticket - ${data.id}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          margin: 0;
          padding: 0;
          background: #f9f9f9;
          font-size: 11px;
        }
        .ticket {
          width: 70mm;
          margin: 10px auto;
          padding: 8px;
          border: 1px solid #ddd;
          box-shadow: 0 0 5px rgba(0,0,0,0.1);
          background: white;
          line-height: 1.2;
        }
        .company-header {
          text-align: center;
          margin-bottom: 8px;
          font-weight: bold;
          font-size: 12px;
        }
        .ticket-id {
          text-align: center;
          margin-bottom: 8px;
          font-size: 10px;
        }
        .section {
          margin-bottom: 6px;
          padding-bottom: 4px;
          border-bottom: 1px dashed #ccc;
        }
        .section:last-child {
          border-bottom: none;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
          font-size: 9px;
        }
        .label {
          font-weight: bold;
        }
        .value {
          text-align: right;
        }
        .footer {
          text-align: center;
          margin-top: 8px;
          font-size: 9px;
        }
        .total {
          font-weight: bold;
          font-size: 10px;
        }
        
        @media print {
          body {
            background: white;
          }
          .ticket {
            width: 70mm;
            margin: 0;
            padding: 8px;
            border: none;
            box-shadow: none;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="company-header">${data.companyName.toUpperCase()}</div>
        <div class="ticket-id">TICKET #: ${data.id}</div>
        
        <div class="section">
          <div class="row">
            <span class="label">FROM:</span>
            <span class="value">${data.origin}</span>
          </div>
          <div class="row">
            <span class="label">TO:</span>
            <span class="value">${data.destination}</span>
          </div>
          <div class="row">
            <span class="label">DATE:</span>
            <span class="value">${data.departureDate} ${data.departureTime}</span>
          </div>
        </div>
        
        ${
          data.passengerName || data.seatNumber
            ? `
        <div class="section">
          ${
            data.passengerName
              ? `<div class="row">
            <span class="label">PAX:</span>
            <span class="value">${data.passengerName}</span>
          </div>`
              : ""
          }
          ${
            data.seatNumber
              ? `<div class="row">
            <span class="label">SEAT:</span>
            <span class="value">${data.seatNumber}</span>
          </div>`
              : ""
          }
        </div>
        `
            : ""
        }
        
        <div class="section">
          <div class="row">
            <span class="label">BUS:</span>
            <span class="value">${data.busRegistration}</span>
          </div>
        </div>
        
        <div class="section">
          <div class="row">
            <span class="label">PRICE:</span>
            <span class="value">${data.price}</span>
          </div>
          ${
            data.discount && data.discount !== "$0.00"
              ? `<div class="row">
            <span class="label">DISC:</span>
            <span class="value">${data.discount}</span>
          </div>`
              : ""
          }
          <div class="row total">
            <span class="label">TOTAL:</span>
            <span class="value">${data.total}</span>
          </div>
          <div class="row">
            <span class="label">PAY:</span>
            <span class="value">${data.paymentMethod}</span>
          </div>
        </div>
        
        <div class="section">
          <div class="row">
            <span class="label">LOC:</span>
            <span class="value">${data.issueLocation}</span>
          </div>
          <div class="row">
            <span class="label">DATE:</span>
            <span class="value">${data.issueDate} ${data.issueTime}</span>
          </div>
          <div class="row">
            <span class="label">BY:</span>
            <span class="value">${data.agentName}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you!</p>
          <p><strong>TIMBOON BUS CO.</strong></p>
        </div>
      </div>
      <div class="no-print" style="text-align: center; margin-top: 15px;">
        <button onclick="window.print()" style="margin-right: 10px;">Print Ticket</button>
        <button onclick="window.close()">Close</button>
      </div>
    </body>
  </html>
`

      // Write the HTML to the new window
      printWindow.document.write(ticketHTML)
      printWindow.document.close()

      // Trigger the print dialog once the content is loaded
      printWindow.addEventListener("load", () => {
        printWindow.focus()
        printWindow.print()
        // Don't close the window to allow for re-printing if needed
      })

      return true
    } catch (error) {
      console.error("Desktop printing error:", error)
      return false
    }
  }

  // Show print preview modal
  generateTicketPreview(data: TicketData): { html: string; print: () => Promise<boolean> } {
    const html = this.generateTicketHTML(data)

    // Return both the HTML and a function to trigger printing
    return {
      html,
      print: () => this.printToDesktopPrinter(data),
    }
  }

  // Add this new function
  generateTripInfoPreview(tripData: TripInfoData) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Trip Information</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              margin: 0;
              padding: 0;
              width: 80mm;
              max-width: 80mm;
            }
            .receipt {
              width: 100%;
              padding: 5mm;
              box-sizing: border-box;
            }
            .header {
              text-align: center;
              margin-bottom: 5mm;
            }
            .title {
              font-size: 14pt;
              font-weight: bold;
              margin: 2mm 0;
            }
            .subtitle {
              font-size: 12pt;
              margin: 2mm 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 1mm 0;
              font-size: 10pt;
            }
            .info-label {
              font-weight: bold;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 3mm 0;
            }
            .footer {
              text-align: center;
              font-size: 9pt;
              margin-top: 5mm;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="title">${tripData.companyName}</div>
              <div class="subtitle">TRIP INFORMATION</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="info-row">
              <span class="info-label">Trip ID:</span>
              <span>${tripData.id}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Route:</span>
              <span>${tripData.origin} to ${tripData.destination}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span>${tripData.departureDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Time:</span>
              <span>${tripData.departureTime}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="info-row">
              <span class="info-label">Bus ID:</span>
              <span>${tripData.busId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Registration:</span>
              <span>${tripData.busRegistration}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Type:</span>
              <span>${tripData.busType}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="info-row">
              <span class="info-label">Driver:</span>
              <span>${tripData.driver}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Conductor:</span>
              <span>${tripData.conductor}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Base Price:</span>
              <span>${tripData.price}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="info-row">
              <span class="info-label">Printed:</span>
              <span>${tripData.issueDate} ${tripData.issueTime}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Agent:</span>
              <span>${tripData.agentName}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="footer">
              Thank you for choosing ${tripData.companyName}
            </div>
          </div>
        </body>
      </html>
    `

    const print = async () => {
      try {
        const printWindow = window.open("", "_blank")
        if (!printWindow) {
          console.error("Failed to open print window")
          return false
        }

        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.focus()

        // Wait for content to load before printing
        await new Promise((resolve) => setTimeout(resolve, 500))

        printWindow.print()
        printWindow.close()

        return true
      } catch (error) {
        console.error("Error printing trip info:", error)
        return false
      }
    }

    return { html, print }
  }
}

export const printerService = new PrinterService() 