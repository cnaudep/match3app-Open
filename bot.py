from telegram import Update, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

BOT_TOKEN = "8107896003:AAGFOMPpV_FYlhSy9IHLkkc7o4KB51QcxLY"
GAME_URL = "https://bespoke-custard-d78cdf.netlify.app"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("▶ Играть", web_app=WebAppInfo(url=GAME_URL))]
    ])
    await update.message.reply_text("Добро пожаловать в Match-3!", reply_markup=keyboard)

if __name__ == "__main__":
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    print("Бот работает в фоне...")
    app.run_polling()