const mineflayer = require('mineflayer');
const express = require('express');

const app = express();

// Aceita HEAD (UptimeRobot Free) e GET (Navegador)
app.all('/', (req, res) => {
  res.status(200).end();
});

const options = {
  host: 'INPERION.aternos.me', // IP do seu servidor
  port: 14447,                  // Porta do servidor
  username: 'INPERION_bot',     // Nome do bot
  version: false                // O Mineflayer detecta a versão automaticamente
};

const PASSWORD = 'senha1234fgvirvj';

function createBot() {
  const bot = mineflayer.createBot(options);
  const timers = []; // Array to track intervals

  bot.on('login', () => {
    console.log('[SISTEMA] Conectado ao servidor. Aguardando login...');
    // Delay de 5 segundos para garantir que o plugin de login carregou
    setTimeout(() => { if (bot.entity) bot.chat(`/login ${PASSWORD}`); }, 5000);
  });

  bot.on('spawn', () => {
    let lastPosition = bot.entity.position.clone();
    let stuckTime = 0;

    // DETECTOR DE TRAVAMENTO (Se não se moveu em 30 segundos, força movimento em direções aleatórias)
    const stuckInterval = setInterval(() => {
      if (!bot.entity) return; // Check if bot is still connected
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
    timers.push(stuckInterval);

    // ANTI-AFK AGRESSIVO (Aternos desliga se o bot não interagir)
    const afkInterval = setInterval(() => {
      const actions = [
        () => { bot.setControlState('jump', true); setTimeout(() => bot.setControlState('jump', false), 500); },
        () => { bot.swingArm('right'); }, // Socar o ar conta como "interação com bloco" para alguns anti-afks
        () => { bot.setControlState('sneak', true); setTimeout(() => bot.setControlState('sneak', false), 1000); },
        () => { bot.chat('/time'); } // Comando inofensivo que força o servidor a responder o bot
      ];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      randomAction();
    }, 15000); // A cada 15 segundos ele faz algo "humano"
    timers.push(afkInterval);

    // AUTO-JUMP NA ÁGUA (Prevenir AFK de afogamento)
    const waterInterval = setInterval(() => {
      if (!bot.entity) return;
      const block = bot.blockAt(bot.entity.position);
      if (block && block.name.includes('water')) bot.setControlState('jump', true);
    }, 500);
    timers.push(waterInterval);

    // BROADCAST MESSAGES
    const broadcast1Interval = setInterval(() => {
      bot.chat('/broadcast Não é permitido usar hacks de combate, como fly, kill aura ou qualquer outro tipo de hack de combate, baritone e dupe não são permitidos. No entanto, x-ray é permitido. Lembre-se, o servidor é semi-anárquico. Qualquer dúvida, entre no nosso DC.');
    }, 600000); // Every 10 minutes
    timers.push(broadcast1Interval);

    const broadcast2Interval = setInterval(() => {
      bot.chat('/broadcast ENTRE NO NOSSO DISCORD: https://discord.com/invite/p7HRbtau5C');
    }, 900000); // Every 15 minutes
    timers.push(broadcast2Interval);
  });

  // LOGS DE ERRO PARA VOCÊ VER NO CMD
  bot.on('kicked', (reason) => {
    console.log('[AVISO] Bot foi expulso. Motivo:', reason);
  });

  bot.on('error', (err) => {
    console.log('[ERRO] Erro de socket detectado:', err.code);
  });

  bot.on('end', () => {
    console.log('[RECONECTAR] A conexão caiu. Limpando memória e tentando em 30 segundos...');
    // Limpa todos os intervalos para não acumular processos no CMD
    timers.forEach(clearInterval);
    // 30 segundos de espera evita que o servidor bloqueie seu IP por "spam de login"
    setTimeout(createBot, 30000);
  });
}

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Start the bot
createBot();





