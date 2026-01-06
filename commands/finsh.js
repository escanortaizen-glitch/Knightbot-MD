// commands/finsh.js - النسخة النهائية المعدلة

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
    console.log('🔧 === بدء أمر .فنش ===');
    
    if (!chatId || !chatId.endsWith('@g.us')) {
      await sock.sendMessage(chatId, { text: 'هذا الأمر يعمل داخل المجموعات فقط.' }, { quoted: message }).catch(()=>{});
      return;
    }

    // ===== 1. تحقق من صلاحيات المستخدم =====
    const senderId = message.key.participant || message.key.remoteJid;
    let senderNum = '';
    
    if (senderId) {
      const numPart = senderId.split('@')[0];
      senderNum = numPart.split(':')[0];
    }
    
    senderNum = cleanNumber(senderNum);
    const senderLast9 = senderNum.slice(-9);
    
    console.log('🔍 رقم المستخدم:', senderNum, 'آخر 9 أرقام:', senderLast9);
    
    // الأرقام التي يجب أن تبقى في المجموعة (آخر 9 أرقام)
    const numbersToKeep = [
      '674751039',  // أنت (من +212674751039)
      '650738559',  // صديقك (من +212650738559)
      // أضف أرقام أخرى هنا
    ];
    
    // تحقق إذا كان المستخدم مصرح له
    if (!numbersToKeep.includes(senderLast9)) {
      await sock.sendMessage(
        chatId,
        { text: '❌ غير مسموح لك باستخدام هذا الأمر.' },
        { quoted: message }
      );
      return;
    }
    
    console.log('✅ المستخدم مصرح له');

    // ===== 2. تحقق من صلاحيات البوت =====
    let botId = (sock.user && sock.user.id) ? (sock.user.id.split(':')[0] + '@s.whatsapp.net') : null;
    console.log('🤖 ID البوت:', botId);
    
    try {
      const adminCheck = await isAdmin(sock, chatId, botId);
      if (!adminCheck || !adminCheck.isBotAdmin) {
        await sock.sendMessage(chatId, { text: 'يجب أن تجعل البوت مشرفاً (Admin) قبل تنفيذ هذا الأمر.' }, { quoted: message });
        return;
      }
    } catch (e) {
      console.error('فشل التحقق من صلاحيات البوت:', e);
      await sock.sendMessage(chatId, { text: '⚠️ تحقق من صلاحيات البوت يدوياً.' }, { quoted: message });
      return;
    }

    // ===== 3. جلب بيانات المجموعة =====
    const metadata = await sock.groupMetadata(chatId);
    const participants = metadata?.participants || [];
    
    console.log(`👥 عدد الأعضاء: ${participants.length}`);

    // ===== 4. حفظ نسخة احتياطية =====
    try {
      const backupDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const backupPath = path.join(backupDir, `backup_${Date.now()}.json`);
      fs.writeFileSync(backupPath, JSON.stringify({ 
        subject: metadata.subject, 
        participants: participants.map(p => ({
          id: p.id,
          admin: p.admin
        })),
        date: new Date().toISOString()
      }, null, 2));
      await sock.sendMessage(chatId, { text: `✅ تم حفظ نسخة احتياطية:\n${backupPath}` }, { quoted: message });
    } catch (err) {
      console.error('فشل حفظ النسخة الاحتياطية:', err);
      await sock.sendMessage(chatId, { text: '⚠️ فشل حفظ النسخة الاحتياطية.' }, { quoted: message });
    }

    // ===== 5. تغيير اسم المجموعة =====
    const newSubject = 'ملك┊ᵝ𝑟𝗈𝓀┊セ';
    try {
      await sock.groupUpdateSubject(chatId, newSubject);
      await sock.sendMessage(chatId, { text: `✅ تم تغيير اسم المجموعة إلى:\n"${newSubject}"` });
      await new Promise(res => setTimeout(res, 2000));
    } catch (err) {
      console.error('فشل تغيير الاسم:', err);
      await sock.sendMessage(chatId, { text: '⚠️ فشل تغيير اسم المجموعة.' });
    }

    await sock.sendMessage(chatId, { 
      text: `⏳ جاري تنظيف المجموعة...\n\n✅ سيتم الاحتفاظ بـ:\n1. أنت (${senderNum})\n2. ${numbersToKeep.length} رقم مصرح\n3. البوت نفسه` 
    }, { quoted: message });

    // ===== 6. بدء عملية الطرد (مع استثناءات) =====
    let removedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    console.log('🔄 بدء عملية الطرد...');
    
    for (const p of participants) {
      const jid = p.id || p.jid || '';
      if (!jid) continue;
      
      // استخراج الرقم من الـ JID
      const part = jid.split('@')[0].split(':')[0];
      const partClean = cleanNumber(part);
      const partLast9 = partClean.slice(-9);
      
      console.log(`🔍 فحص: ${partClean} (${partLast9})`);
      
      // ===== التحقق من الاستثناءات =====
      let shouldSkip = false;
      let skipReason = '';
      
      // 1. تخطي المستخدم الذي أرسل الأمر (أنت)
      if (partLast9 === senderLast9) {
        shouldSkip = true;
        skipReason = 'المستخدم الرئيسي';
      }
      
      // 2. تخطي الأرقام المصرح بها
      else if (numbersToKeep.includes(partLast9)) {
        shouldSkip = true;
        skipReason = 'رقم مصرح';
      }
      
      // 3. تخطي البوت نفسه
      else if (botId && jid === botId) {
        shouldSkip = true;
        skipReason = 'البوت نفسه';
      }
      
      // 4. تخطي إذا كان البوت جزءًا من الرقم
      else if (botId && jid.includes(botId.split('@')[0])) {
        shouldSkip = true;
        skipReason = 'حساب البوت';
      }
      
      if (shouldSkip) {
        console.log(`⏭️ تخطي: ${partClean} (سبب: ${skipReason})`);
        skippedCount++;
        continue;
      }
      
      // ===== طرد العضو =====
      console.log(`🗑️ محاولة طرد: ${partClean}`);
      try {
        await sock.groupParticipantsUpdate(chatId, [jid], 'remove');
        removedCount++;
        console.log(`✅ تم طرد: ${partClean}`);
        
        // تأخير لتجنب rate limit
        await new Promise(res => setTimeout(res, 1500));
      } catch (err) {
        console.error(`❌ فشل طرد ${partClean}:`, err.message);
        errorCount++;
        await new Promise(res => setTimeout(res, 2500));
      }
    }

    // ===== 7. إرسال التقرير النهائي =====
    const report = `
✅ اكتملت عملية التنظيف!

📊 النتائج:
• 👥 العدد الإجمالي: ${participants.length}
• 👤 تم الاحتفاظ بـ: ${skippedCount} عضو
• 🗑️ تم الطرد: ${removedCount} عضو
• ❌ فشل الطرد: ${errorCount} عضو

🔒 المحميين:
1. أنت (${senderNum})
2. ${numbersToKeep.length} رقم مصرح
3. البوت
    `;
    
    await sock.sendMessage(chatId, { text: report }, { quoted: message });
    console.log('🎉 اكتمل الأمر بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في finshCommand:', error);
    try { 
      await sock.sendMessage(chatId, { 
        text: `❌ حدث خطأ غير متوقع:\n${error.message}` 
      }, { quoted: message }); 
    } catch {}
  }
}

module.exports = finshCommand;