require("dotenv").config();
const http = require("http");

const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Qenu Discord Bot is online!");
}).listen(PORT, "0.0.0.0");
const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  SlashCommandBuilder,
  REST,
  Routes,
  Events
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("Заполни DISCORD_TOKEN, CLIENT_ID и GUILD_ID в .env");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.Message]
});

const names = {
  categories: {
    entrance: "⛩・𝐄𝐍𝐓𝐑𝐀𝐍𝐂𝐄",
    community: "💬・𝐂𝐎𝐌𝐌𝐔𝐍𝐈𝐓𝐘",
    meet: "🌸・𝐌𝐄𝐄𝐓",
    gaming: "🎮・𝐆𝐀𝐌𝐈𝐍𝐆",
    creators: "🎬・𝐂𝐑𝐄𝐀𝐓𝐎𝐑𝐒",
    voice: "🔊・𝐕𝐎𝐈𝐂𝐄",
    support: "🎫・𝐒𝐔𝐏𝐏𝐎𝐑𝐓",
    sponsors: "💎・𝐒𝐏𝐎𝐍𝐒𝐎𝐑𝐒",
    staff: "🛡・𝐒𝐓𝐀𝐅𝐅",
    logs: "📋・𝐋𝐎𝐆𝐒"
  }
};

const roleNames = {
  owner: "👑 Owner",
  deputy: "⚜ Deputy Owner",
  admin: "🛡 Administrator",
  moderator: "🔨 Moderator",
  support: "🎫 Support",
  helper: "💬 Helper",
  sponsorVip: "👑 VIP Sponsor",
  sponsorPremium: "💎 Premium Sponsor",
  sponsor: "💠 Sponsor",
  member: "👤 Member",
  male: "♂・Парень",
  female: "♀・Девушка",
  dota: "🎮・Dota 2",
  anime: "🌸・Anime",
  youtube: "▶・YouTube",
  twitch: "🔴・Twitch",
  creator: "🎬・Creator"
};

const roleColors = {
  owner: 0x111111,
  deputy: 0x333333,
  admin: 0x5865F2,
  moderator: 0xED4245,
  support: 0x57F287,
  helper: 0xFEE75C,
  sponsorVip: 0xF1C40F,
  sponsorPremium: 0x9B59B6,
  sponsor: 0x3498DB,
  member: 0x95A5A6,
  male: 0x3498DB,
  female: 0xE91E63,
  dota: 0xC0392B,
  anime: 0xE84393,
  youtube: 0xFF0000,
  twitch: 0x9146FF,
  creator: 0x00B894
};

const commands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Создать структуру Qenu на сервере")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Повторно отправить панели Qenu")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Проверить работу бота")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log("Slash-команды зарегистрированы.");
}

function safeName(text) {
  return text.toLowerCase()
    .replace(/[^a-zа-я0-9_-]/gi, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "ticket";
}

async function getOrCreateRole(guild, name, color, permissions = []) {
  let role = guild.roles.cache.find(r => r.name === name);
  if (!role) {
    role = await guild.roles.create({
      name,
      color,
      permissions,
      reason: "Qenu server setup"
    });
  }
  return role;
}

async function getOrCreateCategory(guild, name) {
  let category = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name === name
  );
  if (!category) {
    category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      reason: "Qenu server setup"
    });
  }
  return category;
}

async function getOrCreateText(guild, name, parent, topic = "") {
  let ch = guild.channels.cache.find(
    c => c.type === ChannelType.GuildText && c.name === name && c.parentId === parent.id
  );
  if (!ch) {
    ch = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: parent.id,
      topic,
      reason: "Qenu server setup"
    });
  }
  return ch;
}

async function getOrCreateVoice(guild, name, parent) {
  let ch = guild.channels.cache.find(
    c => c.type === ChannelType.GuildVoice && c.name === name && c.parentId === parent.id
  );
  if (!ch) {
    ch = await guild.channels.create({
      name,
      type: ChannelType.GuildVoice,
      parent: parent.id,
      reason: "Qenu server setup"
    });
  }
  return ch;
}

async function setupServer(guild) {
  await guild.roles.fetch();

  const roles = {};
  for (const [key, name] of Object.entries(roleNames)) {
    roles[key] = await getOrCreateRole(guild, name, roleColors[key] ?? 0x5865F2);
  }

  const categories = {};
  for (const [key, name] of Object.entries(names.categories)) {
    categories[key] = await getOrCreateCategory(guild, name);
  }

  const channels = {};

  channels.welcome = await getOrCreateText(
    guild, "👋・добро-пожаловать", categories.entrance,
    "Добро пожаловать в Qenu — anime, gaming, Dota 2, YouTube, Twitch и общение."
  );
  channels.rules = await getOrCreateText(guild, "📜・правила", categories.entrance);
  channels.roles = await getOrCreateText(guild, "🎭・роли", categories.entrance);

  channels.chat = await getOrCreateText(guild, "💬・общий-чат", categories.community);
  channels.media = await getOrCreateText(guild, "🖼・медиа", categories.community);
  channels.memes = await getOrCreateText(guild, "😂・мемы", categories.community);
  channels.music = await getOrCreateText(guild, "🎵・музыка", categories.community);

  channels.dating = await getOrCreateText(guild, "🌸・знакомства", categories.meet);
  channels.selfies = await getOrCreateText(guild, "📸・селфи", categories.meet);
  channels.friends = await getOrCreateText(guild, "💌・ищу-друзей", categories.meet);
  channels.couple = await getOrCreateText(guild, "❤️・ищу-пару", categories.meet);
  channels.teammate = await getOrCreateText(guild, "🎮・ищу-тиммейта", categories.meet);
  channels.birthdays = await getOrCreateText(guild, "🎂・дни-рождения", categories.meet);

  channels.gaming = await getOrCreateText(guild, "🎮・игровой-чат", categories.gaming);
  channels.dota = await getOrCreateText(guild, "⚔・dota-2", categories.gaming);
  channels.party = await getOrCreateText(guild, "🏆・поиск-пати", categories.gaming);
  channels.moments = await getOrCreateText(guild, "🔥・моменты", categories.gaming);

  channels.youtube = await getOrCreateText(guild, "▶・youtube", categories.creators);
  channels.twitch = await getOrCreateText(guild, "🔴・twitch", categories.creators);
  channels.announcements = await getOrCreateText(guild, "📢・анонсы", categories.creators);
  channels.clips = await getOrCreateText(guild, "🎞・клипы", categories.creators);

  channels.generalVoice = await getOrCreateVoice(guild, "🔊・Общение", categories.voice);
  channels.dotaVoice = await getOrCreateVoice(guild, "🎮・Dota 2", categories.voice);
  channels.animeVoice = await getOrCreateVoice(guild, "🌸・Anime", categories.voice);
  channels.createVoice = await getOrCreateVoice(guild, "➕・Создать-комнату", categories.voice);

  channels.tickets = await getOrCreateText(guild, "🎫・создать-тикет", categories.support);
  channels.staffApply = await getOrCreateText(guild, "📝・набор-в-стафф", categories.staff);
  channels.staffChat = await getOrCreateText(guild, "💬・staff-chat", categories.staff);
  channels.staffVoice = await getOrCreateVoice(guild, "🛡・Staff Voice", categories.staff);

  channels.sponsors = await getOrCreateText(guild, "💎・спонсоры", categories.sponsors);
  channels.sponsorChat = await getOrCreateText(guild, "💬・sponsor-chat", categories.sponsors);

  channels.joinLeave = await getOrCreateText(guild, "📥・join-leave", categories.logs);
  channels.moderation = await getOrCreateText(guild, "🔨・moderation", categories.logs);
  channels.voiceLog = await getOrCreateText(guild, "🔊・voice-log", categories.logs);
  channels.ticketLog = await getOrCreateText(guild, "🎫・ticket-log", categories.logs);
  channels.roleLog = await getOrCreateText(guild, "🎭・role-log", categories.logs);
  channels.serverLog = await getOrCreateText(guild, "⚙・server-log", categories.logs);

  // Lock logs and staff-only categories.
  await categories.logs.permissionOverwrites.edit(guild.roles.everyone, {
    ViewChannel: false
  }).catch(() => {});

  await categories.staff.permissionOverwrites.edit(guild.roles.everyone, {
    ViewChannel: false
  }).catch(() => {});

  for (const key of ["admin", "moderator", "support", "helper"]) {
    await categories.staff.permissionOverwrites.edit(roles[key], {
      ViewChannel: true
    }).catch(() => {});
  }

  await categories.sponsors.permissionOverwrites.edit(guild.roles.everyone, {
    ViewChannel: false
  }).catch(() => {});
  for (const key of ["sponsor", "sponsorPremium", "sponsorVip"]) {
    await categories.sponsors.permissionOverwrites.edit(roles[key], {
      ViewChannel: true
    }).catch(() => {});
  }

  await sendWelcomePanel(channels.welcome);
  await sendRulesPanel(channels.rules);
  await sendRolePanel(channels.roles);
  await sendTicketPanel(channels.tickets);
  await sendStaffPanel(channels.staffApply);
  await sendSponsorPanel(channels.sponsors);

  return { roles, categories, channels };
}

async function sendOnce(channel, marker, payload) {
  const recent = await channel.messages.fetch({ limit: 30 }).catch(() => null);
  if (recent && recent.some(m => m.author.id === client.user.id && m.content.includes(marker))) return;
  await channel.send(payload);
}

async function sendWelcomePanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle("⛩ Добро пожаловать в Qenu")
    .setDescription(
      "Anime • Gaming • Dota 2 • YouTube • Twitch • Знакомства\n\n" +
      "Здесь можно найти тиммейтов, друзей, посмотреть стримы, обсудить аниме и просто пообщаться."
    )
    .setFooter({ text: "Qenu Community" });

  await sendOnce(channel, "[QENU-WELCOME]", {
    content: "[QENU-WELCOME]",
    embeds: [embed]
  });
}

async function sendRulesPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle("📜 Правила Qenu")
    .setDescription(
      "1. Уважайте участников.\n" +
      "2. Не спамьте и не флудите.\n" +
      "3. Запрещены мошенничество, вредоносные ссылки и рейды.\n" +
      "4. Не публикуйте чужие личные данные.\n" +
      "5. Контент 18+ — только если это разрешено правилами платформы; в обычных каналах его нет.\n" +
      "6. Слушайте Staff.\n\n" +
      "За серьёзные нарушения администрация может ограничить доступ."
    );
  await sendOnce(channel, "[QENU-RULES]", { content: "[QENU-RULES]", embeds: [embed] });
}

async function sendRolePanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle("🎭 Роли Qenu")
    .setDescription("Выбери интересы и дополнительные роли кнопками ниже.");
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("role_dota").setLabel("Dota 2").setEmoji("🎮").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("role_anime").setLabel("Anime").setEmoji("🌸").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("role_youtube").setLabel("YouTube").setEmoji("▶️").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("role_twitch").setLabel("Twitch").setEmoji("🔴").setStyle(ButtonStyle.Secondary)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("role_male").setLabel("Парень").setEmoji("♂️").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("role_female").setLabel("Девушка").setEmoji("♀️").setStyle(ButtonStyle.Primary)
  );
  await sendOnce(channel, "[QENU-ROLES]", { content: "[QENU-ROLES]", embeds: [embed], components: [row1, row2] });
}

async function sendTicketPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle("🎫 Qenu Support")
    .setDescription(
      "Нужна помощь? Создай приватное обращение.\n\n" +
      "🔵 Поддержка — вопрос по серверу\n" +
      "🔴 Жалоба — нарушение правил\n" +
      "🟣 Партнёрство — сотрудничество"
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_support").setLabel("Поддержка").setEmoji("🔵").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("ticket_report").setLabel("Жалоба").setEmoji("🔴").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("ticket_partner").setLabel("Партнёрство").setEmoji("🟣").setStyle(ButtonStyle.Secondary)
  );

  await sendOnce(channel, "[QENU-TICKETS]", { content: "[QENU-TICKETS]", embeds: [embed], components: [row] });
}

async function sendStaffPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle("🛡 Набор в Staff")
    .setDescription("Хочешь помогать серверу? Нажми кнопку и заполни короткую заявку.");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("staff_apply").setLabel("Подать заявку").setEmoji("📝").setStyle(ButtonStyle.Success)
  );

  await sendOnce(channel, "[QENU-STAFF]", { content: "[QENU-STAFF]", embeds: [embed], components: [row] });
}

async function sendSponsorPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle("💎 Спонсоры Qenu")
    .setDescription(
      "**💠 Sponsor**\n" +
      "• Sponsor-роль\n• Доступ к sponsor-чату\n• Участие в закрытых активностях\n\n" +
      "**💎 Premium Sponsor**\n" +
      "• Всё выше\n• Premium-роль\n• Приоритетная поддержка\n• Sponsor Voice\n\n" +
      "**👑 VIP Sponsor**\n" +
      "• Всё выше\n• Персональная роль\n• Возможность предложить эмодзи\n• Приоритет в мероприятиях\n\n" +
      "Покупка/выдача ролей настраивается администрацией."
    );
  await sendOnce(channel, "[QENU-SPONSORS]", { content: "[QENU-SPONSORS]", embeds: [embed] });
}

async function createTicket(interaction, type) {
  const guild = interaction.guild;
  const existing = guild.channels.cache.find(
    c => c.type === ChannelType.GuildText && c.topic === `qenu-ticket:${interaction.user.id}`
  );
  if (existing) {
    return interaction.reply({ content: `У тебя уже есть тикет: ${existing}`, ephemeral: true });
  }

  const supportRole = guild.roles.cache.find(r => r.name === roleNames.support);
  const category = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name === names.categories.support
  );

  const channel = await guild.channels.create({
    name: `🎫-${safeName(interaction.user.username)}`,
    type: ChannelType.GuildText,
    parent: category?.id,
    topic: `qenu-ticket:${interaction.user.id}`,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      ...(supportRole ? [{ id: supportRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : [])
    ]
  });

  const embed = new EmbedBuilder()
    .setTitle(`🎫 ${type}`)
    .setDescription(`Привет, ${interaction.user}! Опиши проблему подробно.\n\nКогда вопрос будет решён, Staff может закрыть тикет.`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_close").setLabel("Закрыть тикет").setEmoji("🔒").setStyle(ButtonStyle.Danger)
  );

  await channel.send({ content: `${interaction.user} ${supportRole ? `<@&${supportRole.id}>` : ""}`, embeds: [embed], components: [row] });
  await interaction.reply({ content: `Тикет создан: ${channel}`, ephemeral: true });

  const log = guild.channels.cache.find(c => c.name === "🎫・ticket-log");
  if (log) await log.send(`🎫 Тикет создан: ${channel} | ${interaction.user.tag} | ${type}`);
}

async function createTempVoice(member, guild) {
  const category = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name === names.categories.voice
  );
  if (!category) return;

  const voice = await guild.channels.create({
    name: `🔊・${member.user.username}`,
    type: ChannelType.GuildVoice,
    parent: category.id,
    userLimit: 0,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
      { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers] }
    ],
    reason: "Qenu temporary voice"
  });

  try {
    await member.voice.setChannel(voice);
  } catch {}

  const log = guild.channels.cache.find(c => c.name === "🔊・voice-log");
  if (log) await log.send(`🔊 Создан временный войс ${voice} для ${member.user.tag}`);
}

client.once(Events.ClientReady, async c => {
  console.log(`Бот запущен: ${c.user.tag}`);
  try {
    await registerCommands();
  } catch (e) {
    console.error("Не удалось зарегистрировать slash-команды:", e);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "ping") {
        return interaction.reply({ content: `🏓 Pong! ${client.ws.ping}ms`, ephemeral: true });
      }

      if (interaction.commandName === "setup") {
        await interaction.deferReply({ ephemeral: true });
        await setupServer(interaction.guild);
        return interaction.editReply("✅ Qenu успешно настроен. Проверь категории и панели на сервере.");
      }

      if (interaction.commandName === "panel") {
        await interaction.deferReply({ ephemeral: true });
        const guild = interaction.guild;
        const map = [
          ["👋・добро-пожаловать", sendWelcomePanel],
          ["📜・правила", sendRulesPanel],
          ["🎭・роли", sendRolePanel],
          ["🎫・создать-тикет", sendTicketPanel],
          ["📝・набор-в-стафф", sendStaffPanel],
          ["💎・спонсоры", sendSponsorPanel]
        ];
        for (const [channelName, fn] of map) {
          const ch = guild.channels.cache.find(c => c.name === channelName);
          if (ch) await fn(ch);
        }
        return interaction.editReply("✅ Панели проверены/обновлены.");
      }
    }

    if (interaction.isButton()) {
      const id = interaction.customId;

      if (id.startsWith("ticket_") && ["ticket_support", "ticket_report", "ticket_partner"].includes(id)) {
        const typeMap = {
          ticket_support: "🔵 Поддержка",
          ticket_report: "🔴 Жалоба",
          ticket_partner: "🟣 Партнёрство"
        };
        return createTicket(interaction, typeMap[id]);
      }

      if (id === "ticket_close") {
        await interaction.reply({ content: "🔒 Тикет закрывается...", ephemeral: true });
        const log = interaction.guild.channels.cache.find(c => c.name === "🎫・ticket-log");
        if (log) await log.send(`🔒 Тикет закрыт: #${interaction.channel.name} пользователем ${interaction.user.tag}`);
        setTimeout(() => interaction.channel.delete("Qenu ticket closed").catch(() => {}), 1500);
        return;
      }

      if (id === "staff_apply") {
        const modal = new ModalBuilder()
          .setCustomId("staff_modal")
          .setTitle("🛡 Заявка в Staff");

        const age = new TextInputBuilder()
          .setCustomId("age")
          .setLabel("Возраст")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(3);

        const experience = new TextInputBuilder()
          .setCustomId("experience")
          .setLabel("Опыт модерации")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000);

        const reason = new TextInputBuilder()
          .setCustomId("reason")
          .setLabel("Почему хочешь в Staff?")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1500);

        modal.addComponents(
          new ActionRowBuilder().addComponents(age),
          new ActionRowBuilder().addComponents(experience),
          new ActionRowBuilder().addComponents(reason)
        );

        return interaction.showModal(modal);
      }

      const roleMap = {
        role_dota: roleNames.dota,
        role_anime: roleNames.anime,
        role_youtube: roleNames.youtube,
        role_twitch: roleNames.twitch,
        role_male: roleNames.male,
        role_female: roleNames.female
      };

      if (roleMap[id]) {
        const role = interaction.guild.roles.cache.find(r => r.name === roleMap[id]);
        if (!role) return interaction.reply({ content: "Роль ещё не создана. Сначала запусти `/setup`.", ephemeral: true });

        if (interaction.member.roles.cache.has(role.id)) {
          await interaction.member.roles.remove(role);
          return interaction.reply({ content: `➖ Роль **${role.name}** снята.`, ephemeral: true });
        } else {
          await interaction.member.roles.add(role);
          return interaction.reply({ content: `➕ Роль **${role.name}** выдана.`, ephemeral: true });
        }
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === "staff_modal") {
      const age = interaction.fields.getTextInputValue("age");
      const experience = interaction.fields.getTextInputValue("experience");
      const reason = interaction.fields.getTextInputValue("reason");

      const channel = interaction.guild.channels.cache.find(c => c.name === "💬・staff-chat");
      const embed = new EmbedBuilder()
        .setTitle("🛡 Новая заявка в Staff")
        .addFields(
          { name: "Пользователь", value: `${interaction.user} (${interaction.user.tag})` },
          { name: "Возраст", value: age },
          { name: "Опыт", value: experience },
          { name: "Почему хочет в Staff", value: reason }
        )
        .setFooter({ text: `ID: ${interaction.user.id}` });

      if (channel) await channel.send({ embeds: [embed] });
      await interaction.reply({ content: "✅ Заявка отправлена администрации.", ephemeral: true });
    }
  } catch (err) {
    console.error(err);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "❌ Произошла ошибка. Проверь консоль бота.", ephemeral: true }).catch(() => {});
    }
  }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  if (!newState.channelId || oldState.channelId === newState.channelId) return;
  const channel = newState.channel;
  if (channel.name !== "➕・Создать-комнату") return;

  try {
    await createTempVoice(newState.member, newState.guild);
  } catch (e) {
    console.error("Temp voice error:", e);
  }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  if (!oldState.channelId) return;
  const channel = oldState.channel;
  if (!channel || channel.type !== ChannelType.GuildVoice) return;

  if (channel.parent?.name === names.categories.voice &&
      channel.name.startsWith("🔊・") &&
      channel.members.size === 0) {
    await channel.delete("Qenu temporary voice cleanup").catch(() => {});
  }
});

client.on(Events.GuildMemberAdd, async member => {
  const role = member.guild.roles.cache.find(r => r.name === roleNames.member);
  if (role) await member.roles.add(role).catch(() => {});
  const log = member.guild.channels.cache.find(c => c.name === "📥・join-leave");
  if (log) await log.send(`📥 ${member.user.tag} присоединился к серверу.`);
});

client.on(Events.GuildMemberRemove, async member => {
  const log = member.guild.channels.cache.find(c => c.name === "📥・join-leave");
  if (log) await log.send(`📤 ${member.user.tag} покинул сервер.`);
});

client.on(Events.MessageDelete, async message => {
  if (!message.guild || message.author?.bot) return;
  const log = message.guild.channels.cache.find(c => c.name === "🔨・moderation");
  if (log) await log.send(`🗑 Сообщение удалено в ${message.channel}: ${message.author?.tag ?? "неизвестно"}`);
});

client.login(TOKEN);
async function setupServer(guild) {
  console.log("Начинаю настройку сервера...");

  // =========================
  // РОЛИ
  // =========================

  const roles = {};

  roles.owner = await getOrCreateRole(
    guild,
    roleNames.owner,
    roleColors.owner,
    [PermissionFlagsBits.Administrator]
  );

  roles.deputy = await getOrCreateRole(
    guild,
    roleNames.deputy,
    roleColors.deputy,
    [PermissionFlagsBits.Administrator]
  );

  roles.admin = await getOrCreateRole(
    guild,
    roleNames.admin,
    roleColors.admin,
    [
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.ManageMessages
    ]
  );

  roles.moderator = await getOrCreateRole(
    guild,
    roleNames.moderator,
    roleColors.moderator,
    [
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.ManageMessages
    ]
  );

  roles.support = await getOrCreateRole(
    guild,
    roleNames.support,
    roleColors.support,
    []
  );

  roles.helper = await getOrCreateRole(
    guild,
    roleNames.helper,
    roleColors.helper,
    []
  );

  roles.sponsorVip = await getOrCreateRole(
    guild,
    roleNames.sponsorVip,
    roleColors.sponsorVip,
    []
  );

  roles.sponsorPremium = await getOrCreateRole(
    guild,
    roleNames.sponsorPremium,
    roleColors.sponsorPremium,
    []
  );

  roles.sponsor = await getOrCreateRole(
    guild,
    roleNames.sponsor,
    roleColors.sponsor,
    []
  );

  roles.member = await getOrCreateRole(
    guild,
    roleNames.member,
    roleColors.member,
    []
  );

  roles.male = await getOrCreateRole(
    guild,
    roleNames.male,
    roleColors.male,
    []
  );

  roles.female = await getOrCreateRole(
    guild,
    roleNames.female,
    roleColors.female,
    []
  );

  roles.dota = await getOrCreateRole(
    guild,
    roleNames.dota,
    roleColors.dota,
    []
  );

  roles.anime = await getOrCreateRole(
    guild,
    roleNames.anime,
    roleColors.anime,
    []
  );

  roles.youtube = await getOrCreateRole(
    guild,
    roleNames.youtube,
    roleColors.youtube,
    []
  );

  roles.twitch = await getOrCreateRole(
    guild,
    roleNames.twitch,
    roleColors.twitch,
    []
  );

  roles.creator = await getOrCreateRole(
    guild,
    roleNames.creator,
    roleColors.creator,
    []
  );

  // =========================
  // КАТЕГОРИИ
  // =========================

  const entrance = await getOrCreateCategory(
    guild,
    names.categories.entrance
  );

  const community = await getOrCreateCategory(
    guild,
    names.categories.community
  );

  const meet = await getOrCreateCategory(
    guild,
    names.categories.meet
  );

  const gaming = await getOrCreateCategory(
    guild,
    names.categories.gaming
  );

  const creators = await getOrCreateCategory(
    guild,
    names.categories.creators
  );

  const voice = await getOrCreateCategory(
    guild,
    names.categories.voice
  );

  const support = await getOrCreateCategory(
    guild,
    names.categories.support
  );

  const sponsors = await getOrCreateCategory(
    guild,
    names.categories.sponsors
  );

  const staff = await getOrCreateCategory(
    guild,
    names.categories.staff
  );

  const logs = await getOrCreateCategory(
    guild,
    names.categories.logs
  );

  // =========================
  // ENTRANCE
  // =========================

  const welcome = await getOrCreateText(
    guild,
    "👋・welcome",
    entrance,
    "Добро пожаловать на сервер Qenu!"
  );

  const rules = await getOrCreateText(
    guild,
    "📜・rules",
    entrance,
    "Правила сервера"
  );

  const rolesChannel = await getOrCreateText(
    guild,
    "🎭・roles",
    entrance,
    "Выбор ролей"
  );

  // =========================
  // COMMUNITY
  // =========================

  const general = await getOrCreateText(
    guild,
    "💬・general",
    community
  );

  const media = await getOrCreateText(
    guild,
    "🖼・media",
    community
  );

  const memes = await getOrCreateText(
    guild,
    "😂・memes",
    community
  );

  const music = await getOrCreateText(
    guild,
    "🎵・music",
    community
  );

  // =========================
  // MEET
  // =========================

  const dating = await getOrCreateText(
    guild,
    "💗・знакомства",
    meet
  );

  const selfies = await getOrCreateText(
    guild,
    "📸・селфи",
    meet
  );

  const friends = await getOrCreateText(
    guild,
    "👥・ищу-друзей",
    meet
  );

  const couple = await getOrCreateText(
    guild,
    "❤️・ищу-пару",
    meet
  );

  const teammate = await getOrCreateText(
    guild,
    "🎮・ищу-тиммейта",
    meet
  );

  // =========================
  // GAMING
  // =========================

  const gamingChat = await getOrCreateText(
    guild,
    "🎮・gaming",
    gaming
  );

  const dota = await getOrCreateText(
    guild,
    "🔥・dota-2",
    gaming
  );

  const party = await getOrCreateText(
    guild,
    "👥・поиск-пати",
    gaming
  );

  const moments = await getOrCreateText(
    guild,
    "🎥・moments",
    gaming
  );

  // =========================
  // CREATORS
  // =========================

  const youtube = await getOrCreateText(
    guild,
    "▶・youtube",
    creators
  );

  const twitch = await getOrCreateText(
    guild,
    "🔴・twitch",
    creators
  );

  const announcements = await getOrCreateText(
    guild,
    "📢・announcements",
    creators
  );

  const clips = await getOrCreateText(
    guild,
    "🎬・clips",
    creators
  );

  // =========================
  // VOICE
  // =========================

  const generalVoice = await getOrCreateVoice(
    guild,
    "🔊・Общение",
    voice
  );

  const dotaVoice = await getOrCreateVoice(
    guild,
    "🎮・Dota 2",
    voice
  );

  const animeVoice = await getOrCreateVoice(
    guild,
    "🌸・Anime",
    voice
  );

  const createRoom = await getOrCreateVoice(
    guild,
    "➕・Создать комнату",
    voice
  );

  // =========================
  // SUPPORT
  // =========================

  const ticketChannel = await getOrCreateText(
    guild,
    "🎫・create-ticket",
    support
  );

  // =========================
  // STAFF
  // =========================

  const staffRecruitment = await getOrCreateText(
    guild,
    "📋・набор-в-стафф",
    staff
  );

  const staffChat = await getOrCreateText(
    guild,
    "💬・staff-chat",
    staff
  );

  const staffVoice = await getOrCreateVoice(
    guild,
    "🛡・Staff Voice",
    staff
  );

  // =========================
  // SPONSORS
  // =========================

  const sponsorsChannel = await getOrCreateText(
    guild,
    "💎・sponsors",
    sponsors
  );

  const sponsorChat = await getOrCreateText(
    guild,
    "💬・sponsor-chat",
    sponsors
  );

  // =========================
  // LOGS
  // =========================

  const joinLogs = await getOrCreateText(
    guild,
    "📥・join-leave",
    logs
  );

  const moderationLogs = await getOrCreateText(
    guild,
    "🔨・moderation",
    logs
  );

  const voiceLogs = await getOrCreateText(
    guild,
    "🔊・voice-log",
    logs
  );

  const ticketLogs = await getOrCreateText(
    guild,
    "🎫・ticket-log",
    logs
  );

  // =========================
  // ПРИВАТНОСТЬ STAFF
  // =========================

  await staff.permissionOverwrites.edit(
    guild.roles.everyone,
    {
      ViewChannel: false
    }
  );

  await staff.permissionOverwrites.edit(
    roles.admin,
    {
      ViewChannel: true,
      SendMessages: true
    }
  );

  await staff.permissionOverwrites.edit(
    roles.moderator,
    {
      ViewChannel: true,
      SendMessages: true
    }
  );

  await staff.permissionOverwrites.edit(
    roles.support,
    {
      ViewChannel: true,
      SendMessages: true
    }
  );

  // =========================
  // ПРИВАТНОСТЬ LOGS
  // =========================

  await logs.permissionOverwrites.edit(
    guild.roles.everyone,
    {
      ViewChannel: false
    }
  );

  await logs.permissionOverwrites.edit(
    roles.admin,
    {
      ViewChannel: true,
      SendMessages: false
    }
  );

  await logs.permissionOverwrites.edit(
    roles.moderator,
    {
      ViewChannel: true,
      SendMessages: false
    }
  );

  // =========================
  // ПРИВАТНОСТЬ SPONSORS
  // =========================

  await sponsors.permissionOverwrites.edit(
    guild.roles.everyone,
    {
      ViewChannel: false
    }
  );

  await sponsors.permissionOverwrites.edit(
    roles.sponsor,
    {
      ViewChannel: true,
      SendMessages: true
    }
  );

  await sponsors.permissionOverwrites.edit(
    roles.sponsorPremium,
    {
      ViewChannel: true,
      SendMessages: true
    }
  );

  await sponsors.permissionOverwrites.edit(
    roles.sponsorVip,
    {
      ViewChannel: true,
      SendMessages: true
    }
  );

  // =========================
  // СОХРАНЯЕМ КАНАЛЫ
  // =========================

  global.qenuChannels = {
    welcome,
    rules,
    rolesChannel,

    general,
    media,
    memes,
    music,

    dating,
    selfies,
    friends,
    couple,
    teammate,

    gamingChat,
    dota,
    party,
    moments,

    youtube,
    twitch,
    announcements,
    clips,

    generalVoice,
    dotaVoice,
    animeVoice,
    createRoom,

    ticketChannel,

    staffRecruitment,
    staffChat,
    staffVoice,

    sponsorsChannel,
    sponsorChat,

    joinLogs,
    moderationLogs,
    voiceLogs,
    ticketLogs
  };

  global.qenuRoles = roles;

  console.log("✅ Структура Qenu создана.");
}
// =========================
// ОДНОРАЗОВАЯ ОТПРАВКА СООБЩЕНИЯ
// =========================

async function sendOnce(channel, content) {
  if (!channel) return;

  const messages = await channel.messages.fetch({
    limit: 20
  });

  const exists = messages.find(
    message =>
      message.author.id === client.user.id &&
      message.embeds.length > 0
  );

  if (!exists) {
    await channel.send(content);
  }
}

// =========================
// WELCOME
// =========================

async function sendWelcomePanel() {
  const channel = global.qenuChannels?.welcome;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle("⛩ Добро пожаловать на Qenu!")
    .setDescription(
      [
        "Добро пожаловать на наш сервер! 💙",
        "",
        "Здесь ты найдёшь:",
        "🎮 игры и поиск тиммейтов",
        "🌸 знакомства и общение",
        "🎬 YouTube / Twitch",
        "🎵 музыку и мемы",
        "🎫 поддержку",
        "",
        "Приятного общения!"
      ].join("\n")
    )
    .setColor(0x5865F2)
    .setFooter({
      text: "Qenu Community"
    });

  await sendOnce(channel, {
    embeds: [embed]
  });
}

// =========================
// RULES
// =========================

async function sendRulesPanel() {
  const channel = global.qenuChannels?.rules;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle("📜 Правила сервера")
    .setDescription(
      [
        "**1.** Уважай других участников.",
        "**2.** Не оскорбляй пользователей и администрацию.",
        "**3.** Не спамь и не флуди.",
        "**4.** Не публикуй запрещённый контент.",
        "**5.** Не рекламируй другие проекты без разрешения.",
        "**6.** Не используй баги и уязвимости.",
        "**7.** Следуй указаниям администрации.",
        "",
        "⚠️ За нарушение правил администрация может выдать предупреждение, мут, кик или бан."
      ].join("\n")
    )
    .setColor(0xED4245)
    .setFooter({
      text: "Qenu • Rules"
    });

  await sendOnce(channel, {
    embeds: [embed]
  });
}

// =========================
// РОЛИ
// =========================

async function sendRolesPanel() {
  const channel = global.qenuChannels?.rolesChannel;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle("🎭 Выбор ролей")
    .setDescription(
      [
        "Нажми на кнопку ниже, чтобы получить интересующую тебя роль.",
        "",
        "♂ **Парень**",
        "♀ **Девушка**",
        "🎮 **Dota 2**",
        "🌸 **Anime**",
        "▶ **YouTube**",
        "🔴 **Twitch**",
        "🎬 **Creator**"
        // =========================
// ВРЕМЕННАЯ ГОЛОСОВАЯ КОМНАТА
// =========================

async function createTempVoice(interaction) {
  const guild = interaction.guild;
  const member = interaction.member;

  const category = global.qenuChannels?.createRoom?.parent;

  if (!category) return;

  const channel = await guild.channels.create({
    name: `🔊・${member.user.username}`,
    type: ChannelType.GuildVoice,
    parent: category.id,

    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.Connect
        ]
      },
      {
        id: member.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.MoveMembers,
          PermissionFlagsBits.ManageChannels
        ]
      }
    ],

    reason: `Temporary voice room for ${member.user.tag}`
  });

  await member.voice.setChannel(channel);

  if (global.qenuChannels?.voiceLogs) {
    const embed = new EmbedBuilder()
      .setTitle("🔊 Создана временная комната")
      .addFields(
        {
          name: "Пользователь",
          value: `${member} (${member.user.tag})`
        },
        {
          name: "Комната",
          value: `${channel}`
        }
      )
      .setColor(0x5865F2)
      .setTimestamp();

    await global.qenuChannels.voiceLogs.send({
      embeds: [embed]
    });
  }
}

// =========================
// УДАЛЕНИЕ ПУСТОЙ ВРЕМЕННОЙ КОМНАТЫ
// =========================

async function cleanupTempVoice(channel) {
  if (!channel) return;

  if (
    channel.type !== ChannelType.GuildVoice ||
    !channel.parentId
  ) {
    return;
  }

  const createRoom =
    global.qenuChannels?.createRoom;

  if (!createRoom) return;

  if (channel.parentId !== createRoom.parentId) {
    return;
  }

  // Не удаляем обычные голосовые каналы
  const staticChannels = [
    "🔊・Общение",
    "🎮・Dota 2",
    "🌸・Anime",
    "➕・Создать комнату",
    "🛡・Staff Voice"
  ];

  if (staticChannels.includes(channel.name)) {
    return;
  }

  if (!channel.name.startsWith("🔊・")) {
    return;
  }

  if (channel.members.size === 0) {
    try {
      await channel.delete(
        "Qenu temporary voice cleanup"
      );

      console.log(
        `🗑 Удалена пустая временная комната: ${channel.name}`
      );
    } catch (error) {
      console.error(
        "Ошибка удаления временной комнаты:",
        error
      );
    }
  }
}

// =========================
// LOG MODERATION
// =========================

async function sendModerationLog({
  title,
  moderator,
  target,
  reason,
  color = 0xED4245
}) {
  const channel =
    global.qenuChannels?.moderationLogs;

  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .addFields(
      {
        name: "Модератор",
        value: `${moderator} (${moderator.user.tag})`
      },
      {
        name: "Пользователь",
        value: `${target} (${target.user.tag})`
      },
      {
        name: "Причина",
        value: reason || "Не указана"
      }
    )
    .setColor(color)
    .setTimestamp();

  await channel.send({
    embeds: [embed]
  });
}

// =========================
// READY
// =========================

client.once(
  Events.ClientReady,
  async readyClient => {
    console.log(
      `Бот запущен: ${readyClient.user.tag}`
    );

    try {
      await registerCommands();

      const guild =
        await client.guilds.fetch(GUILD_ID);

      await guild.channels.fetch();
      await guild.roles.fetch();

      await setupServer(guild);

      await sendAllPanels();

      console.log(
        "✅ Qenu Discord Bot полностью готов."
      );
    } catch (error) {
      console.error(
        "❌ Ошибка запуска:",
        error
      );
    }
  }
);

// =========================
// INTERACTIONS
// =========================

client.on(
  Events.InteractionCreate,
  async interaction => {

    try {

      // =========================
      // SLASH COMMANDS
      // =========================

      if (interaction.isChatInputCommand()) {

        // -------------------------
        // PING
        // -------------------------

        if (interaction.commandName === "ping") {

          const latency =
            Date.now() -
            interaction.createdTimestamp;

          return interaction.reply({
            content:
              `🏓 Pong!\n` +
              `Задержка: **${latency}ms**`,
            ephemeral: true
          });
        }

        // -------------------------
        // SETUP
        // -------------------------

        if (interaction.commandName === "setup") {

          await interaction.deferReply({
            ephemeral: true
          });

          await setupServer(
            interaction.guild
          );

          await sendAllPanels();

          return interaction.editReply(
            "✅ Сервер Qenu настроен."
          );
        }

        // -------------------------
        // PANEL
        // -------------------------

        if (interaction.commandName === "panel") {

          await interaction.deferReply({
            ephemeral: true
          });

          await sendAllPanels();

          return interaction.editReply(
            "✅ Панели отправлены."
          );
        }

        // -------------------------
        // BAN
        // -------------------------

        if (interaction.commandName === "ban") {

          const user =
            interaction.options.getUser("user");

          const reason =
            interaction.options.getString("reason") ||
            "Причина не указана";

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (!member) {
            return interaction.reply({
              content:
                "❌ Пользователь не найден на сервере.",
              ephemeral: true
            });
          }

          if (
            !member.bannable
          ) {
            return interaction.reply({
              content:
                "❌ Я не могу забанить этого пользователя. Проверь позицию моей роли.",
              ephemeral: true
            });
          }

          await member.ban({
            reason
          });

          await interaction.reply(
            `🔨 **${user.tag}** заблокирован.\nПричина: **${reason}**`
          );

          await sendModerationLog({
            title: "🔨 BAN",
            moderator: interaction.member,
            target: user,
            reason
          });

          return;
        }

        // -------------------------
        // KICK
        // -------------------------

        if (interaction.commandName === "kick") {

          const user =
            interaction.options.getUser("user");

          const reason =
            interaction.options.getString("reason") ||
            "Причина не указана";

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (!member) {
            return interaction.reply({
              content:
                "❌ Пользователь не найден на сервере.",
              ephemeral: true
            });
          }

          if (!member.kickable) {
            return interaction.reply({
              content:
                "❌ Я не могу кикнуть этого пользователя.",
              ephemeral: true
            });
          }

          await member.kick(reason);

          await interaction.reply(
            `👢 **${user.tag}** кикнут.\nПричина: **${reason}**`
          );

          await sendModerationLog({
            title: "👢 KICK",
            moderator: interaction.member,
            target: user,
            reason
          });

          return;
        }

        // -------------------------
        // MUTE
        // -------------------------

        if (interaction.commandName === "mute") {

          const user =
            interaction.options.getUser("user");

          const minutes =
            interaction.options.getInteger("minutes");

          const reason =
            interaction.options.getString("reason") ||
            "Причина не указана";

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (!member) {
            return interaction.reply({
              content:
                "❌ Пользователь не найден.",
              ephemeral: true
            });
          }

          if (!member.moderatable) {
            return interaction.reply({
              content:
                "❌ Я не могу выдать этому пользователю тайм-аут.",
              ephemeral: true
            });
          }

          await member.timeout(
            minutes * 60 * 1000,
            reason
          );

          await interaction.reply(
            `🔇 **${user.tag}** получил мут на **${minutes} мин.**\nПричина: **${reason}**`
          );

          await sendModerationLog({
            title: "🔇 MUTE",
            moderator: interaction.member,
            target: user,
            reason:
              `${reason}\nСрок: ${minutes} минут`
          });

          return;
        }

        // -------------------------
        // WARN
        // -------------------------

        if (interaction.commandName === "warn") {

          const user =
            interaction.options.getUser("user");

          const reason =
            interaction.options.getString("reason");

          await interaction.reply(
            `⚠️ **${user.tag}** получил предупреждение.\nПричина: **${reason}**`
          );

          await sendModerationLog({
            title: "⚠️ WARN",
            moderator: interaction.member,
            target: user,
            reason,
            color: 0xFEE75C
          });

          return;
        }

        // -------------------------
        // CLEAR
        // -------------------------

        if (interaction.commandName === "clear") {

          const amount =
            interaction.options.getInteger("amount");

          const deleted =
            await interaction.channel.bulkDelete(
              amount,
              true
            );

          return interaction.reply({
            content:
              `🧹 Удалено сообщений: **${deleted.size}**`,
            ephemeral: true
          });
        }
      }

      // =========================
      // СОЗДАТЬ ТИКЕТ
      // =========================

      if (
        interaction.isButton() &&
        interaction.customId === "create_ticket"
      ) {
        return createTicket(interaction);
      }

      // =========================
      // ЗАКРЫТЬ ТИКЕТ
      // =========================

      if (
        interaction.isButton() &&
        interaction.customId === "close_ticket"
      ) {

        await interaction.reply({
          content:
            "🔒 Тикет будет закрыт через 3 секунды.",
          ephemeral: true
        });

        const channel =
          interaction.channel;

        if (global.qenuChannels?.ticketLogs) {

          const embed = new EmbedBuilder()
            .setTitle("🔒 Тикет закрыт")
            .addFields(
              {
                name: "Закрыл",
                value:
                  `${interaction.user} (${interaction.user.tag})`
              },
              {
                name: "Канал",
                value:
                  `#${channel.name}`
              }
            )
            .setColor(0xED4245)
            .setTimestamp();

          await global.qenuChannels.ticketLogs.send({
            embeds: [embed]
          });
        }

        setTimeout(async () => {

          try {
            await channel.delete(
              "Qenu ticket closed"
            );
          } catch (error) {
            console.error(
              "Ошибка удаления тикета:",
              error
            );
          }

        }, 3000);

        return;
      }

      // =========================
      // STAFF APPLICATION
      // =========================

      if (
        interaction.isButton() &&
        interaction.customId === "staff_apply"
      ) {

        const modal =
          new ModalBuilder()
            .setCustomId("staff_application")
            .setTitle("Заявка в Qenu Staff");

        const age =
          new TextInputBuilder()
            .setCustomId("staff_age")
            .setLabel("Сколько тебе лет?")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(3);

        const activity =
          new TextInputBuilder()
            .setCustomId("staff_activity")
            .setLabel("Сколько времени ты онлайн?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000);

        const experience =
          new TextInputBuilder()
            .setCustomId("staff_experience")
            .setLabel("Есть ли опыт в администрации?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000);

        const reason =
          new TextInputBuilder()
            .setCustomId("staff_reason")
            .setLabel("Почему именно ты?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1500);

        modal.addComponents(
          new ActionRowBuilder().addComponents(age),
          new ActionRowBuilder().addComponents(activity),
          new ActionRowBuilder().addComponents(experience),
          new ActionRowBuilder().addComponents(reason)
        );

        return interaction.showModal(modal);
      }
            // =========================
      // ОТВЕТ НА ЗАЯВКУ STAFF
      // =========================

      if (
        interaction.isModalSubmit() &&
        interaction.customId === "staff_application"
      ) {
        const age =
          interaction.fields.getTextInputValue("staff_age");

        const activity =
          interaction.fields.getTextInputValue("staff_activity");

        const experience =
          interaction.fields.getTextInputValue("staff_experience");

        const reason =
          interaction.fields.getTextInputValue("staff_reason");

        const staffChannel =
          global.qenuChannels?.staffChat;

        const embed = new EmbedBuilder()
          .setTitle("📋 Новая заявка в Staff")
          .setDescription(
            `Заявка от ${interaction.user}`
          )
          .addFields(
            {
              name: "👤 Пользователь",
              value:
                `${interaction.user} (${interaction.user.tag})`
            },
            {
              name: "🎂 Возраст",
              value: age
            },
            {
              name: "⏰ Активность",
              value: activity
            },
            {
              name: "🛡 Опыт",
              value: experience
            },
            {
              name: "💬 Почему именно он?",
              value: reason
            }
          )
          .setColor(0x5865F2)
          .setTimestamp();

        if (staffChannel) {
          await staffChannel.send({
            embeds: [embed]
          });
        }

        return interaction.reply({
          content:
            "✅ Твоя заявка отправлена администрации!",
          ephemeral: true
        });
      }

      // =========================
      // КНОПКИ РОЛЕЙ
      // =========================

      if (
        interaction.isButton() &&
        interaction.customId.startsWith("role_")
      ) {
        const roleKey =
          interaction.customId.replace("role_", "");

        const role =
          global.qenuRoles?.[roleKey];

        if (!role) {
          return interaction.reply({
            content:
              "❌ Эта роль сейчас недоступна.",
            ephemeral: true
          });
        }

        const member =
          interaction.member;

        // Мужская / женская роль
        if (
          roleKey === "male" ||
          roleKey === "female"
        ) {
          const oppositeKey =
            roleKey === "male"
              ? "female"
              : "male";

          const oppositeRole =
            global.qenuRoles?.[oppositeKey];

          if (
            oppositeRole &&
            member.roles.cache.has(
              oppositeRole.id
            )
          ) {
            await member.roles.remove(
              oppositeRole
            );
          }
        }

        if (
          member.roles.cache.has(role.id)
        ) {
          await member.roles.remove(role);

          return interaction.reply({
            content:
              `❌ Роль **${role.name}** снята.`,
            ephemeral: true
          });
        }

        await member.roles.add(role);

        return interaction.reply({
          content:
            `✅ Роль **${role.name}** выдана.`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error(
        "Ошибка InteractionCreate:",
        error
      );

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content:
            "❌ Произошла ошибка при выполнении действия.",
          ephemeral: true
        }).catch(() => {});
      }
    }
  }
);

// =========================
// VOICE STATE UPDATE
// =========================

client.on(
  Events.VoiceStateUpdate,
  async (oldState, newState) => {

    try {

      // Пользователь зашёл
      // в "Создать комнату"

      if (
        newState.channelId ===
        global.qenuChannels?.createRoom?.id
      ) {
        await createTempVoice(
          newState
        );
      }

      // Пользователь вышел
      // из старой комнаты

      if (
        oldState.channel &&
        oldState.channelId !==
          newState.channelId
      ) {
        await cleanupTempVoice(
          oldState.channel
        );
      }

    } catch (error) {
      console.error(
        "Ошибка VoiceStateUpdate:",
        error
      );
    }
  }
);

// =========================
// НОВЫЙ УЧАСТНИК
// =========================

client.on(
  Events.GuildMemberAdd,
  async member => {

    try {

      const role =
        global.qenuRoles?.member;

      if (role) {
        await member.roles.add(role);
      }

      const channel =
        global.qenuChannels?.joinLogs;

      if (channel) {

        const embed = new EmbedBuilder()
          .setTitle("📥 Новый участник")
          .setDescription(
            `${member} присоединился к серверу.`
          )
          .addFields({
            name: "Пользователь",
            value:
              `${member.user.tag}\nID: ${member.id}`
          })
          .setColor(0x57F287)
          .setThumbnail(
            member.user.displayAvatarURL()
          )
          .setTimestamp();

        await channel.send({
          embeds: [embed]
        });
      }

    } catch (error) {
      console.error(
        "Ошибка GuildMemberAdd:",
        error
      );
    }
  }
);

// =========================
// УШЁЛ С СЕРВЕРА
// =========================

client.on(
  Events.GuildMemberRemove,
  async member => {

    try {

      const channel =
        global.qenuChannels?.joinLogs;

      if (!channel) return;

      const embed = new EmbedBuilder()
        .setTitle("📤 Участник покинул сервер")
        .setDescription(
          `${member.user.tag} покинул сервер.`
        )
        .addFields({
          name: "ID",
          value: member.id
        })
        .setColor(0xED4245)
        .setTimestamp();

      await channel.send({
        embeds: [embed]
      });

    } catch (error) {
      console.error(
        "Ошибка GuildMemberRemove:",
        error
      );
    }
  }
);

// =========================
// УДАЛЕНИЕ СООБЩЕНИЯ
// =========================

client.on(
  Events.MessageDelete,
  async message => {

    try {

      if (!message.guild) return;

      const channel =
        global.qenuChannels?.moderationLogs;

      if (!channel) return;

      if (message.author?.bot) return;

      const content =
        message.content ||
        "Текст сообщения недоступен.";

      const embed = new EmbedBuilder()
        .setTitle("🗑 Сообщение удалено")
        .addFields(
          {
            name: "Автор",
            value:
              message.author
                ? `${message.author} (${message.author.tag})`
                : "Неизвестно"
          },
          {
            name: "Канал",
            value:
              `${message.channel}`
          },
          {
            name: "Сообщение",
            value:
              content.slice(0, 1000)
          }
        )
        .setColor(0xED4245)
        .setTimestamp();

      await channel.send({
        embeds: [embed]
      });

    } catch (error) {
      console.error(
        "Ошибка MessageDelete:",
        error
      );
    }
  }
);

// =========================
// ОБРАБОТКА ОШИБОК
// =========================

client.on(
  Events.Error,
  error => {
    console.error(
      "Discord Client Error:",
      error
    );
  }
);

process.on(
  "unhandledRejection",
  error => {
    console.error(
      "Unhandled Promise Rejection:",
      error
    );
  }
);

process.on(
  "uncaughtException",
  error => {
    console.error(
      "Uncaught Exception:",
      error
    );
  }
);

// =========================
// ЗАПУСК БОТА
// =========================

client.login(TOKEN);
