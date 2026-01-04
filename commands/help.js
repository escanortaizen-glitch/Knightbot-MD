const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
 const helpMessage = `
╔═══════════════════╗
 🤖 ${settings.botName || 'KnightBot-MD'}*  
   الإصدار: *${settings.version || '3.0.0'}
 بواسطة ${settings.botOwner || 'Mr Unique Hacker'}
   YT : ${global.ytch}
╚═══════════════════╝

*Available Commands:*

╔═══════════════════╗
🌐 *General Commands*:
║ ➤ .help or .menu
║ ➤ .ping
║ ➤ .alive
║ ➤ .tts <text>
║ ➤ .owner
║ ➤ .joke
║ ➤ .quote
║ ➤ .fact
║ ➤ .weather <city>
║ ➤ .news
║ ➤ .attp <text>
║ ➤ .lyrics <song_title>
║ ➤ .8ball <question>
║ ➤ .groupinfo
║ ➤ .staff or .admins 
║ ➤ .vv
║ ➤ .trt <text> <lang>
║ ➤ .ss <link>
║ ➤ .jid
║ ➤ .url
╚═══════════════════╝ 

╔═══════════════════╗
👮‍♂️ *Admin Commands*:
║ ➤ .ban @user
║ ➤ .promote @user
║ ➤ .demote @user
║ ➤ .mute <minutes>
║ ➤ .unmute
║ ➤ .delete or .del
║ ➤ .kick @user
║ ➤ .warnings @user
║ ➤ .warn @user
║ ➤ .antilink
║ ➤ .antibadword
║ ➤ .clear
║ ➤ .tag <message>
║ ➤ .tagall
║ ➤ .tagnotadmin
║ ➤ .hidetag <message>
║ ➤ .chatbot
║ ➤ .resetlink
║ ➤ .antitag <on/off>
║ ➤ .welcome <on/off>
║ ➤ .goodbye <on/off>
║ ➤ .setgdesc <description>
║ ➤ .setgname <new name>
║ ➤ .setgpp (reply to image)
╚═══════════════════╝

╔═══════════════════╗
🔒 *Owner Commands*:
║ ➤ .mode <public/private>
║ ➤ .clearsession
║ ➤ .antidelete
║ ➤ .cleartmp
║ ➤ .update
║ ➤ .settings
║ ➤ .setpp <reply to image>
║ ➤ .autoreact <on/off>
║ ➤ .autostatus <on/off>
║ ➤ .autostatus react <on/off>
║ ➤ .autotyping <on/off>
║ ➤ .autoread <on/off>
║ ➤ .anticall <on/off>
║ ➤ .pmblocker <on/off/status>
║ ➤ .pmblocker setmsg <text>
║ ➤ .setmention <reply to msg>
║ ➤ .mention <on/off>
╚═══════════════════╝

╔═══════════════════╗
🎨 *Image/Sticker Commands*:
║ ➤ .blur <image>
║ ➤ .simage <reply to sticker>
║ ➤ .sticker <reply to image>
║ ➤ .removebg
║ ➤ .remini
║ ➤ .crop <reply to image>
║ ➤ .tgsticker <Link>
║ ➤ .meme
║ ➤ .take <packname> 
║ ➤ .emojimix <emj1>+<emj2>
║ ➤ .igs <insta link>
║ ➤ .igsc <insta link>
╚═══════════════════╝  

╔═══════════════════╗
🖼️ *Pies Commands*:
║ ➤ .pies <country>
║ ➤ .china 
║ ➤ .indonesia 
║ ➤ .japan 
║ ➤ .korea 
║ ➤ .hijab
╚═══════════════════╝

╔═══════════════════╗
🎮 *Game Commands*:
║ ➤ .tictactoe @user
║ ➤ .hangman
║ ➤ .guess <letter>
║ ➤ .trivia
║ ➤ .answer <answer>
║ ➤ .truth
║ ➤ .dare
╚═══════════════════╝

╔═══════════════════╗
🤖 أوامر الذكاء الاصطناعي:
║ ➤ .gpt <question> — سؤال لـ ChatGPT/نموذج GPT
║ ➤ .gemini <question> — سؤال لنموذج Gemini
║ ➤ .imagine <prompt> — توليد صورة من نص (AI)
║ ➤ .flux <prompt> — أمر توليد/معالجة مخصص
║ ➤ .sora <prompt> — أمر AI مخصص آخر
╚═══════════════════╝

╔═══════════════════╗
🎯 أوامر الترفيه:
║ ➤ .compliment @user — مجاملة لمستخدم
║ ➤ .insult @user — إهانة مرحة لمستخدم
║ ➤ .flirt — رسائل غزل مرحة
║ ➤ .shayari — أشعار/شيلة رومانسية
║ ➤ .goodnight — رسالة تصبح على خير
║ ➤ .roseday — رسالة/صورة ليوم الورد
║ ➤ .character @user — صف شخصية المستخدم
║ ➤ .wasted @user — تأثير wasted على صورة
║ ➤ .ship @user — نسبة التوافق بين مستخدمين
║ ➤ .simp @user — مدح مبالغ به لشخص
║ ➤ .stupid @user [text] — سخرية مرحة من مستخدم
╚═══════════════════╝

╔═══════════════════╗
🔤 منشئ النصوص:
║ ➤ .metallic <text> — نص تأثير فلزي
║ ➤ .ice <text> — نص بتأثير جليدي
║ ➤ .snow <text> — نص بتأثير ثلجي
║ ➤ .impressive <text> — نص بتأثير رائع
║ ➤ .matrix <text> — نص بتأثير الماتريكس
║ ➤ .light <text> — نص بإضاءة
║ ➤ .neon <text> — نص بتأثير نيون
║ ➤ .devil <text> — نص بتأثير شيطاني
║ ➤ .purple <text> — نص بلون بنفسجي
║ ➤ .thunder <text> — نص بتأثير برق
║ ➤ .leaves <text> — نص بتأثير أوراق
║ ➤ .1917 <text> — نص بتأثير قديم/حربي
║ ➤ .arena <text> — نص بتأثير ساحة
║ ➤ .hacker <text> — نص بتأثير هاكر
║ ➤ .sand <text> — نص بتأثير رمال
║ ➤ .blackpink <text> — نص بتأثير بلاكبينك
║ ➤ .glitch <text> — نص بتأثير تشويش
║ ➤ .fire <text> — نص بتأثير نار
╚═══════════════════╝

╔═══════════════════╗
📥 أوامر التنزيل:
║ ➤ .play <song_name> — تشغيل أو تنزيل مقطع صوتي من يوتيوب
║ ➤ .song <song_name> — تنزيل أغنية
║ ➤ .spotify <query> — جلب مقاطع/معلومات من سبوتيفاي
║ ➤ .instagram <link> — تنزيل محتوى من إنستاجرام
║ ➤ .facebook <link> — تنزيل فيديو من فيسبوك
║ ➤ .tiktok <link> — تنزيل فيديو من تيك توك
║ ➤ .video <song name> — تنزيل فيديو لأغنية
║ ➤ .ytmp4 <Link> — تنزيل فيديو يوتيوب بصيغة MP4
╚═══════════════════╝

╔═══════════════════╗
🧩 متفرقات:
║ ➤ .heart — إرسال رمز قلب أو تأثير
║ ➤ .horny — محتوى مضحك/ساخر للونج
║ ➤ .circle — تأثير دائرة على الصورة
║ ➤ .lgbt — محتوى/رمز لدعم LGBT
║ ➤ .lolice — دعابة شرطة LOLICE
║ ➤ .its-so-stupid — محتوى ساخر
║ ➤ .namecard — بطاقة تعريفية للمستخدم
║ ➤ .oogway — اقتباسات/محتوى أوغواي
║ ➤ .tweet — مشاركة تغريدة أو جلبها
║ ➤ .ytcomment — إضافة تعليق على يوتيوب (إذا مدعوم)
║ ➤ .comrade — رسالة رفيق/نكتة
║ ➤ .gay — دعابة/وصف مرحة (استخدام بحذر)
║ ➤ .glass — تأثير زجاجي على الصورة
║ ➤ .jail — تأثير سجن على الصورة
║ ➤ .passed — تأثير نجاح/نجاة على الصورة
║ ➤ .triggered — تأثير مزعج/متحرك
╚═══════════════════╝

╔═══════════════════╗
🖼️ أنمي:
║ ➤ .nom — تعبير أكل/مضغ أنمي
║ ➤ .poke — نُكّح/دفشة أنمي
║ ➤ .cry — تعبير بكاء أنمي
║ ➤ .kiss — قبلة أنمي
║ ➤ .pat — تربيت على الرأس (أنمي)
║ ➤ .hug — عناق أنمي
║ ➤ .wink — غمزة أنمي
║ ➤ .facepalm — وجه facepalm أنمي
╚═══════════════════╝

╔═══════════════════╗
💻 أوامر GitHub:
║ ➤ .git — معلومات عن الريبو/النسخة
║ ➤ .github — رابط مستودع أو معلومات
║ ➤ .sc — عرض شفرة المصدر أو رابط السكربت
║ ➤ .script — عرض السكربت/أوامر ذات صلة
║ ➤ .repo — رابط المستودع أو تفاصيله
╚═══════════════════╝

Join our channel for updates:`;

try {
    const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
    
    if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: helpMessage,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363161513685998@newsletter',
                    newsletterName: 'KnightBot MD',
                    serverMessageId: -1
                }
            }
        },{ quoted: message });
    } else {
        console.error('Bot image not found at:', imagePath);
        await sock.sendMessage(chatId, { 
            text: helpMessage,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363161513685998@newsletter',
                    newsletterName: 'KnightBot MD by Mr Unique Hacker',
                    serverMessageId: -1
                } 
            }
        });
    }
} catch (error) {
    console.error('Error in help command:', error);
    await sock.sendMessage(chatId, { text: helpMessage });
}
}

module.exports = helpCommand;