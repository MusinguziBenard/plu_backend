// services/expoPushNotification.ts (Fixed Type Errors)
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk'
import { UserPushToken } from '../models/UserPushToken'
import { Notification } from '../models/Notification'
import { User } from '../models/User'

export class ExpoPushNotificationService {
  private expo: Expo

  constructor() {
    this.expo = new Expo()
  }

  /**
   * Send push notifications in batches
   */
  async sendPushNotifications(
    notifications: Array<{
      userId: string
      title: string
      body: string
      data?: Record<string, any>
      sound?: 'default' | null
    }>
  ) {
    if (!notifications.length) return []

    const messages: ExpoPushMessage[] = []

    // Collect all valid tokens
    for (const notification of notifications) {
      const tokens = await UserPushToken.findAll({
        where: { 
          user_id: notification.userId,
          is_active: true 
        }
      })

      for (const token of tokens) {
        if (!Expo.isExpoPushToken(token.expo_push_token)) {
          console.warn(`Invalid Expo push token for user ${notification.userId}`)
          continue
        }

        messages.push({
          to: token.expo_push_token,
          sound: notification.sound || 'default',
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        })
      }
    }

    if (!messages.length) return []

    const chunks = this.expo.chunkPushNotifications(messages)
    const tickets: ExpoPushTicket[] = []

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk)
        tickets.push(...ticketChunk)
      } catch (error) {
        console.error('Error sending push notifications chunk:', error)
      }
    }

    // Handle invalid tokens
    this.handleInvalidTokens(tickets)

    return tickets
  }

  /**
   * Send a single push notification
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ) {
    return this.sendPushNotifications([{ userId, title, body, data }])
  }

  /**
   * Create in-app notification and send push
   */
  async createAndSend(
    userId: string,
    type: Notification['type'],
    referenceId: string,
    title: string,
    message: string,
    imageUrl?: string,
    pushData?: Record<string, any>
  ) {
    // Create notification in database
    const notification = await Notification.create({
      user_id: userId,
      type,
      reference_id: referenceId,
      actor_id: pushData?.actorId || null,
      title,
      message,
      image_url: imageUrl,
      push_sent: false
    })

    // Send push notification (don't await to avoid blocking)
    this.sendPushNotification(userId, title, message, {
      notificationId: notification.id,
      type,
      referenceId,
      imageUrl,
      ...pushData
    }).catch(error => {
      console.error('Push notification failed but notification saved:', error)
    })

    notification.push_sent = true
    await notification.save()

    return notification
  }

  /**
   * Handle invalid tokens - clean them up silently
   */
  private async handleInvalidTokens(tickets: ExpoPushTicket[]) {
    // Process receipts asynchronously
    setTimeout(async () => {
      try {
        // Get only the tickets that were successful (have an ID)
        const successfulTickets = tickets.filter(
          (ticket): ticket is ExpoPushTicket & { id: string } => 
            ticket.status === 'ok' && 'id' in ticket && ticket.id !== undefined
        )

        if (successfulTickets.length === 0) return

        const receiptIds = successfulTickets.map(ticket => ticket.id)
        const receipts = await this.expo.getPushNotificationReceiptsAsync(receiptIds)
        
        for (const [id, receipt] of Object.entries(receipts)) {
          if (receipt.status === 'error') {
            console.error(`Push notification failed:`, receipt.message)
            
            // Find the failed ticket
            const failedTicket = successfulTickets.find(t => t.id === id)
            
            if (failedTicket && 'data' in failedTicket && failedTicket.data) {
              const messageData = failedTicket.data as any
              const token = messageData?.to
              
              if (receipt.details?.error === 'DeviceNotRegistered' && token) {
                await UserPushToken.update(
                  { is_active: false },
                  { where: { expo_push_token: token.toString() } }
                )
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking push receipts:', error)
      }
    }, 1000)
  }

  /**
   * Send batch notification to multiple users
   */
  async sendBatchNotification(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>
  ) {
    const uniqueUserIds = [...new Set(userIds)]
    
    const batchSize = 50
    const batches = []
    
    for (let i = 0; i < uniqueUserIds.length; i += batchSize) {
      batches.push(uniqueUserIds.slice(i, i + batchSize))
    }
    
    for (const batch of batches) {
      const notifications = batch.map(userId => ({
        userId,
        title,
        body,
        data
      }))
      
      await this.sendPushNotifications(notifications)
      
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }

  /**
   * Send notification to all users
   */
  async sendToAllUsers(
    title: string,
    body: string,
    data?: Record<string, any>
  ) {
    const usersWithTokens = await UserPushToken.findAll({
      where: { is_active: true },
      attributes: ['user_id'],
      group: ['user_id']
    })
    
    const userIds = usersWithTokens.map(ut => ut.user_id)
    
    if (userIds.length === 0) return
    
    console.log(`Sending broadcast to ${userIds.length} users`)
    await this.sendBatchNotification(userIds, title, body, data)
  }
}

// Create singleton instance
const pushService = new ExpoPushNotificationService()

// Export both as default and named export
export default pushService
export { pushService }