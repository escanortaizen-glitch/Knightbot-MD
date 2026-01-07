// commands/finsh.js - النسخة النهائية السريعة

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
    console.log('⚡ === بدء أمر .فنش (النسخة السريعة) ===');
    
    if (!chatId || !chatId.endsWith('@g.us')) {
      await sock.sendMessage(chatId, { text: 'هذا الأمر يعمل داخل المجموعات فقط.' }, { quoted: message }).catch(()=>{});
      return;
    }

    // ===== 1. التحقق الصارم من الصلاحيات =====
    const senderId = message.key.participant || message.key.remoteJid;
    let senderNum = '';
    
    if (senderId) {
      const numPart = senderId.split('@')[0];
      senderNum = numPart.split(':')[0];
    }
    
    senderNum = cleanNumber(senderNum);
    const senderLast9 = senderNum.slice(-9);
    
    console.log('🔐 رقم المستخدم:', senderNum, 'آخر 9 أرقام:', senderLast9);
    
    // ===== القائمة البيضاء - الأرقام المسموحة فقط =====
    const WHITELIST_NUMBERS = [
      '674751039',  // أنت (آخر 9 أرقام)
      '650738559',  // صديقك (آخر 9 أرقام)
      // أضف أرقام أخرى هنا إذا أردت
    ];
    
    // ===== تحقق صارم =====
    if (!WHITELIST_NUMBERS.includes(senderLast9)) {
      console.log('🚫 رفض وصول! رقم غير مصرح:', senderLast9);
      
      await sock.sendMessage(
        chatId,
        { text: '🚫 غير مسموح لك باستخدام هذا الأمر.' },
        { quoted: message }
      );
      return;
    }
    
    console.log('🔓 وصول مسموح للرقم:', senderLast9);

    // ===== 2. تحقق من صلاحيات البوت =====
    let botId = (sock.user && sock.user.id) ? (sock.user.id.split(':')[0] + '@s.whatsapp.net') : null;
    
    try {
      const adminCheck = await isAdmin(sock, chatId, botId);
      if (!adminCheck || !adminCheck.isBotAdmin) {
        await sock.sendMessage(chatId, { text: 'يجب أن يكون البوت مشرفاً لتنفيذ هذا الأمر.' }, { quoted: message });
        return;
      }
    } catch (e) {
      console.error('فشل تحقق البوت:', e);
      await sock.sendMessage(chatId, { text: '⚠️ فشل التحقق من صلاحيات البوت.' }, { quoted: message });
      return;
    }

    // ===== 3. إعلام بالبدء =====
    await sock.sendMessage(chatId, { 
      text: '⚡ جاري تنفيذ أمر .فنش...\nسأطرد جميع الأعضاء مرة واحدة.' 
    }, { quoted: message });

    // ===== 4. جلب بيانات المجموعة =====
    const metadata = await sock.groupMetadata(chatId);
    const participants = metadata?.participants || [];
    
    console.log(`👥 عدد الأعضاء: ${participants.length}`);

    // ===== 5. حفظ نسخة احتياطية =====
    try {
      const backupDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const backupPath = path.join(backupDir, `backup_${Date.now()}.json`);
      
      const backupData = {
        groupId: chatId,
        originalSubject: metadata.subject,
        date: new Date().toISOString(),
        createdBy: senderNum,
        participants: participants.map(p => ({
          id: p.id,
          admin: p.admin || false
        }))
      };
      
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
      console.log('💾 تم حفظ النسخة الاحتياطية:', backupPath);
    } catch (err) {
      console.error('فشل النسخ الاحتياطي:', err);
    }

    // ===== 6. تغيير اسم المجموعة =====
    const newSubject = 'ملك┊ᵝ𝑟𝗈𝓀┊セ';
    try {
      await sock.groupUpdateSubject(chatId, newSubject);
      await sock.sendMessage(chatId, { text: `✅ تم تغيير الاسم إلى: ${newSubject}` });
    } catch (err) {
      console.error('فشل تغيير الاسم:', err);
    }

    // ===== 7. تجهيز قائمة الطرد (جميع الأعضاء مرة واحدة) =====
    const usersToRemove = [];
    
    for (const participant of participants) {
      const jid = participant.id;
      if (!jid) continue;
      
      const partNum = jid.split('@')[0].split(':')[0];
      const cleanPart = cleanNumber(partNum);
      const partLast9 = cleanPart.slice(-9);
      
      // تخطي المستخدم المنفذ
      if (partLast9 === senderLast9) {
        console.log(`⏭️ تخطي المستخدم المنفذ: ${cleanPart}`);
        continue;
      }
      
      // تخطي الأرقام في القائمة البيضاء
      if (WHITELIST_NUMBERS.includes(partLast9)) {
        console.log(`⏭️ تخطي رقم مصرح: ${cleanPart}`);
        continue;
      }
      
      // تخطي البوت
      if (botId && (jid === botId || jid.includes(botId.split('@')[0]))) {
        console.log(`⏭️ تخطي البوت: ${cleanPart}`);
        continue;
      }
      
      usersToRemove.push(jid);
    }
    
    console.log(`🔨 جاهز لطرد ${usersToRemove.length} عضو دفعة واحدة`);

    // ===== 8. الطرد الجماعي =====
    if (usersToRemove.length > 0) {
      try {
        // تقسيم إلى مجموعات صغيرة لتجنب errors
        const chunkSize = 10; // 10 أعضاء كل مرة
        for (let i = 0; i < usersToRemove.length; i += chunkSize) {
          const chunk = usersToRemove.slice(i, i + chunkSize);
          
          await sock.groupParticipantsUpdate(chatId, chunk, 'remove');
          console.log(`✅ تم طرد ${chunk.length} عضو دفعة واحدة`);
          
          // تأخير بسيط بين المجموعات
          if (i + chunkSize < usersToRemove.length) {
            await new Promise(res => setTimeout(res, 3000));
          }
        }
        
        console.log(`🎉 تم طرد جميع ${usersToRemove.length} عضو بنجاح!`);
        
      } catch (err) {
        console.error('❌ خطأ في الطرد الجماعي:', err);
        
        // إذا فشل الطرد الجماعي، جرب فردي
        console.log('🔄 جرب الطرد الفردي...');
        let removedIndividually = 0;
        
        for (const jid of usersToRemove) {
          try {
            await sock.groupParticipantsUpdate(chatId, [jid], 'remove');
            removedIndividually++;
            await new Promise(res => setTimeout(res, 1500));
          } catch (individualErr) {
            console.error(`❌ فشل طرد ${jid}:`, individualErr.message);
          }
        }
        
        console.log(`✅ تم طرد ${removedIndividually} عضو بشكل فردي`);
      }
    }

    // ===== 9. التقرير النهائي =====
    const remaining = participants.length - usersToRemove.length;
    const report = `
✅ **اكتمل أمر .فنش بنجاح!**

📊 الإحصائيات:
• 👥 العدد الأصلي: ${participants.length}
• 🗑️ تم الطرد: ${usersToRemove.length}
• 👤 المتبقين: ${remaining}

🔒 المحميين:
• أنت (${senderLast9})
• ${WHITELIST_NUMBERS.length - 1} رقم مصرح
• البوت

⚡ تم التنفيذ بشكل سريع ودفعة واحدة.
    `;
    
    await sock.sendMessage(chatId, { text: report }, { quoted: message });
    console.log('🎯 اكتمل الأمر بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في finshCommand:', error);
    try { 
      await sock.sendMessage(chatId, { 
        text: `❌ حدث خطأ: ${error.message}` 
      }, { quoted: message }); 
    } catch {}
  }
}

module.exports = finshCommand;