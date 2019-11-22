require("dotenv").config();

const discord = require("discord.js");
const client = new discord.Client();
const winston = require("winston");
const fetch = require("node-fetch");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // - Write all logs to console.
    new winston.transports.Console(),
    // - Write all logs error (and below) to `error.log`.
    new winston.transports.File({ filename: "error.log", level: "error" }),
    // - Write to all logs with level `info` and below to `combined.log`
    new winston.transports.File({ filename: "combined.log" })
  ]
});

function matchCode(text, callback) {
  let codes = text.match(
    /https:\/\/discord\.gift\/[abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789]+/
  );
  if (codes) {
    callback(codes[0]);
    return matchCode(text.slice(codes.index + codes[0].length), callback);
  } else {
    callback(null);
  }
}

client.on("ready", () => {
  logger.info(`Ready to accept nitro gift as ${client.user.tag}`);
});

client.on("message", message => {
  let codes = [];

  matchCode(message.content, code => {
    if (!code) return;
    if (!codes.includes(code)) codes.push(code);
  });

  if (codes.length == 0) return;

  codes.forEach(code => {
    fetch(
      "https://discordapp.com/api/v6/entitlements/gift-codes/" +
        code.split("/").pop() +
        "/redeem",
      {
        method: "POST",
        headers: {
          Accept: "*/*",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "en-US",
          Authorization: client.token,
          Connection: "keep-alive",
          "Content-Length": JSON.stringify({ channel_id: message.channel.id })
            .length,
          "Content-Type": "application/json",
          Host: "discordapp.com",
          Referer: `Referer: https://discordapp.com/channels/${message.channel.id}/${message.id}`,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) discord/0.0.305 Chrome/69.0.3497.128 Electron/4.0.8 Safari/537.36",
          "X-Super-Properties": Buffer.from(
            JSON.stringify({
              os: "Windows",
              browser: "Discord Client",
              release_channel: "stable",
              client_version: "0.0.305",
              os_version: "10.0.17134",
              os_arch: "x64",
              client_build_number: 41877,
              client_event_source: null
            }),
            "utf-8"
          ).toString("base64")
        },
        body: JSON.stringify({ channel_id: message.channel.id })
      }
    )
      .then(res => {
        if (res.status == 400 || res.status == 404) {
          logger.error(`[ERROR] CODE INVALID`);
          return;
        }
        res.json().then(json => {
          logger.debug(json);
          logger.info(`[SUCCESS] CODE REDEEMED`);
        });
      })
      .catch(err => {
        logger.error(err);
      });
  });
});

client.login(process.env.DISCORD_TOKEN);
