import nodemailer from 'nodemailer';
import { Order, RestaurantSettings, ContactMessage } from '../types';

export interface NotificationLog {
  id: string;
  orderId: string; // Référence générique : ID de commande OU ID de message de contact
  timestamp: string;
  emailRecipient?: string;
  phoneRecipient?: string;
  emailStatus: 'sent' | 'simulated' | 'failed' | 'disabled';
  phoneStatus: 'sent' | 'ready' | 'failed' | 'disabled';
  emailError?: string;
  phoneError?: string;
  whatsappUrl?: string;
  summary: string;
}

// In-memory ring buffer of the latest notification dispatch logs
const notificationLogs: NotificationLog[] = [];

export function getNotificationLogs(): NotificationLog[] {
  return [...notificationLogs].slice(0, 30);
}

export function addNotificationLog(log: NotificationLog) {
  notificationLogs.unshift(log);
  if (notificationLogs.length > 50) {
    notificationLogs.pop();
  }
}

/**
 * Format a WhatsApp message for the manager with full order details
 */
export function formatOrderWhatsAppText(order: Order, restaurantName = "Saveurs d'Asie"): string {
  const itemsList = order.items
    .map((it) => {
      let line = `• ${it.quantity}x ${it.name} (${(it.price * it.quantity).toLocaleString('fr-FR')} Ar)`;
      if (it.toppings && it.toppings.length > 0) {
        line += `\n   ↪ Garnitures : ${it.toppings.join(', ')}`;
      }
      return line;
    })
    .join('\n');

  const paymentLabel =
    (order.paymentMethod as string) === 'orange_money'
      ? 'Orange Money'
      : (order.paymentMethod as string) === 'mvola'
      ? 'MVola'
      : order.paymentMethod === 'mobile_money'
      ? 'Mobile Money (MVola / Orange Money)'
      : order.paymentMethod === 'pay_on_site'
      ? 'Paiement sur place'
      : 'Paiement à la livraison (Espèces)';

  const deliveryModeLabel =
    order.deliveryType === 'takeaway' || (order.deliveryType as string) === 'pickup'
      ? '🥡 À récupérer sur place (Takeaway)'
      : '🛵 Livraison à domicile';

  return `🍜 NOUVELLE COMMANDE - ${restaurantName.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━
📦 N° COMMANDE : ${order.id}
🕒 Date : ${new Date(order.createdAt).toLocaleString('fr-FR')}

👤 CLIENT :
• Nom : ${order.customer.fullName}
• Tél : ${order.customer.phone || 'Non précisé'}
• Email : ${order.customer.email || 'Non précisé'}
• Mode : ${deliveryModeLabel}
• Adresse : ${order.customer.address}${order.customer.district ? ` (${order.customer.district})` : ''}
${order.customer.instructions ? `• Instructions : ${order.customer.instructions}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
🍽️ PLATS COMMANDÉS :
${itemsList}
━━━━━━━━━━━━━━━━━━━━
💰 Sous-total : ${order.subtotal.toLocaleString('fr-FR')} Ar
🚚 Livraison : ${order.deliveryFee.toLocaleString('fr-FR')} Ar
💵 TOTAL : ${order.total.toLocaleString('fr-FR')} Ar
💳 Règlement : ${paymentLabel}
━━━━━━━━━━━━━━━━━━━━
Veuillez confirmer la réception et lancer la préparation en cuisine.`;
}

/**
 * Generates an instant WhatsApp click-to-chat URL
 */
export function generateWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates an HTML email for the restaurant manager
 */
export function generateOrderEmailHtml(order: Order, settings: RestaurantSettings): string {
  const itemsRows = order.items
    .map(
      (it) => `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #f0e6d8; font-size: 14px; vertical-align: top;">
          <strong style="color: #1f1f1f;">${it.quantity}x ${it.name}</strong>
          ${
            it.toppings && it.toppings.length > 0
              ? `<div style="font-size: 12px; color: #8e1b1b; margin-top: 4px; font-weight: 500;">
                  + Garnitures : ${it.toppings.join(', ')}
                </div>`
              : ''
          }
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #f0e6d8; font-size: 14px; text-align: right; color: #666; vertical-align: top;">
          ${it.price.toLocaleString('fr-FR')} Ar
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #f0e6d8; font-size: 14px; text-align: right; font-weight: bold; color: #1f1f1f; vertical-align: top;">
          ${(it.price * it.quantity).toLocaleString('fr-FR')} Ar
        </td>
      </tr>
    `
    )
    .join('');

  const paymentLabel =
    (order.paymentMethod as string) === 'orange_money'
      ? 'Orange Money'
      : (order.paymentMethod as string) === 'mvola'
      ? 'MVola'
      : order.paymentMethod === 'mobile_money'
      ? 'Mobile Money (MVola / Orange Money)'
      : order.paymentMethod === 'pay_on_site'
      ? 'Paiement sur place'
      : 'Espèces à la livraison';

  const customerPhoneClean = order.customer.phone ? order.customer.phone.replace(/[^0-9]/g, '') : '';
  const customerWhatsAppLink = customerPhoneClean ? `https://wa.me/${customerPhoneClean}` : null;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Nouvelle Commande ${order.id} - ${settings.name}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f4ef; color: #2d2a26; line-height: 1.5;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #ebdcc5; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #8E1B1B 0%, #C62828 100%); color: #ffffff; padding: 28px 24px; text-align: center;">
      <div style="font-size: 28px; margin-bottom: 4px;">🥢</div>
      <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${settings.name}</h1>
      <p style="margin: 0 0 14px 0; font-size: 13px; color: #ffe082;">Alerte Nouvelle Commande en Cuisine</p>
      <div style="display: inline-block; background-color: #1F1F1F; color: #F4C542; font-family: monospace; font-size: 15px; font-weight: 700; padding: 6px 16px; border-radius: 999px; border: 1px solid rgba(244, 197, 66, 0.4);">
        N° ${order.id}
      </div>
    </div>

    <div style="padding: 24px;">
      
      <!-- Quick alert banner -->
      <div style="background-color: #fff8e6; border: 1px solid #f4c542; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px; display: flex; align-items: center;">
        <span style="font-size: 20px; margin-right: 12px;">🔔</span>
        <div>
          <strong style="color: #8e1b1b; font-size: 14px;">Une nouvelle commande vient d'être passée !</strong>
          <div style="font-size: 12px; color: #665200; margin-top: 2px;">
            Reçue le ${new Date(order.createdAt).toLocaleString('fr-FR')} • Montant : <strong>${order.total.toLocaleString('fr-FR')} Ar</strong>
          </div>
        </div>
      </div>

      <!-- Coordonnées Client -->
      <h2 style="font-size: 13px; font-weight: 800; color: #8E1B1B; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #F4C542; padding-bottom: 6px; margin: 0 0 12px 0;">
        👤 Coordonnées du Client
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #777; width: 140px; font-weight: 600;">Nom complet :</td>
          <td style="padding: 6px 0; font-weight: 700; color: #1F1F1F;">${order.customer.fullName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #777; font-weight: 600;">Téléphone :</td>
          <td style="padding: 6px 0; font-weight: 700; color: #C62828;">
            <a href="tel:${order.customer.phone}" style="color: #C62828; text-decoration: none;">${order.customer.phone || 'Non précisé'}</a>
            ${customerWhatsAppLink ? ` &nbsp;•&nbsp; <a href="${customerWhatsAppLink}" target="_blank" style="color: #25D366; text-decoration: none; font-weight: bold;">💬 Ouvrir WhatsApp</a>` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #777; font-weight: 600;">Email :</td>
          <td style="padding: 6px 0; color: #333;">${order.customer.email || 'Non précisé'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #777; font-weight: 600;">Mode :</td>
          <td style="padding: 6px 0;">
            <span style="display: inline-block; background-color: #1F1F1F; color: #ffffff; padding: 2px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;">
              ${order.deliveryType === 'takeaway' ? '🥡 À récupérer au restaurant' : '🛵 Livraison à domicile'}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #777; font-weight: 600;">Adresse :</td>
          <td style="padding: 6px 0; color: #1F1F1F; font-weight: 500;">
            ${order.customer.address} ${order.customer.district ? `(${order.customer.district})` : ''}
          </td>
        </tr>
        ${
          order.customer.instructions
            ? `<tr>
                <td style="padding: 6px 0; color: #777; font-weight: 600;">Instructions :</td>
                <td style="padding: 6px 0; color: #8e1b1b; font-style: italic;">« ${order.customer.instructions} »</td>
              </tr>`
            : ''
        }
      </table>

      <!-- Plats commandés -->
      <h2 style="font-size: 13px; font-weight: 800; color: #8E1B1B; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #F4C542; padding-bottom: 6px; margin: 24px 0 12px 0;">
        🍜 Plats & Garnitures Commandés
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f7f3eb; color: #666; font-size: 11px; text-transform: uppercase; font-weight: 700;">
            <th style="padding: 8px 10px; text-align: left;">Article</th>
            <th style="padding: 8px 10px; text-align: right; width: 90px;">P.U.</th>
            <th style="padding: 8px 10px; text-align: right; width: 100px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Total Box -->
      <div style="background-color: #fff9f0; border: 1px solid #ebdcc5; border-radius: 12px; padding: 18px; margin-top: 16px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 4px 0; color: #666;">Sous-total plats :</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600;">${order.subtotal.toLocaleString('fr-FR')} Ar</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #666;">Frais de livraison :</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600;">${order.deliveryFee.toLocaleString('fr-FR')} Ar</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #666;">Mode de règlement :</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #1f1f1f;">${paymentLabel}</td>
          </tr>
          <tr style="border-top: 2px solid #ebdcc5;">
            <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: 800; color: #C62828;">NET À PAYER :</td>
            <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: 800; text-align: right; color: #C62828;">
              ${order.total.toLocaleString('fr-FR')} Ar
            </td>
          </tr>
        </table>
      </div>

      <!-- Quick Action Buttons -->
      <div style="margin-top: 28px; text-align: center;">
        ${
          customerWhatsAppLink
            ? `<a href="${customerWhatsAppLink}" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 10px; font-size: 13px; font-weight: 700; margin: 6px; box-shadow: 0 2px 8px rgba(37, 211, 102, 0.3);">
                💬 Répondre sur WhatsApp
              </a>`
            : ''
        }
        <a href="tel:${order.customer.phone}" style="display: inline-block; background-color: #1F1F1F; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 10px; font-size: 13px; font-weight: 700; margin: 6px;">
          📞 Appeler le Client
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #f7f4ef; border-top: 1px solid #ebdcc5; padding: 16px 24px; text-align: center; font-size: 11px; color: #888;">
      Notification automatique générée par le système de commande <strong>${settings.name}</strong>.<br>
      Pour modifier les destinataires de notification, accédez à votre Tableau de Bord Back-Office > Paramètres > Notifications.
    </div>

  </div>
</body>
</html>
  `;
}

/**
 * Configure email transporter
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 587;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return null;
}

/**
 * Dispatches Email and Phone/WhatsApp notifications for a new order
 */
export async function sendOrderNotifications(
  order: Order,
  settings: RestaurantSettings
): Promise<NotificationLog> {
  const targetEmail = settings.notificationEmail || process.env.NOTIFICATION_EMAIL || settings.email || 'contact@saveursdasie.mg';
  // Le numéro WhatsApp affiché publiquement (Coordonnées) est la référence :
  // c'est celui que l'admin associe mentalement à "le numéro WhatsApp du site".
  // Le champ "Notifications" ne sert de repli que si celui-ci est vide.
  const targetPhone = settings.whatsappPhone || settings.notificationPhone || process.env.NOTIFICATION_PHONE || settings.phone || '+261342088899';

  const isEmailEnabled = settings.notifyEmailEnabled !== false;
  const isWhatsappEnabled = settings.notifyWhatsappEnabled !== false;

  const whatsAppText = formatOrderWhatsAppText(order, settings.name);
  const whatsAppUrl = generateWhatsAppLink(targetPhone, whatsAppText);

  const log: NotificationLog = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    orderId: order.id,
    timestamp: new Date().toISOString(),
    emailRecipient: targetEmail,
    phoneRecipient: targetPhone,
    emailStatus: isEmailEnabled ? 'simulated' : 'disabled',
    phoneStatus: isWhatsappEnabled ? 'ready' : 'disabled',
    whatsappUrl: whatsAppUrl,
    summary: `Commande ${order.id} (${order.total.toLocaleString('fr-FR')} Ar) - Client: ${order.customer.fullName}`,
  };

  // 1. Send Email Notification
  if (isEmailEnabled && targetEmail) {
    try {
      const transporter = createTransporter();
      const emailHtml = generateOrderEmailHtml(order, settings);
      const emailSubject = `🚨 NOUVELLE COMMANDE [${order.id}] - ${order.total.toLocaleString('fr-FR')} Ar - ${order.customer.fullName}`;

      if (transporter) {
        const fromAddress = process.env.SMTP_FROM || `"${settings.name}" <${targetEmail}>`;
        await transporter.sendMail({
          from: fromAddress,
          to: targetEmail,
          subject: emailSubject,
          html: emailHtml,
          text: whatsAppText,
        });
        log.emailStatus = 'sent';
        console.log(`[Notification] ✅ Email envoyé avec succès à ${targetEmail} pour la commande ${order.id}`);
      } else {
        // SMTP non configuré: mode simulation automatique sécurisé
        log.emailStatus = 'simulated';
        console.log(`[Notification] ℹ️ Mode simulation email (SMTP non configuré dans .env) :`);
        console.log(`  -> Destinataire : ${targetEmail}`);
        console.log(`  -> Objet : ${emailSubject}`);
        console.log(`  -> Client : ${order.customer.fullName} (${order.customer.phone})`);
        console.log(`  -> Total : ${order.total} Ar`);
      }
    } catch (err: any) {
      log.emailStatus = 'failed';
      log.emailError = err?.message || 'Erreur inconnue envoi email';
      console.error(`[Notification] ❌ Erreur lors de l'envoi email:`, err);
    }
  }

  // 2. Phone / SMS / WhatsApp Notification
  if (isWhatsappEnabled && targetPhone) {
    // Check if Twilio is configured in env for direct SMS
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_FROM_NUMBER;

    if (twilioSid && twilioAuth && twilioFrom) {
      try {
        const cleanPhone = targetPhone.startsWith('+') ? targetPhone : `+${targetPhone.replace(/[^0-9]/g, '')}`;
        const body = `NOUVELLE COMMANDE ${order.id} (${order.total} Ar) de ${order.customer.fullName}. Tel: ${order.customer.phone}. Mode: ${order.deliveryType}.`;
        
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: cleanPhone,
            From: twilioFrom,
            Body: body,
          }).toString(),
        });

        if (res.ok) {
          log.phoneStatus = 'sent';
          console.log(`[Notification] ✅ SMS Twilio envoyé à ${targetPhone}`);
        } else {
          log.phoneStatus = 'ready';
          console.warn(`[Notification] Twilio response not OK, ready via WhatsApp link`);
        }
      } catch (err: any) {
        log.phoneStatus = 'ready';
        log.phoneError = err?.message;
      }
    } else {
      // Ready via direct WhatsApp link & instant client bridge
      log.phoneStatus = 'ready';
      console.log(`[Notification] 📲 Alerte Téléphone/WhatsApp prête pour ${targetPhone} : ${whatsAppUrl}`);
    }
  }

  addNotificationLog(log);
  return log;
}

/**
 * Génère le HTML de l'email envoyé au restaurant pour un nouveau message
 * de contact ou une demande de réservation.
 */
function generateContactMessageEmailHtml(msg: ContactMessage, settings: RestaurantSettings): string {
  const typeLabel =
    msg.requestType === 'reservation'
      ? '🍽️ Réservation de table'
      : msg.requestType === 'order_special'
      ? '🎉 Événement / Traiteur'
      : msg.requestType === 'other'
      ? '💬 Autre demande'
      : '❓ Demande d\'information';

  const reservationRows =
    msg.reservationDate || msg.reservationTime || msg.guestsCount
      ? `
        <tr><td style="padding:4px 0;color:#666;">Date souhaitée</td><td style="padding:4px 0;font-weight:bold;">${msg.reservationDate || '-'}</td></tr>
        <tr><td style="padding:4px 0;color:#666;">Heure souhaitée</td><td style="padding:4px 0;font-weight:bold;">${msg.reservationTime || '-'}</td></tr>
        ${msg.guestsCount ? `<tr><td style="padding:4px 0;color:#666;">Nombre de convives</td><td style="padding:4px 0;font-weight:bold;">${msg.guestsCount}</td></tr>` : ''}
      `
      : '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1F1F1F;">
      <div style="background:#C62828;color:white;padding:20px;border-radius:12px 12px 0 0;">
        <h2 style="margin:0;">${typeLabel}</h2>
        <p style="margin:4px 0 0;opacity:0.9;">Référence ${msg.id} — ${settings.name}</p>
      </div>
      <div style="background:#FBF7EE;padding:20px;border-radius:0 0 12px 12px;border:1px solid #EBDCC5;border-top:none;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <tr><td style="padding:4px 0;color:#666;width:160px;">Nom</td><td style="padding:4px 0;font-weight:bold;">${msg.name}</td></tr>
          ${msg.phone ? `<tr><td style="padding:4px 0;color:#666;">Téléphone</td><td style="padding:4px 0;font-weight:bold;">${msg.phone}</td></tr>` : ''}
          ${msg.email ? `<tr><td style="padding:4px 0;color:#666;">Email</td><td style="padding:4px 0;font-weight:bold;">${msg.email}</td></tr>` : ''}
          <tr><td style="padding:4px 0;color:#666;">Objet</td><td style="padding:4px 0;font-weight:bold;">${msg.subject}</td></tr>
          ${reservationRows}
        </table>
        <div style="background:white;border:1px solid #EBDCC5;border-radius:8px;padding:14px;">
          <p style="margin:0;white-space:pre-wrap;">${msg.message}</p>
        </div>
        <p style="color:#999;font-size:11px;margin-top:16px;">Reçu le ${new Date(msg.createdAt).toLocaleString('fr-FR')}</p>
      </div>
    </div>
  `;
}

/**
 * Envoie une notification email au restaurant pour un nouveau message de
 * contact ou une demande de réservation soumise depuis le site public.
 */
export async function sendContactMessageNotification(
  msg: ContactMessage,
  settings: RestaurantSettings
): Promise<NotificationLog> {
  const targetEmail = settings.notificationEmail || process.env.NOTIFICATION_EMAIL || settings.email || 'contact@saveursdasie.mg';
  const isEmailEnabled = settings.notifyEmailEnabled !== false;

  const log: NotificationLog = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    orderId: msg.id,
    timestamp: new Date().toISOString(),
    emailRecipient: targetEmail,
    emailStatus: isEmailEnabled ? 'simulated' : 'disabled',
    phoneStatus: 'disabled',
    summary: `Message ${msg.id} (${msg.requestType}) - De: ${msg.name}`,
  };

  if (isEmailEnabled && targetEmail) {
    try {
      const transporter = createTransporter();
      const emailHtml = generateContactMessageEmailHtml(msg, settings);
      const typeLabel = msg.requestType === 'reservation' ? 'Réservation' : msg.requestType === 'order_special' ? 'Événement' : 'Contact';
      const emailSubject = `📩 Nouveau message [${typeLabel}] - ${msg.name} - ${settings.name}`;

      if (transporter) {
        const fromAddress = process.env.SMTP_FROM || `"${settings.name}" <${targetEmail}>`;
        await transporter.sendMail({
          from: fromAddress,
          to: targetEmail,
          replyTo: msg.email || undefined,
          subject: emailSubject,
          html: emailHtml,
          text: `${msg.subject}\n\nDe : ${msg.name}\nTéléphone : ${msg.phone || '-'}\nEmail : ${msg.email || '-'}\n\n${msg.message}`,
        });
        log.emailStatus = 'sent';
        console.log(`[Notification] ✅ Email de contact envoyé à ${targetEmail} pour le message ${msg.id}`);
      } else {
        log.emailStatus = 'simulated';
        console.log(`[Notification] ℹ️ Mode simulation email (SMTP non configuré dans .env) — message ${msg.id} de ${msg.name} non envoyé réellement.`);
      }
    } catch (err: any) {
      log.emailStatus = 'failed';
      log.emailError = err?.message || 'Erreur inconnue envoi email';
      console.error(`[Notification] ❌ Erreur lors de l'envoi de l'email de contact:`, err);
    }
  }

  addNotificationLog(log);
  return log;
}

/**
 * Sends a test notification to verify recipient configuration
 */
export async function sendTestNotification(
  type: 'email' | 'whatsapp' | 'sms',
  target: string,
  settings: RestaurantSettings
): Promise<{ success: boolean; message: string; previewUrl?: string }> {
  if (type === 'email') {
    const transporter = createTransporter();
    const testSubject = `🧪 TEST DE NOTIFICATION - ${settings.name}`;
    const testHtml = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ebdcc5; border-radius: 12px; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #C62828;">✅ Test de notification réussi !</h2>
        <p>Ce message confirme que votre adresse email (<strong>${target}</strong>) est correctement configurée pour recevoir les alertes de commandes de <strong>${settings.name}</strong>.</p>
        <p style="font-size: 12px; color: #666;">Date du test : ${new Date().toLocaleString('fr-FR')}</p>
      </div>
    `;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"${settings.name}" <${target}>`,
          to: target,
          subject: testSubject,
          html: testHtml,
        });
        return {
          success: true,
          message: `Email de test envoyé avec succès à ${target} via le serveur SMTP.`,
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Erreur SMTP : ${err?.message || 'Échec de connexion'}. Vérifiez vos identifiants SMTP dans .env.`,
        };
      }
    } else {
      return {
        success: false,
        message: `Aucun email envoyé : le serveur SMTP n'est pas configuré. Renseignez SMTP_HOST, SMTP_USER et SMTP_PASS dans votre fichier .env, puis relancez le serveur.`,
      };
    }
  } else {
    // Phone / WhatsApp test
    const text = `🧪 TEST DE NOTIFICATION SAVEURS D'ASIE\nVotre numéro (${target}) est bien paramétré pour recevoir les commandes en temps réel !`;
    const url = generateWhatsAppLink(target, text);
    return {
      success: true,
      message: `Lien WhatsApp de notification généré avec succès pour ${target}.`,
      previewUrl: url,
    };
  }
}
