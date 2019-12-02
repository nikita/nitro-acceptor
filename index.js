require("dotenv").config();

const discord = require("discord.js");
const client = new discord.Client();
const winston = require("winston");
const rp = require("request-promise");

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

const matchCodes = text => {
  const codes = text.match(
    /https:\/\/discord\.gift\/[abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789]+/g
  );

  if (codes) {
    return codes;
  } else {
    return [];
  }
};

const logWithInfo = (isSuccess, message) => {
  logger.log({
    level: isSuccess ? "info" : "error",
    message: `${isSuccess ? "Code Redeemed" : "Code Invalid"} - Sent by ${
      message.author.username
    }#${message.author.discriminator}${
      message.channel.type === "text"
        ? ` Guild: ${message.guild.name} Channel: ${message.channel.name}`
        : ""
    } Type: ${message.channel.type}`
  });
};

client.on("ready", () => {
  logger.info(`Ready to accept nitro gift as ${client.user.tag}`);
});

client.on("message", message => {
  const codes = new Set(matchCodes(message.content));
  if (codes.length == 0) return;

  codes.forEach(async code => {
    try {
      const response = await rp.post({
        uri:
          "https://discordapp.com/api/v6/entitlements/gift-codes/" +
          code.split("/").pop() +
          "/redeem",
        headers: {
          Accept: "*/*",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "en-US",
          Authorization: client.token,
          Referer: `https://discordapp.com/channels/${message.channel.id}/${message.id}`,
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
        },
        body: { channel_id: message.channel.id },
        json: true,
        resolveWithFullResponse: true
      });

      logger.debug(response.body);
      logWithInfo(true, message);
    } catch (err) {
      if (err.name === "StatusCodeError") {
        if (err.response.statusCode == 400 || err.response.statusCode == 404) {
          logWithInfo(false, message);
        } else {
          logger.error(err);
        }
      } else {
        logger.error(err);
      }
    }
  });
});

client.login(process.env.DISCORD_TOKEN);
