const mineflayer = require('mineflayer');

const options = {
  host: 'INPERION.aternos.me', // IP do seu servidor
  port: 14447,                  // Porta do servidor
  username: 'INPERION_bot',     // Nome do bot
  version: false                // O Mineflayer detecta a versão automaticamente
};

function createBot() {
  const bot = mineflayer.createBot(options);

  bot.on('login', () => {
    console.log(`[${options.username}] Conectado com sucesso!`);
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    
    // Exemplo: Se alguém digitar "oi", o bot responde
    if (message === 'oi') {
      bot.chat(`Olá ${username}, eu sou o INPERION_bot!`);
    }
  });

  // Tenta reconectar caso o bot seja expulso ou o servidor caia
  bot.on('end', () => {
    console.log('Bot desconectado. Tentando reconectar em 5 segundos...');
    setTimeout(createBot, 5000);
  });

  bot.on('error', (err) => console.log('Erro no bot:', err));
}

createBot();
