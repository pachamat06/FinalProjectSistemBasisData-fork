import { useEffect } from 'react';
import { getSocket } from '../socket/socketClient';
import { useLeaderboardStore, useSystemStore, useGameStore, usePlayerStore } from '../store';

export function useSocketEvents(playerId) {
  const { setLeaderboard, setRecentWins } = useLeaderboardStore();
  const { setOnlineCount, addFeedItem } = useSystemStore();
  const { addResult, setNotification } = useGameStore();
  //const { updateBalance, refreshPlayer } = usePlayerStore();

  useEffect(() => {
    if (!playerId) return;
    const socket = getSocket(playerId);

    socket.on('leaderboard:update', (data) => setLeaderboard(data));
    socket.on('feed:recentWins', (data) => setRecentWins(data));
    socket.on('system:onlineCount', ({ count }) => setOnlineCount(count));

    socket.on('player:win', (result) => {
      addResult(result);
      //updateBalance(result.newBalance);
      if (result.isBigWin) {
        setNotification({ type: 'bigwin', message: `💰 BIG WIN! +${result.payout.toFixed(0)} coins!` });
      }
    });

    socket.on('player:lose', (result) => {
      addResult(result);
      //updateBalance(result.newBalance);
    });

    //socket.on('player:balance', ({ newBalance, playerId: pid }) => {
      //if (pid === playerId) updateBalance(newBalance);
    //});

    socket.on('system:bigWin', ({ username, payout }) => {
      addFeedItem({ type: 'bigwin', username, payout, timestamp: Date.now() });
    });

    socket.on('player:spin', (data) => {
      addFeedItem({ type: 'spin', ...data, timestamp: Date.now() });
    });

    return () => {
      socket.off('leaderboard:update');
      socket.off('feed:recentWins');
      socket.off('system:onlineCount');
      socket.off('player:win');
      socket.off('player:lose');
      socket.off('player:balance');
      socket.off('system:bigWin');
      socket.off('player:spin');
    };
  }, [playerId]);
}
