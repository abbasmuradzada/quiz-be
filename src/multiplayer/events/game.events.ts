export const GameEvents = {
  // Client -> Server
  JOIN_GAME: 'join_game',
  START_GAME: 'start_game',
  SUBMIT_ANSWER: 'submit_answer',
  LEAVE_GAME: 'leave_game',

  // Server -> Client
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  GAME_STARTED: 'game_started',
  NEXT_QUESTION: 'next_question',
  ANSWER_RESULT: 'answer_result',
  PLAYER_ANSWERED: 'player_answered',
  LEADERBOARD_UPDATE: 'leaderboard_update',
  GAME_FINISHED: 'game_finished',
  ERROR: 'error',
} as const;
