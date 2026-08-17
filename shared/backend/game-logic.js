const { broadcast, sendTo, pickRandom, initGameState } = require('./utils.js');
const { TRIVIA_QUESTIONS, TYPE_PROMPTS, CHARADES_WORDS, WYR_PROMPTS } = require('./game-data.js');

function startGameRound(room) {
  const game = room.game;
  if (!game || !game.active) return;

  game.currentRound++;
  game.roundActive = true;
  game.roundAnswers = {};

  switch (game.gameType) {
    case 'trivia': {
      const idx = pickRandom(TRIVIA_QUESTIONS, game.usedIndices);
      const q = TRIVIA_QUESTIONS[idx];
      game.roundData = q;
      broadcast(room, {
        type: 'game-round',
        round: game.currentRound,
        totalRounds: game.totalRounds,
        question: q.q,
        options: q.options,
        category: q.category,
        timeLimit: 15000,
      });
      game.roundTimer = setTimeout(() => endTriviaRound(room), 15500);
      break;
    }

    case 'typingrace': {
      const idx = pickRandom(TYPE_PROMPTS, game.usedIndices);
      const prompt = TYPE_PROMPTS[idx];
      game.roundData = { prompt };
      broadcast(room, {
        type: 'game-round',
        round: game.currentRound,
        totalRounds: game.totalRounds,
        prompt,
        timeLimit: 30000,
      });
      game.roundTimer = setTimeout(() => endTypingRound(room), 30500);
      break;
    }

    case 'charades': {
      const idx = pickRandom(CHARADES_WORDS, game.usedIndices);
      const word = CHARADES_WORDS[idx];
      const describerIdx = (game.currentRound - 1) % room.members.length;
      const describer = room.members[describerIdx];
      game.roundData = { word, describer: describer.username };

      sendTo(describer.ws, {
        type: 'game-round',
        round: game.currentRound,
        totalRounds: game.totalRounds,
        role: 'describer',
        word,
        timeLimit: 45000,
      });
      for (const m of room.members) {
        if (m.ws !== describer.ws) {
          sendTo(m.ws, {
            type: 'game-round',
            round: game.currentRound,
            totalRounds: game.totalRounds,
            role: 'guesser',
            describer: describer.username,
            timeLimit: 45000,
          });
        }
      }
      game.roundTimer = setTimeout(() => endCharadesRound(room, null), 45500);
      break;
    }

    case 'wyr': {
      const idx = pickRandom(WYR_PROMPTS, game.usedIndices);
      const prompt = WYR_PROMPTS[idx];
      game.roundData = prompt;
      broadcast(room, {
        type: 'game-round',
        round: game.currentRound,
        totalRounds: game.totalRounds,
        optionA: prompt.a,
        optionB: prompt.b,
        timeLimit: 15000,
      });
      game.roundTimer = setTimeout(() => endWYRRound(room), 15500);
      break;
    }
  }
}

function endTriviaRound(room) {
  const game = room.game;
  if (!game || !game.roundActive) return;
  game.roundActive = false;
  if (game.roundTimer) { clearTimeout(game.roundTimer); game.roundTimer = null; }

  broadcast(room, {
    type: 'game-round-end',
    correctAnswer: game.roundData ? game.roundData.answer : null,
    scores: game.scores,
    round: game.currentRound,
  });

  if (game.currentRound >= game.totalRounds) {
    setTimeout(() => endGame(room), 3000);
  } else {
    setTimeout(() => startGameRound(room), 3500);
  }
}

function endTypingRound(room) {
  const game = room.game;
  if (!game || !game.roundActive) return;
  game.roundActive = false;
  if (game.roundTimer) { clearTimeout(game.roundTimer); game.roundTimer = null; }

  broadcast(room, {
    type: 'game-round-end',
    scores: game.scores,
    round: game.currentRound,
    results: game.roundAnswers,
  });

  if (game.currentRound >= game.totalRounds) {
    setTimeout(() => endGame(room), 3000);
  } else {
    setTimeout(() => startGameRound(room), 3500);
  }
}

function endCharadesRound(room, winner) {
  const game = room.game;
  if (!game || !game.roundActive) return;
  game.roundActive = false;
  if (game.roundTimer) { clearTimeout(game.roundTimer); game.roundTimer = null; }

  broadcast(room, {
    type: 'game-round-end',
    word: game.roundData ? game.roundData.word : '',
    winner: winner || null,
    scores: game.scores,
    round: game.currentRound,
  });

  if (game.currentRound >= game.totalRounds) {
    setTimeout(() => endGame(room), 3000);
  } else {
    setTimeout(() => startGameRound(room), 4000);
  }
}

function endWYRRound(room) {
  const game = room.game;
  if (!game || !game.roundActive) return;
  game.roundActive = false;
  if (game.roundTimer) { clearTimeout(game.roundTimer); game.roundTimer = null; }

  let votesA = 0, votesB = 0;
  for (const v of Object.values(game.roundAnswers)) {
    if (v === 'a') votesA++;
    else if (v === 'b') votesB++;
  }

  broadcast(room, {
    type: 'game-round-end',
    votesA, votesB,
    totalVotes: votesA + votesB,
    round: game.currentRound,
  });

  if (game.currentRound >= game.totalRounds) {
    setTimeout(() => endGame(room), 3000);
  } else {
    setTimeout(() => startGameRound(room), 4000);
  }
}

function endGame(room) {
  const game = room.game;
  if (!game) return;
  game.active = false;
  if (game.roundTimer) { clearTimeout(game.roundTimer); game.roundTimer = null; }

  broadcast(room, {
    type: 'game-over',
    scores: game.scores,
    gameType: game.gameType,
  });
}

module.exports = {
  startGameRound,
  endTriviaRound,
  endTypingRound,
  endCharadesRound,
  endWYRRound,
  endGame,
};
