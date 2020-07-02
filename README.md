# Joystream Forum Post Notification Tool

Many thanks to [imOnlineMonitor](https://github.com/fkbenjamin/imOnlineMonitor) for providing example with polkadot chain (Kusama).\
This script will notify several events on Joystream chain to Telegram group/channel/chat of your choice.\
Current demo is https://t.me/jsforumnotification

## Getting Started
### Requirements

[Joystream Node](https://github.com/Joystream/helpdesk/tree/master/roles/validators#instructions)\
[Yarn and Nodejs](https://github.com/Joystream/helpdesk/tree/master/roles/storage-providers#install-yarn-and-node-on-linux)

### Run
   ```
   git clone https://github.com/bitoven-dev/joystreamtelegrambot
   cd joystreamtelegrambot
   yarn install
   ```
Replace `yourtoken` on `const token = 'yourtoken';` with your Telgram bot token. You can get it by talking to @botfather 

Replace `yourchatid` on `const chatid = 'yourchatid';` with your group/channel the bot will notify into. [How to get chatid](https://stackoverflow.com/questions/32423837/telegram-bot-how-to-get-a-group-chat-id)


Run `node yourchoiceofscript.js` preferably inside screen/tmux window

## License
[GPLv3](https://github.com/bitoven-dev/joystreamtelegrambot/blob/master/LICENSE)

### Notes

I've just started to learn programming (JS), so any suggestion or PR is greatly appreciated 😁
