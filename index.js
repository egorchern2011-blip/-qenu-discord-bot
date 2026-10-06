require("dotenv").config();

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
