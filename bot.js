const mineflayer = require('mineflayer');

const options = {
  host: 'INPERION.aternos.me', // IP do seu servidor
  port: 14447,                  // Porta do servidor
  username: 'INPERION_bot',     // Nome do bot
  version: false                // O Mineflayer detecta a versão automaticamente
};

const PASSWORD = 'senha1234fgvirvj';

function createBot() {
  const bot = mineflayer.createBot(options);

  bot.on('login', () => {
    console.log(`[${options.username}] Conectado com sucesso!`);
    // Delay de 5 segundos para garantir que o plugin de login carregou
    setTimeout(() => {
      if (bot.entity) bot.chat(`/login ${PASSWORD}`);
    }, 5000);
  });

  bot.on('spawn', () => {
    console.log('[SISTEMA] Bot deu spawn e está pronto.');

    let lastPosition = bot.entity.position.clone();
    let stuckTime = 0;

    // DETECTOR DE TRAVAMENTO (Se não se moveu em 30 segundos, força movimento em direções aleatórias)
    const stuckInterval = setInterval(() => {
      const currentPos = bot.entity.position;
      const distance = currentPos.distanceTo(lastPosition);
      if (distance < 0.1) { // Menos de 0.1 bloco de movimento
        stuckTime += 5;
        if (stuckTime >= 30) { // Travado por 30 segundos
          console.log('[ANTI-STUCK] Bot travado! Tentando escapar...');
          // Tenta direções aleatórias para escapar
          const directions = ['forward', 'back', 'left', 'right'];
          const randomDir = directions[Math.floor(Math.random() * directions.length)];
          bot.setControlState(randomDir, true);
          setTimeout(() => bot.setControlState(randomDir, false), 3000); // Move por 3 segundos
          // Pula várias vezes enquanto move
          let jumpCount = 0;
          const jumpInterval = setInterval(() => {
            if (jumpCount < 5) {
              bot.setControlState('jump', true);
              setTimeout(() => bot.setControlState('jump', false), 500);
              jumpCount++;
            } else {
              clearInterval(jumpInterval);
            }
          }, 600); // Pula a cada 0.6 segundos
          stuckTime = 0; // Reseta contador
        }
      } else {
        stuckTime = 0; // Reseta se moveu
      }
      lastPosition = currentPos.clone();
    }, 5000); // Verifica a cada 5 segundos

    // Limpa o intervalo quando o bot desconectar
    bot.on('end', () => {
      clearInterval(stuckInterval);
    });
  });

  // Tenta reconectar caso o bot seja expulso ou o servidor caia
  bot.on('end', () => {
    console.log('Bot desconectado. Tentando reconectar em 5 segundos...');
    setTimeout(createBot, 5000);
  });

  bot.on('error', (err) => console.log('Erro no bot:', err));
}

createBot();
