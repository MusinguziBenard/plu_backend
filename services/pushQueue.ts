// services/pushQueue.ts (Optional - for handling large volumes)
import { pushService } from './expoPushNotification'

// Simple in-memory queue (no Redis needed for small to medium apps)
class PushQueue {
  private queue: Array<{
    userId: string
    title: string
    body: string
    data?: Record<string, any>
  }> = []
  
  private isProcessing = false
  private batchSize = 50
  private batchInterval = 5000 // 5 seconds

  async add(userId: string, title: string, body: string, data?: Record<string, any>) {
    this.queue.push({ userId, title, body, data })
    
    if (!this.isProcessing) {
      this.processQueue()
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false
      return
    }

    this.isProcessing = true
    
    // Take batch
    const batch = this.queue.splice(0, this.batchSize)
    
    try {
      await pushService.sendPushNotifications(batch)
    } catch (error) {
      console.error('Batch send error:', error)
    }
    
    // Process next batch after delay
    setTimeout(() => this.processQueue(), this.batchInterval)
  }
}

export const pushQueue = new PushQueue()