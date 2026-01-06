// commands/finsh.js
// أمر: .فنش
// يغير اسم المجموعة أولاً ثم يطرد كل الأعضاء عدا الأرقام المصرّح بها.
// يحفظ نسخة احتياطية من المشاركين قبل أي تغيير.

const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig') || {};
const isAdmin = require('../lib/isAdmin');

function cleanNumber(num) {
  return ('' + num).replace(/\D/g, '');
}

async function finshCommand(sock, chatId, message) {
  try {
    if (!chatId || !chatId.endsWith('@g.us')) {
      await sock.sendMessage(chatId, { text: 'هذا الأمر يعمل داخل المجموعات فقط.' }, { quoted: message }).catch(()=>{});
      return;
    }

    // ========== DEBUGGING SECTION ==========
    console.log('===== DEBUG START =====');
    console.log('Full message object:', JSON.stringify(message, null, 2));
    
    const senderId = message.key.participant || message.key.remoteJid;
    console.log('Raw senderId:', senderId);
    
    // طريقة 1: استخراج الرقم من senderId
    let senderNum = '';
    if (senderId.includes('@s.whatsapp.net')) {
      senderNum = senderId.split('@')[0].split(':')[0];
    } else if (senderId.includes(':')) {
      senderNum = senderId.split(':')[0];
    }
    senderNum = cleanNumber(senderNum);
    console.log('Cleaned senderNum:', senderNum);
    
    // طريقة 2: من message.key
    console.log('message.key:', message.key);
    console.log('message.key.remoteJid:', message.key.remoteJid);
    console.log('message.key.participant:', message.key.participant);
    
    // الأرقام المصرح بها (اختر رقمك من هنا)
    const allowedNumbers = [
      '212674751039',  // رقم 1
      '212650738559',  // رقم 2
      '674751039',     // بدون 212
      '650738559'      // بدون 212
    ];
    
    console.log('Allowed numbers:', allowedNumbers);
    console.log('Your senderNum:', senderNum);
    console.log('===== DEBUG END =====');
    // ======================================

    // تحقق يدوي - مؤقتاً
    if (!senderNum || senderNum.length < 9) {
      await sock.sendMessage(
        chatId,
        { text: '❌ لا يمكن التعرف على رقمك. جرب مرة أخرى.' },
        { quoted: message }
      );
      return;
    }

    // تحقق مؤقت: إذا كان رقمك في allowedNumbers
    const yourActualNumber = '212674751039'; // ⬅️ ⬅️ ⬅️ ضع رقمك الحقيقي هنا!
    
    // تحقق بسيط: إذا كان الرقم يطابق أو يحتوي على آخر 9 أرقام
    const last9Digits = senderNum.slice(-9);
    const yourLast9Digits = yourActualNumber.slice(-9);
    
    console.log('Comparing:', last9Digits, 'with', yourLast9Digits);
    
    if (last9Digits !== yourLast9Digits) {
      await sock.sendMessage(
        chatId,
        { text: `❌ غير مسموح لك باستخدام هذا الأمر.\nرقمك: ${senderNum}\nالمتوقع: ${yourActualNumber}` },
        { quoted: message }
      );
      return;
    }

    console.log('✅ User authorized successfully');

    // باقي الكود يبقى كما هو...
    // تأكد أن البوت مشرف
    let botId = (sock.user && sock.user.id) ? (sock.user.id.split(':')[0] + '@s.whatsapp.net') : null;
    
    // ... باقي الكود كما هو ...
    
  } catch (error) {
    console.error('Error in finshCommand:', error);
    try { 
      await sock.sendMessage(chatId, { 
        text: `❌ حدث خطأ: ${error.message}` 
      }, { quoted: message }); 
    } catch {}
  }
}

module.exports = finshCommand;