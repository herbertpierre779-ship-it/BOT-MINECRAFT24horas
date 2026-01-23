const mineflayer = require('mineflayer');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Aceita HEAD (UptimeRobot Free) e GET (Navegador)
app.all('/', (req, res) => {
  res.status(200).end(); 
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SISTEMA] Servidor de monitoramento ativo na porta ${PORT}`);
});

const PASSWORD = 'senha1234fgvirvj';

function createBot() {
  const bot = mineflayer.createBot({
    host: 'INPERION.aternos.me',
    port: 14447,
    username: 'INPERION_but',
    version: '1.21'
  });

  let timers = [];
  const safeInterval = (fn, ms) => {
    const t = setInterval(() => { if (bot.entity) fn(); }, ms);
    timers.push(t);
    return t;
  };

  bot.on('login', () => {
    console.log('[SISTEMA] Conectado ao servidor. Aguardando login...');
    // Delay de 5 segundos para garantir que o plugin de login carregou
    setTimeout(() => { if (bot.entity) bot.chat(`/login ${PASSWORD}`); }, 5000);
  });

  bot.once('spawn', () => {
    console.log('[SISTEMA] Bot deu spawn e está pronto.');

    let lastPosition = bot.entity.position.clone();
    let stuckTime = 0;

    // DETECTOR DE TRAVAMENTO (Se não se moveu em 30 segundos, força movimento em direções aleatórias)
    safeInterval(() => {
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

    // ANTI-AFK AGRESSIVO (Aternos desliga se o bot não interagir)
    safeInterval(() => {
      const actions = [
        () => { bot.setControlState('jump', true); setTimeout(() => bot.setControlState('jump', false), 500); },
        () => { bot.swingArm('right'); }, // Socar o ar conta como "interação com bloco" para alguns anti-afks
        () => { bot.setControlState('sneak', true); setTimeout(() => bot.setControlState('sneak', false), 1000); },
        () => { bot.chat('/time'); } // Comando inofensivo que força o servidor a responder o bot
      ];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      randomAction();
    }, 15000); // A cada 15 segundos ele faz algo "humano"

    // AUTO-JUMP NA ÁGUA (Prevenir AFK de afogamento)
    safeInterval(() => {
      const block = bot.blockAt(bot.entity.position);
      if (block && block.name.includes('water')) bot.setControlState('jump', true);
    }, 500);

    // BROADCAST MESSAGES
    safeInterval(() => {
      bot.chat('/broadcast Não é permitido usar hacks de combate, como fly, kill aura ou qualquer outro tipo de hack de combate, baritone e dupe não sao permitidos . No entanto, x-ray e permitido. Lembre-se, o servidor é semi-anárquico. Qualquer dúvida, entre no nosso DC.');
    }, 600000); // Every 10 minutes

    safeInterval(() => {
      bot.chat('/broadcast ENTRE NO NOSSO DISCORD: https://discord.com/invite/p7HRbtau5C');
    }, 900000); // Every 15 minutes
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

createBot();


