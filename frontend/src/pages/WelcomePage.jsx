import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, usePlayerStore } from '../store';
import LoadingScreen from '../components/LoadingScreen';

const LOADING_DURATION_MS = 2500;
const FADE_OUT_MS         = 650;

export default function WelcomePage() {
  const navigate             = useNavigate();
  const { user }             = useAuthStore();
  const { loadPlayerFromAuth } = usePlayerStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.player) {
      loadPlayerFromAuth(user.player);
    }

    const loadTimer = setTimeout(() => {
      setIsLoading(false);

      setTimeout(() => {
        navigate('/', { replace: true });
      }, FADE_OUT_MS);
    }, LOADING_DURATION_MS);

    return () => clearTimeout(loadTimer);
  }, []);

  return <LoadingScreen isLoading={isLoading} />;
}