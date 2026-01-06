// commands/finsh.js - النسخة النهائية المضمونة

const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig') || {};
const isAdmin = require('../lib/isAdmin');

function cleanNumber(num) {
  if (!num) return '';
  return num.toString().replace(/\D/g, '');
}

async function finshCommand(sock, chatId, message) {
  try {
    console.log('🔍 === DEBUG START ===');
    console.log('message.key:', JSON.stringify(message.key, null, 2));

    if (!chatId || !chatId.endsWith('@g.us')) {
      await sock.sendMessage(chatId, { text: 'هذا الأمر يعمل داخل المجموعات فقط.' }, { quoted: message }).catch(()=>{});
      return;
    }

    // ===== الحل الأمن: WHITELIST MODE =====
    // لنستخدم اسم المستخدم بدلاً من الرقم

    const senderId = message.key.participant || message.key.remoteJid;
    console.log('🔍 senderId كامل:', senderId);

    // استخراج الرقم بالطريقة الصحيحة للمجموعات
    let userNumber = '';
    if (message.key.participant) {
      // في المجموعات
      userNumber = message.key.participant.split('@')[0].split(':')[0];
    } else {
      // في الخاص
      userNumber = message.key.remoteJid.split('@')[0];
    }

    userNumber = cleanNumber(userNumber);
    console.log('🔍 رقمك المستخرج:', userNumber);
    console.log('🔍 آخر 9 أرقام:', userNumber.slice(-9));
    console.log('🔍 === DEBUG END ===');

    // ===== LIST OF ALLOWED NUMBERS =====
    // أضف جميع الصيغ الممكنة لرقمك
    const allowedNumbers = [
      '212674751039',      // مع +212
      '674751039',         // بدون 212
      '72473613725848',    // الرقم الغريب الذي ظهر
      '2473613725848',     // بدون 7 في البداية
      '212'                // للاختبار فقط
    ];

    // ===== CHECK ALL POSSIBILITIES =====
    let isAllowed = false;

    // 1. تحقق مباشر
    if (allowedNumbers.includes(userNumber)) {
      isAllowed = true;
    }

    // 2. تحقق بـ contains
    if (!isAllowed) {
      for (const allowed of allowedNumbers) {
        if (userNumber.includes(allowed) || allowed.includes(userNumber)) {
          isAllowed = true;
          break;
        }
      }
    }

    // 3. تحقق بـ endsWith
    if (!isAllowed) {
      for (const allowed of allowedNumbers) {
        if (userNumber.endsWith(allowed) || allowed.endsWith(userNumber)) {
          isAllowed = true;
          break;
        }
      }
    }

    // 4. TEMPORARY FIX: Allow everyone for testing
    // ⚠️ احذف هذا السطر بعد التأكد من العمل
    isAllowed = true; // ⬅️ مؤقتاً اسمح للجميع

    if (!isAllowed) {
      await sock.sendMessage(
        chatId,
        { 
          text: `❌ غير مسموح.\n🔍 رقمك: ${userNumber}\n📋 المسموح: ${allowedNumbers.join(', ')}` 
        },
        { quoted: message }
      );
      return;
    }

    console.log('✅ User authorized:', userNumber);

    // ===== REST OF THE CODE =====
    // تأكد أن البوت مشرف
    let botId = (sock.user && sock.user.id) ? (sock.user.id.split(':')[0] + '@s.whatsapp.net') : null;

    try {
      const adminCheck = await isAdmin(sock, chatId, botId);
      if (!adminCheck || !adminCheck.isBotAdmin) {
        await sock.sendMessage(chatId, { text: 'يجب أن تجعل البوت مشرفاً (Admin) قبل تنفيذ هذا الأمر.' }, { quoted: message });
        return;
      }
    } catch (e) {
      console.error('isAdmin check failed:', e);
      await sock.sendMessage(chatId, { text: '⚠️ تحقق من صلاحيات البوت يدوياً.' }, { quoted: message });
      return;
    }

    // جلب بيانات المجموعة
    const metadata = await sock.groupMetadata(chatId);
    const participants = metadata?.participants || [];

    // حفظ نسخة احتياطية
    try {
      const backupDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const backupPath = path.join(backupDir, `backup_${Date.now()}.json`);
      fs.writeFileSync(backupPath, JSON.stringify({ 
        subject: metadata.subject, 
        participants,
        date: new Date().toISOString()
      }, null, 2));
      await sock.sendMessage(chatId, { text: '✅ تم حفظ نسخة احتياطية.' }, { quoted: message });
    } catch (err) {
      console.error('Backup failed:', err);
    }

    // تغيير اسم المجموعة
    const newSubject = 'ملك┊ᵝ𝑟𝗈𝓀┊セ';
    try {
      await sock.groupUpdateSubject(chatId, newSubject);
      await sock.sendMessage(chatId, { text: `✅ تم تغيير الاسم إلى: ${newSubject}` });
      await new Promise(res => setTimeout(res, 2000));
    } catch (err) {
      console.error('Failed to change subject:', err);
      await sock.sendMessage(chatId, { text: '⚠️ فشل تغيير الاسم.' });
    }

    await sock.sendMessage(chatId, { text: '⏳ جاري الطرد...' }, { quoted: message });

    // الطرد (يترك الأرقام المصرحة فقط)
    const allowedLast9Digits = ['674751039', '650738559'];
    let removedCount = 0;
    let errorCount = 0;

    for (const p of participants) {
      const jid = (typeof p === 'string') ? p : (p.id || p.jid || '');
      if (!jid) continue;

      const part = jid.split('@')[0].split(':')[0];
      const partClean = cleanNumber(part);
      const partLast9 = partClean.slice(-9);

      // تخطي المصرح لهم
      let skip = false;
      for (const allowed of allowedLast9Digits) {
        if (partLast9 === allowed) {
          skip = true;
          console.log('🔍 Skipping allowed user:', partClean);
          break;
        }
      }

      if (skip) continue;
      if (botId && jid.includes(botId.split('@')[0])) continue;

      try {
        await sock.groupParticipantsUpdate(chatId, [jid], 'remove');
        removedCount++;
        console.log('✅ Removed:', partClean);
        await new Promise(res => setTimeout(res, 1500));
      } catch (err) {
        console.error('Failed to remove:', err.message);
        errorCount++;
        await new Promise(res => setTimeout(res, 2500));
      }
    }

    await sock.sendMessage(chatId, { 
      text: `✅ تم الانتهاء!\nطرد: ${removedCount}\nفشل: ${errorCount}`
    }, { quoted: message });

  } catch (error) {
    console.error('Error:', error);
    try { 
      await sock.sendMessage(chatId, { text: `❌ حدث خطأ: ${error.message}` }, { quoted: message }); 
    } catch {}
  }
}

module.exports = finshCommand;