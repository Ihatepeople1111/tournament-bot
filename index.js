require('./keep_alive');
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();
client.components = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
}

const componentsPath = path.join(__dirname, 'components');
const componentFiles = fs.readdirSync(componentsPath).filter(file => file.endsWith('.js'));
for (const file of componentFiles) {
  const filePath = path.join(componentsPath, file);
  const component = require(filePath);
  if ('name' in component && 'execute' in component) {
    client.components.set(component.name, component);
  }
}

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
    } else if (interaction.isButton()) {
      const component = client.components.get('interactionCreate');
      if (component) await component.execute(interaction);
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '❌ There was an error executing this command.', ephemeral: true });
    } else {
      await interaction.reply({ content: '❌ There was an error executing this command.', ephemeral: true });
    }
  }
});

const startLiveUpdater = require('./liveUpdater');
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  startLiveUpdater(client);
});

client.login(process.env.BOT_TOKEN);
