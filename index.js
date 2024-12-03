require("dotenv").config();
const { Api } = require("telegram");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");

const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const phoneNumber = process.env.TELEGRAM_PHONE;
const stringSession = new StringSession("");
const { NewMessage } = require("telegram/events");

const trackMessages = async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log("Connecting...");
  await client.start({
    phoneNumber: async () =>
      phoneNumber || (await input.text("Enter your phone number: ")),
    password: async () => await input.text("Enter your password (if any): "),
    phoneCode: async () => await input.text("Enter the code you received: "),
    onError: (err) => console.error("Error:", err),
  });

  console.log("Connected as user!");
  console.log("Your session string:", client.session.save());

  // List all groups
  const dialogs = await client.getDialogs();
  const groups = dialogs.filter(
    (dialog) => dialog.isGroup && !dialog.isChannel
  );

  console.log("Groups you're a member of:");
  groups.forEach((group, index) => {
    console.log(`${index + 1}. ${group.title} (ID: ${group.id})`);
  });

  // Prompt user to select a group to monitor
  const groupIndex =
    parseInt(
      await input.text("Enter the number of the group you want to monitor: ")
    ) - 1;
  const groupId = groups[groupIndex].id.value;

  // Monitor messages in the selected group
  // client.addEventHandler((update) => {
  //     if (update instanceof Api.UpdateNewMessage) {
  //         const message = update.message;
  //         console.log(message)
  //         if (message && message.peerId && message.peerId.channelId === groupId) {
  //             console.log(`Message received in group ${groups[groupIndex].title}: ${message.message}`);
  //         }
  //     }
  // }, new NewMessage({}));

  // Event handler for new messages
  client.addEventHandler(async (event) => {
    const message = event.message;
    if (message.isPrivate) {
      await client.sendMessage(message.senderId, {
        message: "Thank you for your message!",
        replyTo: message.id,
      });
    }
    // console.log(message, "all message");
    if (message && message.peerId && message.peerId.className === "PeerChat") {
      const chatId = message.peerId.chatId.value;
      console.log(chatId, groupId);
      if (-chatId === groupId) {
        console.log(
          `Message received in group ${groups[groupIndex].title}: ${message.message}`
        );
      }
    }
  }, new NewMessage({}));

  // Keep the client running
  console.log("Listening for new messages...");
};

(async () => {
  trackMessages();
})();
